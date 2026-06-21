# 📊 แผนภาพระบบจัดการกองทุน (Fund Management System Diagrams)

โฟลเดอร์นี้รวบรวมแผนภาพแสดงการออกแบบโครงสร้างฐานข้อมูล (ER Diagram) และขั้นตอนกระบวนการทำงานของระบบคำสั่งซื้อขายกองทุน (Sequence Diagram) โดยใช้รูปแบบของ **Mermaid**

---

## 🗄️ 1. แผนภาพความสัมพันธ์ฐานข้อมูล (Entity-Relationship Diagram)

แผนภาพนี้แสดงโครงสร้างของฐานข้อมูล PostgreSQL ทั้งหมด 8 ตาราง พร้อมความสัมพันธ์ (One-to-Many, Many-to-One) และคุณสมบัติของคอลัมน์ต่าง ๆ:

```mermaid
erDiagram
    customers ||--o{ portfolios : "owns"
    policies ||--o{ portfolios : "defines"
    policies ||--|{ policy_stocks : "contains"
    stocks ||--|{ policy_stocks : "weighted_in"
    portfolios ||--o{ orders : "contains"
    orders ||--|{ order_stocks : "allocated_to"
    stocks ||--|{ order_stocks : "referenced_in"
    stocks ||--o{ stock_price_history : "has_history"

    customers {
        uuid id PK
        varchar customer_code UK
        varchar name
        timestamp created_at
    }

    stocks {
        uuid id PK
        varchar stock_code UK
        varchar name
        decimal current_price
        decimal previous_close
        decimal price_change
        decimal price_change_percent
        timestamp created_at
    }

    stock_price_history {
        uuid id PK
        uuid stock_id FK
        decimal price
        timestamp recorded_at
    }

    policies {
        uuid id PK
        varchar policy_code UK
        varchar name
        timestamp created_at
    }

    policy_stocks {
        uuid id PK
        uuid policy_id FK
        uuid stock_id FK
        decimal weight
    }

    portfolios {
        uuid id PK
        varchar portfolio_code UK
        uuid customer_id FK
        uuid policy_id FK
        timestamp created_at
    }

    orders {
        uuid id PK
        varchar order_code UK
        uuid portfolio_id FK
        decimal amount
        enum order_type "BUY | SELL"
        enum status "PENDING | PROCESSING | COMPLETED | FAILED"
        timestamp created_at
        timestamp updated_at
    }

    order_stocks {
        uuid id PK
        uuid order_id FK
        uuid stock_id FK
        decimal weight
        decimal allocated_amount
        decimal units
        decimal purchase_price
    }
```

### รายละเอียดตารางและความสัมพันธ์:
- **`customers` (ลูกค้า):** ลูกค้า 1 คนสามารถมีพอร์ตการลงทุน (`portfolios`) ได้หลายพอร์ต
- **`policies` (นโยบายการลงทุน):** นโยบาย 1 นโยบายจะกำหนดสัดส่วนหุ้นประกอบนโยบายลงใน `policy_stocks`
- **`policy_stocks` (สัดส่วนน้ำหนักหุ้น):** ตารางเชื่อมโยงระบุว่าแต่ละนโยบายถือหุ้นตัวไหนและน้ำหนักสัดส่วน (%) เท่าไร
- **`portfolios` (พอร์ตลงทุน):** เชื่อมโยงลูกค้าและนโยบายเข้าด้วยกัน (1 พอร์ตลงทุนจะผูกติดได้เพียง 1 นโยบาย)
- **`orders` (คำสั่งซื้อขาย):** คำสั่งซื้อขายที่ลูกค้าส่งเข้ามาในพอร์ต โดยเก็บประวัติสถานะและมูลค่าเงินลงทุนทั้งหมด
- **`order_stocks` (สแนปช็อตการกระจายเงิน):** บันทึกประวัติสัดส่วนน้ำหนักและจำนวนเงินจริง ณ เวลาที่ทำรายการซื้อขาย เพื่อเป็นฐานข้อมูลตรวจสอบย้อนหลังที่ถูกต้อง (Audit Trail)
- **`stock_price_history` (ประวัติราคาหุ้น):** บันทึกประวัติราคาย้อนหลังเพื่อใช้อ้างอิงการปรับตัวของตลาด

---

## 🔄 2. แผนภาพขั้นตอนการทำธุรกรรม (Order Creation & Lifecycle Sequence Diagram)

