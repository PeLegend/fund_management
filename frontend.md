# Frontend Documentation — Fund Management System

## Overview

Frontend สร้างด้วย **React + TypeScript + Vite** ใช้ **Tailwind CSS** + **shadcn/ui** สำหรับ UI components สื่อสารกับ NestJS backend ผ่าน REST API (axios) deploy ผ่าน Nginx บน port 3000

```
React SPA (Vite) ──axios──▶ NestJS API :3001 ──▶ PostgreSQL :5432
     :3000 (Nginx)
```

---

## 1. Tech Stack

| Technology | Version | 用途 |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | strict (no `any`) | Type safety |
| Vite | 5.x | Build tool + dev server |
| React Router | 6 | Client-side routing |
| Axios | latest | HTTP client |
| Tailwind CSS | 3 | Utility-first CSS |
| shadcn/ui | latest | Component primitives (Button, Card, Dialog, Select, Badge, Input, Label, AlertDialog) |
| clsx + tailwind-merge | latest | Conditional classnames |

---

## 2. Folder Structure

```
src/
├── main.tsx                      # React entry point
├── App.tsx                       # Router definition
├── index.css                     # Tailwind base styles
│
├── api/
│   └── client.ts                 # Axios instance + error parser + API functions
│
├── types/
│   ├── policy.types.ts           # Policy, PolicyStock interfaces
│   ├── portfolio.types.ts        # Portfolio interface
│   └── order.types.ts            # Order, OrderStock, OrderStatus types
│
├── hooks/
│   ├── usePolicies.ts            # Fetch all policies
│   ├── usePortfolios.ts          # Fetch portfolios by customer code
│   └── useOrders.ts              # Fetch orders with 3s polling
│
├── contexts/
│   └── AuthContext.tsx            # Customer code auth via localStorage
│
├── pages/
│   ├── LoginPage.tsx             # /login — customer code input
│   ├── PoliciesPage.tsx          # /policies — policy list with stock allocations
│   ├── PortfoliosPage.tsx        # /portfolios — portfolio management + create modal
│   └── OrdersPage.tsx            # /orders — order creation, listing, cancellation
│
├── components/
│   ├── Layout.tsx                # Header + nav + Outlet wrapper
│   ├── PolicyCard.tsx            # Policy display card
│   ├── PortfolioCard.tsx         # Portfolio card with latest order status
│   ├── OrderTable.tsx            # Order table with cancel button
│   ├── CreatePortfolioModal.tsx  # Modal for creating new portfolio
│   ├── StatusBadge.tsx           # Order status badge (PENDING/PROCESSING/COMPLETED/FAILED)
│   └── ui/                       # shadcn/ui primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── select.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── alert-dialog.tsx
│
└── lib/
    └── utils.ts                  # cn() utility for Tailwind class merging
```

---

## 3. Routing

ใช้ **React Router v6** แบบ nested routes โดยมี `Layout` component เป็น wrapper สำหรับหน้าที่ต้อง login ก่อน

```
/login              → LoginPage (public)
/                   → ProtectedRoute → Layout
  /                 → Redirect to /policies
  /policies         → PoliciesPage
  /portfolios       → PortfoliosPage
  /orders           → OrdersPage
```

### Auth Guard

`ProtectedRoute` เช็ค `customerCode` จาก AuthContext ถ้า `null` จะ redirect ไป `/login`

---

## 4. Authentication

ไม่ใช่ real auth (ไม่มี password / JWT) — เป็นแค่ customer code selector เก็บใน `localStorage`

### AuthContext

```typescript
interface AuthContextType {
  customerCode: string | null;
  login: (code: string) => void;    // save to localStorage + set state
  logout: () => void;               // remove from localStorage + null state
}
```

- `login(code)` — uppercase + เก็บใน `localStorage.customer_code`
- `logout()` — ลบจาก localStorage
- Persist ข้าม refresh ด้วย `localStorage.getItem('customer_code')`

---

## 5. Type Definitions

### Policy

```typescript
interface Policy {
  id: string;
  policy_code: string;
  name: string;
  created_at: string;
  policy_stocks: PolicyStock[];
}

interface PolicyStock {
  id: string;
  policy_id: string;
  stock_id: string;
  weight: number;
  stock: { id: string; stock_code: string; name: string };
}
```

