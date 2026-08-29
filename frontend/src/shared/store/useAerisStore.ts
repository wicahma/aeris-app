import { create } from 'zustand';
import { ActiveTab, DatabaseInfo, TableSchema, QueryHistoryItem, ToastMessage, MetricsData } from '../types';
import { ApiClient } from '../api-client';

interface AerisState {
  activeTab: ActiveTab;
  activeDatabase: string;
  databases: DatabaseInfo[];
  schemas: TableSchema[];
  selectedTableForExplorer: string | null;
  queryHistory: QueryHistoryItem[];
  isCommandPaletteOpen: boolean;
  isMobileSidebarOpen: boolean;
  toasts: ToastMessage[];
  metricsHistory: MetricsData[];
  currentMetrics: MetricsData | null;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setActiveDatabase: (dbName: string) => Promise<void>;
  setSelectedTableForExplorer: (tableName: string | null) => void;
  loadDatabases: () => Promise<void>;
  loadSchemas: () => Promise<void>;
  createDatabase: (name: string, inMemory?: boolean) => Promise<void>;
  addHistoryItem: (item: Omit<QueryHistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  toggleCommandPalette: () => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  toggleMobileSidebar: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  updateMetrics: (metrics: MetricsData) => void;
}

export const useAerisStore = create<AerisState>((set, get) => ({
  activeTab: 'query-editor',
  activeDatabase: 'main.db',
  databases: [],
  schemas: [],
  selectedTableForExplorer: null,
  queryHistory: [],
  isCommandPaletteOpen: false,
  isMobileSidebarOpen: false,
  toasts: [],
  metricsHistory: [],
  currentMetrics: null,

  setActiveTab: (tab) => set({ activeTab: tab, isMobileSidebarOpen: false }),

  setActiveDatabase: async (dbName) => {
    await ApiClient.switchDatabase(dbName);
    set({ activeDatabase: dbName });
    await get().loadSchemas();
    get().addToast({
      type: 'info',
      title: 'Database Switched',
      message: `Active database is now ${dbName}`,
    });
  },

  setSelectedTableForExplorer: (tableName) => set({ selectedTableForExplorer: tableName, isMobileSidebarOpen: false }),

  loadDatabases: async () => {
    const dbs = await ApiClient.fetchDatabases();
    set({ databases: dbs });
  },

  loadSchemas: async () => {
    const schemas = await ApiClient.fetchSchemas(get().activeDatabase);
    set({ schemas });
    if (schemas.length > 0 && !get().selectedTableForExplorer) {
      set({ selectedTableForExplorer: schemas[0].name });
    }
  },

  createDatabase: async (name, inMemory = false) => {
    const newDb = await ApiClient.createDatabase(name, inMemory);
    await get().loadDatabases();
    await get().setActiveDatabase(newDb.name);
    get().addToast({
      type: 'success',
      title: 'Database Created',
      message: `Successfully initialized ${newDb.name}`,
    });
  },

  addHistoryItem: (item) => {
    const newItem: QueryHistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    set((state) => ({
      queryHistory: [newItem, ...state.queryHistory].slice(0, 50),
    }));
  },

  clearHistory: () => set({ queryHistory: [] }),

  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  updateMetrics: (metrics) => {
    set((state) => {
      const history = [...state.metricsHistory, metrics].slice(-30);
      return {
        currentMetrics: metrics,
        metricsHistory: history,
      };
    });
  },
}));