import { DatabaseInfo, TableSchema, QueryResult, MetricsData } from '../types';

let activeDbName = 'main.db';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('aeris_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export class ApiClient {
  static async fetchDatabases(): Promise<DatabaseInfo[]> {
    try {
      const res = await fetch('/api/v1/databases', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.map((d: any) => ({
          name: d.name || d,
          size: d.size_formatted || '0 KB',
          walMode: d.wal_mode ?? true,
          tableCount: d.table_count ?? 0,
          isInMemory: d.in_memory ?? false,
        }));
      }
    } catch (e) {}
    return [{ name: 'main.db', size: '0 KB', walMode: true, tableCount: 0, isInMemory: false }];
  }

  static async switchDatabase(dbName: string): Promise<{ success: boolean; activeDb: string }> {
    activeDbName = dbName;
    return { success: true, activeDb: dbName };
  }

  static async createDatabase(dbName: string, inMemory: boolean = false): Promise<DatabaseInfo> {
    const formattedName = dbName.endsWith('.db') ? dbName : `${dbName}.db`;
    try {
      const res = await fetch('/api/v1/databases', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: formattedName, in_memory: inMemory }),
      });
      if (res.ok) {
        const data = await res.json();
        activeDbName = formattedName;
        return {
          name: data.name || formattedName,
          size: data.size_formatted || '0 KB',
          walMode: true,
          tableCount: 0,
          isInMemory: inMemory,
        };
      }
    } catch (e) {}

    activeDbName = formattedName;
    return {
      name: formattedName,
      size: inMemory ? '0 KB (Memory)' : '0 KB',
      walMode: true,
      tableCount: 0,
      isInMemory: inMemory,
    };
  }

  static async fetchSchemas(dbName: string = activeDbName): Promise<TableSchema[]> {
    try {
      const res = await fetch(`/api/v1/schema/${encodeURIComponent(dbName)}/tables`, { headers: getAuthHeaders() });
      if (res.ok) {
        const tableNames: string[] = await res.json();
        const schemas: TableSchema[] = [];

        for (const tableName of tableNames) {
          const detailRes = await fetch(`/api/v1/schema/${encodeURIComponent(dbName)}/${encodeURIComponent(tableName)}`, { headers: getAuthHeaders() });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            schemas.push({
              name: tableName,
              rowCount: detail.row_count || 0,
              columns: (detail.columns || []).map((c: any) => ({
                name: c.name,
                type: (c.type || 'TEXT').toUpperCase(),
                primaryKey: c.primary_key || false,
                nullable: c.nullable ?? true,
                unique: c.unique || false,
                defaultValue: c.default_value,
              })),
              indexes: (detail.indexes || []).map((idx: any) => idx.name),
            });
          }
        }
        return schemas;
      }
    } catch (e) {}
    return [];
  }

  static async executeQuery(sql: string, dbName: string = activeDbName): Promise<QueryResult> {
    const startTime = performance.now();
    try {
      const res = await fetch('/api/v1/query/execute', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ database: dbName, query: sql }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          columns: [],
          rows: [],
          executionTimeMs: +(performance.now() - startTime).toFixed(2),
          query: sql,
          timestamp: Date.now(),
          error: data.error || 'Query execution failed',
        };
      }

      const rawRows = data.rows || [];
      const columns: string[] = data.columns || [];

      // Convert Go []interface{} rows to Record<string, any>[] objects for frontend tables
      const formattedRows = rawRows.map((row: any[]) => {
        if (Array.isArray(row)) {
          const obj: Record<string, any> = {};
          columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        }
        return row;
      });

      return {
        columns,
        rows: formattedRows,
        executionTimeMs: data.execution_time_ms || +(performance.now() - startTime).toFixed(2),
        affectedRows: data.affected_rows,
        query: sql,
        timestamp: Date.now(),
      };
    } catch (e: any) {
      return {
        columns: [],
        rows: [],
        executionTimeMs: +(performance.now() - startTime).toFixed(2),
        query: sql,
        timestamp: Date.now(),
        error: e.message || 'Failed to communicate with Aeris server',
      };
    }
  }

  static async fetchTableData(
    tableName: string,
    dbName: string = activeDbName,
    filter?: string,
    sortCol?: string,
    sortDir: 'ASC' | 'DESC' = 'ASC'
  ): Promise<{ columns: string[]; rows: Record<string, any>[]; totalRows: number }> {
    try {
      const res = await fetch(`/api/v1/collections/${encodeURIComponent(dbName)}/${encodeURIComponent(tableName)}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        let rows: Record<string, any>[] = Array.isArray(data) ? data : data.rows || [];
        const columns: string[] = data.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

        if (filter && filter.trim()) {
          const term = filter.toLowerCase();
          rows = rows.filter((r) =>
            Object.values(r).some((val) => String(val).toLowerCase().includes(term))
          );
        }

        if (sortCol) {
          rows.sort((a, b) => {
            const valA = a[sortCol];
            const valB = b[sortCol];
            if (valA < valB) return sortDir === 'ASC' ? -1 : 1;
            if (valA > valB) return sortDir === 'ASC' ? 1 : -1;
            return 0;
          });
        }

        return {
          columns,
          rows,
          totalRows: rows.length,
        };
      }
    } catch (e) {}

    return { columns: [], rows: [], totalRows: 0 };
  }

  static async updateCell(
    tableName: string,
    pkColumn: string,
    pkValue: any,
    column: string,
    newValue: any,
    dbName: string = activeDbName
  ): Promise<boolean> {
    const sql = `UPDATE "${tableName}" SET "${column}" = '${String(newValue).replace(/'/g, "''")}' WHERE "${pkColumn}" = '${String(pkValue).replace(/'/g, "''")}';`;
    const res = await ApiClient.executeQuery(sql, dbName);
    return !res.error;
  }

  static async insertRow(
    tableName: string,
    rowData: Record<string, any>,
    dbName: string = activeDbName
  ): Promise<Record<string, any>> {
    const cols = Object.keys(rowData);
    const vals = Object.values(rowData).map((v) => `'${String(v).replace(/'/g, "''")}'`);
    const sql = `INSERT INTO "${tableName}" ("${cols.join('", "')}") VALUES (${vals.join(', ')});`;
    const res = await ApiClient.executeQuery(sql, dbName);
    if (res.error) throw new Error(res.error);
    return rowData;
  }

  static async deleteRow(
    tableName: string,
    pkColumn: string,
    pkValue: any,
    dbName: string = activeDbName
  ): Promise<boolean> {
    const sql = `DELETE FROM "${tableName}" WHERE "${pkColumn}" = '${String(pkValue).replace(/'/g, "''")}';`;
    const res = await ApiClient.executeQuery(sql, dbName);
    return !res.error;
  }
}