แผนภาพนี้จำลองกระบวนการทำงานตั้งแต่ Frontend (React Client) ยิงคำขอสร้างออเดอร์ใหม่ ไปจนถึงการทำสแนปช็อตสัดส่วนเงินลงทุน การสลับสถานะอัตโนมัติในฝั่งหลังบ้าน (Simulation Delay) และการส่งข้อมูลอัปเดตกลับไปแสดงผลแบบเรียลไทม์ผ่านการทำ Polling:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client (React)
    participant API as Backend API (NestJS)
    participant DB as Database (Postgres)
    participant Timer as Background Job (setTimeout)

    %% Step 1: Order Request & Validation
    Client->>API: POST /orders { portfolio_code, amount, order_type }
    activate API
    API->>DB: Query Portfolio by portfolio_code (include Policy details)
    activate DB
    DB-->>API: Portfolio Data (with Policy & Stocks)
    deactivate DB

    alt Portfolio Not Found
        API-->>Client: 404 Not Found
    end

    %% Step 2: Duplicate Order Prevention
    API->>DB: Check for active orders (status: PENDING or PROCESSING)
    activate DB
    DB-->>API: Active Order (if exists)
    deactivate DB

    alt Active Order Exists
        API-->>Client: 409 Conflict (Already has an active order)
    end

    %% Step 3: Order Initialization
    API->>DB: Count total orders to generate order_code (e.g. O001)
    activate DB
    DB-->>API: Total Count
    deactivate DB
    
    API->>DB: Insert new Order (status: PENDING)
    activate DB
    DB-->>API: Saved Order Record
    deactivate DB

    %% Step 4: Asset Allocation & Snapshot
    alt order_type is BUY
        API->>API: Calculate weights and allocate amount per stock
        API->>DB: Bulk insert order_stocks Snapshot (allocated_amount)
        activate DB
        DB-->>API: Success
        deactivate DB
    else order_type is SELL
        API->>DB: Calculate current holdings from completed orders
        activate DB
        DB-->>API: User Holdings
        deactivate DB
        alt No holdings or sell amount > total holdings value
            API-->>Client: 400 Bad Request
        end
        API->>API: Allocate sell amount proportionally
        API->>DB: Bulk insert order_stocks Snapshot (allocated_amount, units)
        activate DB
        DB-->>API: Success
        deactivate DB
    end

    %% Step 5: Schedule Auto-Processing & Return Immediate Response
    API->>Timer: Schedule transition to PROCESSING (after 2s delay)
    API-->>Client: 201 Created { order_code: "Oxxx", status: "PENDING", ... }
    deactivate API

    %% Step 6: Polling Cycle (Frontend asks for updates)
    loop Every 3s while status is PENDING or PROCESSING
        Client->>API: GET /orders?portfolio_code=P001
        activate API
        API->>DB: Query orders ordered by created_at DESC
        activate DB
        DB-->>API: List of Orders
        deactivate DB
        API-->>Client: 200 OK [ { order_code: "Oxxx", status: "PENDING/PROCESSING" } ]
        deactivate API
    end

    %% Step 7: Background Auto-Processing
    activate Timer
    note over Timer: After 2 seconds delay
    Timer->>DB: Update order status to PROCESSING
    activate DB
    DB-->>Timer: Success
    deactivate DB
    note over Timer: Backend logs: Order → PROCESSING

    Timer->>Timer: Schedule completion transition (after 5s delay)
    
    note over Timer: After 5 seconds delay
    Timer->>Timer: Math.random() determines success (80% success rate)

    alt Simulation Success (80%)
        Timer->>DB: Update order status to COMPLETED
        activate DB
        DB-->>Timer: Success
        deactivate DB
        
        %% Calculate units for BUY/SELL
        loop For each stock in order_stocks
            Timer->>DB: Get current_price from stocks table
            activate DB
            DB-->>Timer: Stock current_price
            deactivate DB
            Timer->>Timer: Calculate units (allocated_amount / current_price) & save purchase_price
            Timer->>DB: Save order_stocks record
            activate DB
            DB-->>Timer: Success
            deactivate DB
        end
        note over Timer: Backend logs: Order → COMPLETED
    else Simulation Failure (20%)
        Timer->>DB: Update order status to FAILED
        activate DB
        DB-->>Timer: Success
        deactivate DB
        note over Timer: Backend logs: Order → FAILED
    end
    deactivate Timer

    %% Step 8: Final Polling Return
    Client->>API: GET /orders?portfolio_code=P001
    activate API
    API->>DB: Query orders
    activate DB
    DB-->>API: List of Orders
    deactivate DB
    API-->>Client: 200 OK [ { order_code: "Oxxx", status: "COMPLETED/FAILED" } ]
    deactivate API
```

---

## 📌 วิธีดูแผนภาพเหล่านี้
1. **GitHub / VS Code Markdown Preview:** หากแสดงผลบน GitHub หรือโปรแกรมเขียนโค้ดที่รองรับ Markdown + Mermaid แผนภาพทั้งสองด้านบนจะแสดงเป็นกราฟิกสวยงามโดยอัตโนมัติ
2. **Mermaid Live Editor:** คุณสามารถคัดลอกโค้ดภายในบล็อก ` ```mermaid ... ``` ` ไปวางที่ [Mermaid Live Editor](https://mermaid.live/) เพื่อแก้ไขสีสัน ตกแต่ง เพิ่มเติม หรือส่งออกเป็นรูปภาพ (PNG, SVG, PDF) ได้ทันที