### Portfolio

```typescript
interface Portfolio {
  id: string;
  portfolio_code: string;
  customer_id: string;
  policy_id: string;
  created_at: string;
  policy: Policy;
  orders?: Order[];       // จาก backend (latest order status)
}
```

### Order

```typescript
type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface Order {
  id: string;
  order_code: string;
  portfolio_id: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_stocks: OrderStock[];
}

interface OrderStock {
  id: string;
  order_id: string;
  stock_id: string;
  weight: number;
  allocated_amount: number;
  stock: { id: string; stock_code: string; name: string };
}
```

---

## 6. API Layer (`api/client.ts`)

### Axios Instance

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});
```

### Error Handling

```typescript
interface ApiError {
  statusCode: number;
  message: string;
}

function parseApiError(error: unknown): ApiError {
  // Extract status + message from AxiosError.response
  // Fallback: { statusCode: 500, message: 'An unexpected error occurred' }
}
```

### API Functions

| Function | Method | Endpoint | Return |
|---|---|---|---|
| `policiesApi.list()` | GET | `/policies` | `Policy[]` |
| `policiesApi.getByCode(code)` | GET | `/policies/:code` | `Policy` |
| `portfoliosApi.list(customer_code)` | GET | `/portfolios?customer_code=` | `Portfolio[]` |
| `portfoliosApi.create(customer_code, policy_code)` | POST | `/portfolios` | `Portfolio` |
| `ordersApi.list(portfolio_code)` | GET | `/orders?portfolio_code=` | `Order[]` |
| `ordersApi.create(portfolio_code, amount)` | POST | `/orders` | `Order` |
| `ordersApi.cancel(order_code)` | PATCH | `/orders/:code/cancel` | `Order` |

---

## 7. Custom Hooks

### `usePolicies()`

- ไม่มี parameter
- Fetch ทุก policies ตอน mount
- Return: `{ policies, loading, error, refetch }`

### `usePortfolios(customerCode: string | null)`

- รับ `customerCode` — ถ้า `null` จะ skip fetch
- Fetch เมื่อ `customerCode` เปลี่ยน
- Return: `{ portfolios, loading, error, refetch }`

### `useOrders(portfolioCode: string | null)`

- รับ `portfolioCode` — ถ้า `null` จะ skip fetch
- **Polling**: `setInterval` ทุก 3 วินาที เช็คว่ามี order status PENDING หรือ PROCESSING ไหม ถ้ามีจะ fetch ใหม่
- Cleanup interval ตอน unmount หรือ `portfolioCode` เปลี่ยน
- Return: `{ orders, loading, error, refetch }`

---

## 8. Pages

### LoginPage (`/login`)

- Form: input customer code + "Sign In" button
- Validate non-empty → `login(code.toUpperCase())` → navigate to `/policies`
- Hint: "Available codes: C001, C002"

### PoliciesPage (`/policies`)

- ใช้ `usePolicies()` hook
- Render loading spinner, error state, หรือ grid ของ `<PolicyCard>` (2-col md, 3-col lg)
- แต่ละ card แสดง policy name, code, รายการ stocks พร้อม weight%

### PortfoliosPage (`/portfolios`)

- ใช้ `usePortfolios(customerCode)` + `usePolicies()`
- "Create Portfolio" button → เปิด `<CreatePortfolioModal>`
- ถ้าไม่มี portfolio → empty state message
- Render grid ของ `<PortfolioCard>` — แต่ละ card แสดง latest order status จาก `portfolio.orders?.[0]`
- `handleCreate` → `portfoliosApi.create(customerCode, policyCode)` → refetch

### OrdersPage (`/orders`)

- ใช้ `usePortfolios(customerCode)` สำหรับ portfolio dropdown
- เมื่อเลือก portfolio → ใช้ `useOrders(selectedPortfolio)` สำหรับ order list
- "New Order" form: amount input + "Create Order" button
- `<OrderTable>` แสดง order list พร้อม cancel button (เฉพาะ PENDING)
- Error จาก create/cancel แสดง inline

---

## 9. Components

### Layout

- Sticky header: "Fund Management" title + 3 NavLink (Policies, Portfolios, Orders) + customer code display + Logout button
- `<Outlet />` สำหรับ render child routes
- Active NavLink แสดง bg-revolut-primary

### PolicyCard

- Card แสดง policy name, code, รายการ stocks (stock_code + name + weight%)

### PortfolioCard

- Card แสดง portfolio code, policy name/code, stock allocation badges
- แสดง `StatusBadge` ของ latest order (ถ้ามี)

### OrderTable

- Table: Order Code, Amount (Thai locale + "บาท"), Status badge, Created timestamp, Actions
- Cancel button เฉพาะ PENDING orders — มี AlertDialog ยืนยันก่อน cancel
- Empty state ถ้าไม่มี orders

### CreatePortfolioModal

- Dialog modal: policy dropdown selector + Create/Cancel buttons
- Error message แสดงใน modal
- ปิด modal + reset หลัง create สำเร็จ

### StatusBadge

- Map `OrderStatus` → Badge variant:
  - PENDING → `pending` (เหลือง)
  - PROCESSING → `processing` (น้ำเงิน)
  - COMPLETED → `completed` (เขียว)
  - FAILED → `failed` (แดง)

---

## 10. UI Design System

ใช้ **Revolut design tokens** กำหนดใน `tailwind.config.ts`:

| Token | 用途 |
|---|---|
| `revolut-primary` | Primary button, active nav |
| `revolut-bg` | Page background |
| `revolut-text` | Main text color |
| `revolut-text-secondary` | Subtitle, hint text |
| `revolut-border` | Border color |
| `revolut-error` | Error text |
| `rounded-card` | Card border radius |
| `rounded-button` | Button border radius |

### shadcn/ui Components

ใช้ shadcn/ui primitives ใน `components/ui/`:

- `Button` — variants: default, ghost, destructive, outline
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, etc.
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Badge` — variants: pending, processing, completed, failed
- `Input`, `Label`

