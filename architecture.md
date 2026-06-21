# Architecture Design — Fund Management System

## Overview

ระบบนี้แบ่งออกเป็น 2 ส่วนหลัก คือ **Backend API** (NestJS + TypeORM + PostgreSQL) และ **Frontend** (React + TypeScript) โดยสื่อสารผ่าน REST API และ deploy ด้วย Docker Compose

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Network                       │
│                                                         │
│  ┌──────────────┐      ┌──────────────┐      ┌───────┐ │
│  │   React App  │─────▶│  NestJS API  │─────▶│  PG   │ │
│  │  :3000       │      │  :3001       │      │  :5432│ │
│  └──────────────┘      └──────────────┘      └───────┘ │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

- **Backend API:** NestJS (Node.js Framework) + TypeORM (ORM) + PostgreSQL (Database)
- **Frontend Client (Customer Portal):** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Admin Frontend (Internal Portal):** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Database Tools:** pgAdmin 4 สำหรับการตรวจสอบและจัดการฐานข้อมูล
- **Containerization & Deployment:** Docker & Docker Compose
- **Testing:** Jest (Backend Unit Tests) & Playwright (End-to-End Integration Tests)

---

## 1. Database Schema (ERD)

### Entities & Relationships

```
customers
─────────
id            UUID  PK
customer_code VARCHAR(10)  UNIQUE  NOT NULL   -- e.g. C001
name          VARCHAR(255) NOT NULL
created_at    TIMESTAMP

stocks
──────
id            UUID  PK
stock_code    VARCHAR(10)  UNIQUE  NOT NULL   -- e.g. PTT, SCB
name          VARCHAR(255) NOT NULL
created_at    TIMESTAMP

policies
────────
id            UUID  PK
policy_code   VARCHAR(20)  UNIQUE  NOT NULL   -- e.g. KMASTER
name          VARCHAR(255) NOT NULL
created_at    TIMESTAMP

policy_stocks                                 -- junction + weight
─────────────
id            UUID  PK
policy_id     UUID  FK → policies.id
stock_id      UUID  FK → stocks.id
weight        DECIMAL(5,2) NOT NULL           -- e.g. 40.00
UNIQUE(policy_id, stock_id)

portfolios
──────────
id            UUID  PK
portfolio_code VARCHAR(20) UNIQUE  NOT NULL   -- e.g. P001
customer_id   UUID  FK → customers.id
policy_id     UUID  FK → policies.id          -- 1 portfolio : 1 policy
created_at    TIMESTAMP

orders
──────
id            UUID  PK
order_code    VARCHAR(20) UNIQUE  NOT NULL    -- e.g. O001
portfolio_id  UUID  FK → portfolios.id
amount        DECIMAL(18,2) NOT NULL
status        ENUM('PENDING','PROCESSING','COMPLETED','FAILED') DEFAULT 'PENDING'
created_at    TIMESTAMP
updated_at    TIMESTAMP

order_stocks                                  -- snapshot การกระจายเงิน
────────────
id            UUID  PK
order_id      UUID  FK → orders.id
stock_id      UUID  FK → stocks.id
weight        DECIMAL(5,2) NOT NULL
allocated_amount DECIMAL(18,2) NOT NULL       -- amount * weight / 100
```

### Relationships Diagram

```
customers ──< portfolios >── policies
                  │               │
                orders       policy_stocks
                  │               │
             order_stocks ─────stocks
```

### Index Strategy

| Table | Index | เหตุผล |
|---|---|---|
| `portfolios` | `customer_id` | query portfolios by customer บ่อย |
| `portfolios` | `portfolio_code` | lookup by code ใน order creation |
| `orders` | `portfolio_id, status` | composite: ตรวจ duplicate order (PENDING/PROCESSING) |
| `orders` | `portfolio_id, created_at DESC` | ดึง latest order per portfolio |
| `policy_stocks` | `policy_id` | ดึง stocks ของ policy ตอน allocate |
| `order_stocks` | `order_id` | ดึง allocation snapshot per order |

> **เหตุผล composite index บน orders(portfolio_id, status):**  
> Business rule บังคับตรวจก่อนสร้าง order ทุกครั้งว่ามี PENDING/PROCESSING อยู่ใน portfolio เดียวกันไหม  
> Composite index ทำให้ query นี้เป็น index-only scan แทน full table scan

### 🔌 วิธีเชื่อมต่อ pgAdmin กับ Database (ภายใน Docker Network)

หลังจากลงชื่อเข้าใช้งาน pgAdmin แล้ว ให้ลงทะเบียน Server เพื่อเชื่อมต่อฐานข้อมูล PostgreSQL ดังนี้:

