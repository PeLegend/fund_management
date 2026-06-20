# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fund Management System — a mid-level engineer interview test. Customers select investment policies, create portfolios, and place orders. The system automatically allocates funds across stocks based on policy weights.

## Commands

### Docker (full system)
```bash
docker-compose up --build        # Start all services (db, backend, frontend)
docker-compose down              # Stop all services
docker-compose down -v           # Stop and remove volumes (fresh database)
```

### Backend (NestJS)
```bash
cd backend
npm run build                    # Compile TypeScript
npm run start:dev                # Dev server with hot reload
npm test                         # Run unit tests (Jest, --forceExit)
npm run start:prod               # Production mode
```

### Frontend (React + Vite)
```bash
cd frontend
npm run build                    # TypeScript check + Vite build
npm run dev                      # Dev server (port 3000)
npm run preview                  # Preview production build
```

## Architecture

```
React :3000 → NestJS API :3001 → PostgreSQL :5432
(all in Docker Compose)
```

**Backend** (`backend/src/`):
- NestJS modules: `customers/`, `policies/`, `portfolios/`, `orders/`
- TypeORM entities with UUID primary keys
- `database/seed/seed.service.ts` — idempotent seeding on `onModuleInit()`
- `common/filters/` and `common/interceptors/` for error/response formatting
- Orders module has auto-processing via setTimeout (2s→PROCESSING, 5s→COMPLETED/FAILED)

**Frontend** (`frontend/src/`):
- Vite + React + TypeScript (strict, no `any`)
- shadcn/ui components in `components/ui/` (Button, Card, Dialog, AlertDialog, Select, Badge, Input, Label)
- Revolut design tokens in `tailwind.config.ts` (colors under `revolut.*`, border-radius scale)
- Custom hooks in `hooks/` (usePolicies, usePortfolios, useOrders)
- Auth context stores `customer_code` in localStorage
- Orders page polls every 3s for status updates

**Key business rules:**
- 1 portfolio per policy per customer
- No new order if PENDING or PROCESSING exists in same portfolio
- Cancel only allowed for PENDING orders
- Order stock snapshots preserve allocation at time of order

## API Endpoints

| Resource | Methods |
|---|---|
| `/policies` | GET (list), GET `/:policy_code` (detail) |
| `/portfolios` | GET `?customer_code=`, POST, GET `/:portfolio_code` |
| `/orders` | GET `?portfolio_code=`, POST, GET `/:order_code`, PATCH `/:order_code/cancel`, PATCH `/:order_code/status` |

## Key Files

- `architecture.md` — full architecture design (Thai), DB schema, API spec, tradeoffs
- `docs.md` — interview test requirements (Thai), seed data, business rules
- `DESIGN.md` — Revolut design system reference (unrelated to fund management domain)
