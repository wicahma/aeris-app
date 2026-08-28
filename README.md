# 🚀 Aeris App — Single-Binary Web Application

> **Project Aeris Application Core: Golang Clean Architecture Backend Engine & React + Vite Web Console.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.22+-blue.svg)](https://golang.org/)
[![React Version](https://img.shields.io/badge/React-18.3+-indigo.svg)](https://react.dev/)

This repository contains the full-stack core application for **Project Aeris**, featuring:
* **Backend:** Golang Clean Architecture (`domain`, `engine`, `repository`, `usecase`, `delivery/http`).
* **Frontend:** React + TypeScript + Vite + CodeMirror 6 + TanStack Data Grid.
* **Packaging:** Single binary Go server with embedded frontend assets (`//go:embed`).

---

## 🚀 Quick Start

```bash
# 1. Build Frontend Bundle
cd frontend
npm install
npm run build

# 2. Compile Single Binary Server
cd ../backend
cp -r ../frontend/dist cmd/server/dist
go mod tidy
go build -o aeris-server ./cmd/server

# 3. Launch Server
./aeris-server --port 8080 --data-dir ./data
```

---

## 🌐 Live Web Application
* **Production App:** [https://aeris-app.diama.dev/](https://aeris-app.diama.dev/)
* **Notion Command Center:** [🚀 Aeris Command Center](https://app.notion.com/p/3c9955456c7a8136b8a7dcb0bdcec9de)