1. คลิกขวาที่หัวข้อ **Servers** ➡️ เลือก **Register** ➡️ คลิก **Server...**
2. ในแท็บ **General**:
   - ตั้งชื่อ Server ในช่อง **Name** (ตัวอย่าง: `Fund Management DB`)
3. ในแท็บ **Connection**:
   - **Host name/address:** `db` *(ใช้ชื่อ Service ของ Container ใน docker-compose.yml)*
   - **Port:** `5432`
   - **Maintenance database:** `fund_db` *(ตามค่า POSTGRES_DB ใน .env)*
   - **Username:** `fund_user` *(ตามค่า POSTGRES_USER ใน .env)*
   - **Password:** `fund_pass` *(ตามค่า POSTGRES_PASSWORD ใน .env)*
4. กดปุ่ม **Save** เพื่อบันทึกและเชื่อมต่อฐานข้อมูล

---

## 2. Backend Architecture (NestJS)

### Module Structure

```
src/
├── app.module.ts
├── database/
│   └── seed/
│       └── seed.service.ts         # seed customers, stocks, policies
├── customers/
│   └── customers.module.ts
├── policies/
│   ├── policies.module.ts
│   ├── policies.controller.ts
│   ├── policies.service.ts
│   └── dto/
├── portfolios/
│   ├── portfolios.module.ts
│   ├── portfolios.controller.ts
│   ├── portfolios.service.ts
│   └── dto/
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── dto/
└── common/
    ├── filters/
    │   └── http-exception.filter.ts
    └── interceptors/
        └── response.interceptor.ts
```

### REST API Endpoints

#### Policies

```
GET    /policies                  # list ทุก policy พร้อม policy_stocks
GET    /policies/:policy_code     # detail 1 policy
```

#### Portfolios

```
GET    /portfolios?customer_code=C001   # portfolios ของ customer
POST   /portfolios                      # สร้าง portfolio
       body: { customer_code, policy_code }
GET    /portfolios/:portfolio_code      # detail + latest order status
```

#### Orders

```
GET    /orders?portfolio_code=P001      # orders ของ portfolio
POST   /orders                          # สร้าง order ใหม่
       body: { portfolio_code, amount }
GET    /orders/:order_code              # detail + order_stocks allocation
PATCH  /orders/:order_code/cancel       # ยกเลิก (PENDING เท่านั้น)
PATCH  /orders/:order_code/status       # เปลี่ยน status (internal/admin)
       body: { status: 'PROCESSING' | 'COMPLETED' | 'FAILED' }
```

> **เหตุผลที่ใช้ PATCH แทน PUT:**  
> เปลี่ยนเฉพาะ field เดียว (status) ไม่ได้ replace ทั้ง resource — PATCH เหมาะสมกว่า  
> แยก `/cancel` endpoint ออกมาเพื่อให้ชัดเจนว่าเป็น business action ไม่ใช่ generic status update

### Status Transition

```
         สร้าง order
              │
           PENDING ──[cancel]──▶ FAILED
              │
         [system pick up]
              │
          PROCESSING
           /      \
    [success]    [fail]
        │            │
    COMPLETED      FAILED
```

**วิธี implement:** ใช้ `PATCH /orders/:code/status` แบบ explicit transition checking  
Service layer ตรวจ allowed transitions ก่อน save เสมอ:

```typescript
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:    ['PROCESSING', 'FAILED'],   // FAILED = cancel path
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED:  [],
  FAILED:     [],
};
```

> **เหตุผล:** State machine แบบ explicit ป้องกัน invalid transition (เช่น COMPLETED → PENDING)  
> ง่ายต่อการ test และ extend ในอนาคต

### Duplicate Order Prevention

```typescript
// ใน orders.service.ts
async createOrder(dto: CreateOrderDto) {
  const activeOrder = await this.orderRepo.findOne({
    where: {
      portfolio: { portfolio_code: dto.portfolio_code },
      status: In(['PENDING', 'PROCESSING']),
    },
  });

  if (activeOrder) {
    throw new ConflictException(
      `Portfolio ${dto.portfolio_code} already has an active order`
    );
  }
  // ... create order + allocate
}
```

### Money Allocation Logic

```typescript
// snapshot ณ เวลาสร้าง order (ไม่ reference policy_stocks ตอน query ทีหลัง)
const policyStocks = await portfolio.policy.policy_stocks;
const orderStocks = policyStocks.map(ps => ({
  stock: ps.stock,
  weight: ps.weight,
  allocated_amount: (dto.amount * ps.weight) / 100,
}));
```

> **เหตุผลที่ snapshot ลงใน order_stocks:**  
> ถ้า policy เปลี่ยน weight ในอนาคต order เก่าต้องยังคงบันทึกว่าแจก ณ สัดส่วนเท่าไร  
> ป้องกัน data inconsistency ระหว่าง audit

---

## 3. Frontend Architecture (React + TypeScript)