---

## 11. Data Flow

```
Login (customer_code)
    │
    ▼
AuthContext (localStorage)
    │
    ├──▶ PoliciesPage ──usePolicies()──▶ GET /policies ──▶ PolicyCard[]
    │
    ├──▶ PortfoliosPage ──usePortfolios()──▶ GET /portfolios?customer_code= ──▶ PortfolioCard[]
    │       │
    │       └── CreatePortfolioModal ──▶ POST /portfolios ──▶ refetch
    │
    └──▶ OrdersPage ──usePortfolios()──▶ portfolio dropdown
            │
            ├── useOrders() ──▶ GET /orders?portfolio_code= ──▶ OrderTable
            │       │
            │       └── polling 3s (ถ้ามี PENDING/PROCESSING)
            │
            ├── create order ──▶ POST /orders ──▶ refetch
            │
            └── cancel order ──▶ PATCH /orders/:code/cancel ──▶ refetch
```

---

## 12. Error Handling Strategy

| HTTP Status | การแสดงผล |
|---|---|
| `400 Bad Request` | inline error message |
| `404 Not Found` | empty state |
| `409 Conflict` | inline error "มี active order อยู่แล้ว" |
| `5xx` | generic error message |
| Network error | "An unexpected occurred" |

ทุก hook มี `loading` และ `error` state ทุก API call

---

## 13. Environment Variables

| Variable | Default | 用途 |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | Backend API base URL |

---

## 14. Build & Deploy

### Dev

```bash
cd frontend
npm run dev          # Vite dev server on port 3000
```

### Production (Docker)

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build    # tsc && vite build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

- Nginx serve static files จาก `/usr/share/nginx/html`
- SPA fallback: ทุก route → `index.html`

---

## 15. Known Issues & Limitations

- **CreatePortfolioModal** ใช้ `any` สำหรับ error handling (`catch (err: any)`) — ควรใช้ `parseApiError` แทน
- **useOrders polling** — interval ยิง `setOrders` ทุก 3 วินาที แม้ไม่มี active order (wasted render) — ควรเช็คก่อน fetch
- **ไม่มี pagination** — order list โหลดทั้งหมด
- **ไม่มี real-time update** — ใช้ polling 3s แทน WebSocket
- **Code generation fragile** — `portfolio_code` / `order_code` ใช้ `count + 1` ถ้าลบ record จะชนกัน
