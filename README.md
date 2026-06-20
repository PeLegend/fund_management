# Fund Management System

ระบบจัดการกองทุนสำหรับให้ลูกค้าเลือกนโยบายการลงทุนและสั่งซื้อผ่าน portfolio โดยระบบจะกระจายเงินลงทุนตามสัดส่วนหุ้นในนโยบายโดยอัตโนมัติ

## Tech Stack

- **Backend:** NestJS + TypeORM + PostgreSQL
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Infrastructure:** Docker Compose

## How to Run

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

### Seed Data

ระบบจะ seed ข้อมูลอัตโนมัติเมื่อเริ่มต้น:
- **Customers:** C001 (สมชาย ใจดี), C002 (สมหญิง รักเรียน)
- **Stocks:** PTT, SCB, CPALL, KBANK, BBL, ADVANC, TRUE, DTAC
- **Policies:** KMASTER (หุ้นไทย), TMBUSB (ตราสารหนี้), SCBDV (หุ้นปันผล)

### Running Tests

```bash
cd backend && npm test
```

## API Endpoints

### Policies
- `GET /policies` — list all policies with stock weights
- `GET /policies/:policy_code` — policy detail

### Portfolios
- `GET /portfolios?customer_code=C001` — customer's portfolios
- `POST /portfolios` — create portfolio `{ customer_code, policy_code }`
- `GET /portfolios/:portfolio_code` — portfolio detail

### Orders
- `GET /orders?portfolio_code=P001` — portfolio's orders
- `POST /orders` — create order `{ portfolio_code, amount }`
- `GET /orders/:order_code` — order detail with allocation
- `PATCH /orders/:order_code/cancel` — cancel PENDING order
- `PATCH /orders/:order_code/status` — manual status change

## Design Decisions

### API Structure
- RESTful resource naming (`/policies`, `/portfolios`, `/orders`)
- `PATCH` for status updates (partial resource update)
- Separate `/cancel` endpoint for business action clarity
- Query params for filtering (`?customer_code=`, `?portfolio_code=`)

### Status Transition
Explicit state machine in service layer:
```
PENDING → PROCESSING → COMPLETED/FAILED
PENDING → FAILED (cancel)
```
- Service validates allowed transitions before save
- Clear error messages for invalid transitions
- Auto-processing via setTimeout (2s → PROCESSING, 5s → COMPLETED/FAILED)

### Index Strategy
| Table | Index | Reason |
|---|---|---|
| `portfolios` | `customer_id` | Query portfolios by customer |
| `portfolios` | `portfolio_code` | Lookup by code in order creation |
| `orders` | `portfolio_id, status` | Composite: duplicate order check (index-only scan) |
| `orders` | `portfolio_id, created_at DESC` | Latest order per portfolio |
| `policy_stocks` | `policy_id` | Get stocks for allocation |
| `order_stocks` | `order_id` | Get allocation snapshot per order |

### Tradeoffs

| Decision | Choice | Reason |
|---|---|---|
| UUID vs Serial PK | UUID | Prevent enumeration, future distribution |
| Order stock snapshot | Yes | Audit trail accurate if policy weights change |
| Status transition in service | Yes | Clear error messages vs DB constraints |
| No auth | customer_code direct | Scope simplicity for interview test |
| Polling vs WebSocket | Polling | Simpler, matches scope |

## What's Missing

- **Authentication & Authorization** — no JWT/session, uses customer_code directly
- **Real-time updates** — uses polling (3s interval) instead of WebSocket
- **Pagination** — order list has no cursor/offset pagination
- **Retry mechanism** — no retry queue for failed PROCESSING orders
- **Admin panel** — status transitions via API only
- **E2E tests** — only unit tests (duplicate order), no integration tests

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://fund_user:fund_pass@db:5432/fund_db` | PostgreSQL connection |
| `PORT` | `3001` | Backend port |
| `VITE_API_URL` | `http://localhost:3001` | Backend API URL for frontend |