### Folder Structure

```
src/
├── types/
│   ├── policy.types.ts
│   ├── portfolio.types.ts
│   └── order.types.ts
├── api/
│   └── client.ts              # axios instance + error interceptor
├── hooks/
│   ├── usePolicies.ts
│   ├── usePortfolios.ts
│   └── useOrders.ts
├── pages/
│   ├── PoliciesPage.tsx       # /policies
│   ├── PortfoliosPage.tsx     # /portfolios
│   └── OrdersPage.tsx         # /orders
├── components/
│   ├── PolicyCard.tsx
│   ├── PortfolioCard.tsx
│   ├── OrderTable.tsx
│   ├── CreatePortfolioModal.tsx
│   └── StatusBadge.tsx
└── App.tsx
```

### Custom Hook Pattern

```typescript
// hooks/useOrders.ts
export function useOrders(portfolioCode?: string) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<ApiError | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.list(portfolioCode);
      setOrders(data);
    } catch (err) {
      setError(parseApiError(err));   // map AxiosError → ApiError
    } finally {
      setLoading(false);
    }
  }, [portfolioCode]);

  return { orders, loading, error, refetch: fetchOrders };
}
```

### Error Handling

| HTTP Status | การแสดงผล |
|---|---|
| `400 Bad Request` | inline error ใต้ form field |
| `404 Not Found` | empty state / redirect |
| `409 Conflict` | banner เตือน "มี active order อยู่แล้ว" |
| `5xx` | toast error ทั่วไป |

---

## 4. Docker Compose

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: fund_db
      POSTGRES_USER: fund_user
      POSTGRES_PASSWORD: fund_pass
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://fund_user:fund_pass@db:5432/fund_db
      PORT: 3001
    ports: ["3001:3001"]
    depends_on: [db]

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost:3001
    ports: ["3000:3000"]
    depends_on: [backend]

volumes:
  pgdata:
```

---

## 5. Tradeoffs & Design Decisions

| ประเด็น | ตัดสินใจ | เหตุผล |
|---|---|---|
| UUID vs Serial PK | UUID | ป้องกัน enumeration attack, ง่ายต่อ distribute ในอนาคต |
| order_stocks snapshot | ✅ ทำ | audit trail ถูกต้องแม้ policy เปลี่ยน weight |
| Status transition ใน service layer | ✅ | ไม่ผ่าน DB constraint เพื่อให้ error message ชัดเจน |
| Auth | Login page ด้วย customer_code (ไม่มี password) | มี UI สำหรับเลือก customer ก่อนเข้าระบบ; ไม่ใช่ real auth |
| Polling vs WebSocket | Polling | สอดคล้องกับ scope; WebSocket เป็น "what's missing" |

---

## 6. What's Missing

- **Authentication & Authorization** — ระบบยังไม่มี JWT / session  
- **Real-time status update** — ยังใช้ manual refresh แทน WebSocket  
- **Pagination** — order list ยังไม่มี cursor/offset pagination  
- **Retry mechanism** — ถ้า PROCESSING แล้ว downstream ล้มเหลว ยังไม่มี retry queue  
- **Admin panel** — ปัจจุบัน status transition ทำผ่าน API โดยตรง  
- **Auto-processing resilience** — status transition ใช้ setTimeout (2s→PROCESSING, 5s→COMPLETED/FAILED); ถ้า server restart order จะค้างที่ PENDING ควรใช้ job queue แทน
- **E2E tests** — ได้รับการพัฒนาเรียบร้อยแล้วโดยใช้ Playwright ครอบคลุม full journey 59/59 tests ผ่านทั้งหมด (ดูรายละเอียดใน [PLAYWRIGHT-REPORT.md](file:///home/peson/fund_management/PLAYWRIGHT-REPORT.md))

---

## 7. Integration & E2E Testing (Playwright)

ใช้ Playwright เพื่อจำลองพฤติกรรมผู้ใช้และทดสอบความเชื่อมโยงของระบบทั้งหมด (End-to-End Integration) ตั้งแต่การล็อกอิน, การเลือกแผนลงทุน, การจัดการพอร์ต, และการทำธุรกรรมจริงผ่านเว็บเบราว์เซอร์จำลอง

### วิธีการรัน E2E Tests
รันคำสั่งต่อไปนี้ที่ Root Directory ของโปรเจกต์:
```bash
LD_LIBRARY_PATH=/home/peson/fund_management/.local-libs/extracted/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH \
  npx playwright test --project=chromium
```

### การเข้าดูรายงานผลการทดสอบ (Test Report)
สามารถเปิดดูรายละเอียดผลการทดสอบแบบอินเตอร์แอคทีฟได้ผ่านคำสั่ง:
```bash
npx playwright show-report --port 9323
```