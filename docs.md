นี่คือข้อความทั้งหมดที่ถูกแปลงมาจากไฟล์ PDF ทั้ง 2 ฉบับครับ โดยผมได้แบ่งแยกตามโครงสร้างไฟล์และหน้าไว้ให้เพื่อความสะดวกในการอ่านและนำไปใช้งานต่อครับ

---

## 📄 ไฟล์ที่ 1: `lief-fe-interview-test.pdf`

### --- PAGE 1 ---

* 
**Interview Test** 


* 
**Mid-level Frontend Engineer** 


* **Stack:** React + TypeScript | NestJS + TypeORM + PostgreSQL 


* 
**โจทย์:** Fund Management Dashboard 


* 
**คำอธิบาย:** สร้าง React + TypeScript application เชื่อมต่อกับ Fund Management API โดยผู้สมัครต้องสร้าง Backend เองด้วยตาม spec ข้างล่าง 



🔹 Backend ที่ต้องสร้าง 

* สร้าง NestJS + TypeORM + PostgreSQL API ที่รองรับ Fund Management flow ทั้งหมด โดยออกแบบ endpoints เอง และอธิบายเหตุผลใน README 


* 
**Business Rules ที่ Backend ต้องรองรับ:** 


* 1 portfolio ผูกกับ 1 นโยบายเท่านั้น 


* ห้ามสร้าง order ใหม่ถ้ายังมี PENDING หรือ PROCESSING อยู่ใน portfolio เดียวกัน 


* ยกเลิก order ได้เฉพาะ status PENDING เท่านั้น 


* 
**Status workflow:** PENDING ➡️ PROCESSING ➡️ COMPLETED/FAILED 





🔹 Frontend ที่ต้องสร้าง 

* สร้าง React + TypeScript application ที่เชื่อมต่อกับ Backend ข้างต้น 


* 
**หน้าที่ต้องสร้าง (3 หน้า):** 


1. 
**หน้า Policy List (`/policies`):** แสดงนโยบายทั้งหมดพร้อมสัดส่วนหุ้น และกดดูรายละเอียดแต่ละนโยบายได้ 


2. 
**หน้า Portfolio (`/portfolios`):** แสดง portfolio ทั้งหมดของ customer, มีปุ่ม "สร้าง Portfolio" เปิด modal เลือกนโยบาย และแต่ละ portfolio แสดง status order ล่าสุด (ถ้ามี) 


3. 
**หน้า Order (`/orders`):** สร้าง order ใหม่ โดยเลือก portfolio และกรอกจำนวนเงิน, แสดง error message กรณีมี active order อยู่แล้ว (409 Conflict), แสดงรายการ order พร้อม status ปัจจุบัน และมีปุ่มยกเลิก order เฉพาะที่ status เป็น PENDING 





### --- PAGE 2 ---

🔹 ข้อกำหนด FE 

* ใช้ TypeScript ห้ามใช้ `any` 


* แยก API call ออกเป็น custom hook แต่ละ resource (portfolios, orders, policies) 


* handle HTTP error status ได้ถูกต้อง เช่น 409, 400, 404 


* มี loading และ error state ทุก API call 


* type definitions แยกไว้ใน `types/` 



🔹 งานที่ต้องส่ง 

* Source code ทั้ง Backend และ Frontend บน GitHub (public) 


* 
`docker-compose.yml` สำหรับ run ทั้งระบบ 


* 
`README.md`: how to run, environment variables, design decision, what's missing 


* Unit test อย่างน้อย 1 กรณีครอบคลุม duplicate order 



---

## 📄 ไฟล์ที่ 2: `lief-be-interview-test.pdf`

### --- PAGE 1 ---

* 
**Interview Test** 


* 
**Mid-level Backend Engineer** 


* 
**Stack:** NestJS + TypeORM + PostgreSQL 


* 
**โจทย์:** Fund Management Subscription API 


* 
**คำอธิบาย:** บริษัทต้องการระบบ API สำหรับให้ลูกค้าเลือกนโยบายการลงทุนและสั่งซื้อผ่าน portfolio โดยระบบจะกระจายเงินลงทุนตามสัดส่วนหุ้นในนโยบายโดยอัตโนมัติ ลูกค้าไม่ต้องเลือกหุ้นเอง 



🔹 ข้อมูลเริ่มต้น (Seed Data) 

*ระบบมีข้อมูลต่อไปนี้พร้อมอยู่แล้ว ไม่ต้องสร้าง API สำหรับส่วนนี้ แต่ต้องออกแบบ schema และ seed data ให้ครบ* 

1. Customers 

| customer code | name |
| --- | --- |
| C001 | สมชาย ใจดี |
| C002 | สมหญิง รักเรียน |



2. Stocks (หุ้น) 

| stock_code | name |
| --- | --- |
| PTT | ปตท. |
| SCB | ไทยพาณิชย์ |
| CPALL | ซีพี ออลล์ |
| KBANK | กสิกรไทย |
| BBL | กรุงเทพ |
| ADVANC | แอดวานซ์ อินโฟ |
| TRUE | ทรู คอร์ปอเรชั่น |
| DTAC | โทเทิ่ล แอ็คเซ็ส |



3. Policies (นโยบาย) 

| policy_code | name |
| --- | --- |
| KMASTER | นโยบายหุ้นไทย |
| TMBUSB | นโยบายตราสารหนี้ |
| SCBDV | นโยบายหุ้นปันผล |



### --- PAGE 2 ---

4. Policy Stocks (สัดส่วนหุ้นในแต่ละนโยบาย) 

| policy_code | stock code | weight (%) |
| --- | --- | --- |
| KMASTER | PTT | 40 |
| KMASTER | SCB | 35 |
| KMASTER | CPALL | 25 |
| TMBUSB | KBANK | 50 |
| TMBUSB | BBL | 50 |
| SCBDV | ADVANC | 40 |
| SCBDV | TRUE | 30 |
| SCBDV | DTAC | 30 |

*หมายเหตุ: weight รวมกันต้องได้ 100% เสมอในแต่ละนโยบาย ระบบใช้ข้อมูลนี้กระจายเงินเองอัตโนมัติ ลูกค้าไม่ต้อง input* 

🔹 Business Rules 

* ลูกค้า 1 คน มีได้หลาย portfolio 


* แต่ละ portfolio ผูกกับ 1 นโยบาย เท่านั้น และต้องเลือกนโยบายตอนสร้าง portfolio 


* ตอนสั่งซื้อ ลูกค้าระบุแค่ `portfolio_code` + จำนวนเงิน ระบบดึงนโยบายจาก portfolio แล้วกระจายเงินตามสัดส่วนเอง 



🔹 Status Workflow 

* 
`PENDING` ➡️ `PROCESSING` ➡️ `COMPLETED` หรือ `FAILED` 



| Status | เกิดขึ้นเมื่อ |
| --- | --- |
| **PENDING** | ลูกค้าสร้าง order สำเร็จ รอการดำเนินการ |
| **PROCESSING** | ระบบรับ order ไปดำเนินการแล้ว |
| **COMPLETED** | การซื้อสำเร็จ กระจายเงินเรียบร้อย |
| **FAILED** | การซื้อล้มเหลว หรือลูกค้ายกเลิก |



* 
*หมายเหตุ:* ระบบต้องรองรับการเปลี่ยน status ครบทุก transition ตาม flow ข้างต้น วิธี implement ให้ตัดสินใจเองและอธิบายเหตุผลใน README 


* ถ้า order เดิม status ยังเป็น `PENDING` หรือ `PROCESSING` อยู่ ห้ามสร้าง order ใหม่ใน portfolio เดียวกัน 


* ยกเลิก order ได้เฉพาะ status `PENDING` เท่านั้น 



---

### --- PAGE 3 ---

🔹 ตัวอย่างการใช้งาน 

สมชาย (C001) ต้องการลงทุน 1,000,000 บาท ในนโยบายหุ้นไทย 

* 
**ขั้นที่ 1 สร้าง portfolio:** สมชายสร้าง portfolio โดยเลือกนโยบาย KMASTER ➡️ ได้ `portfolio_code` กลับมา เช่น P001 


* 
**ขั้นที่ 2 สั่งซื้อ:** สมชายส่ง order โดยระบุ P001 และจำนวนเงิน 1,000,000 บาท ➡️ ระบบสร้าง order status `PENDING` 


* 
**ขั้นที่ 3 ระบบกระจายเงินอัตโนมัติ:** ระบบดึงสัดส่วนจาก KMASTER แล้วคำนวณ: 



| หุ้น | สัดส่วน | จำนวนเงิน |
| --- | --- | --- |
| PTT | 40% | 400,000 บาท |
| SCB | 35% | 350,000 บาท |
| CPALL | 25% | 250,000 บาท |



* 
**ขั้นที่ 4 Status เปลี่ยนตาม flow:** `PENDING` ➡️ `PROCESSING` ➡️ `COMPLETED` 



🔹 Flow การใช้งาน 

1. ใช้ `customer_code` ที่มีอยู่ใน seed data 


2. สร้าง portfolio พร้อมเลือกนโยบาย 


3. ส่ง order โดยระบุ `portfolio_code` + จำนวนเงิน 


4. ระบบดึงนโยบายจาก portfolio แล้วกระจายเงินตามสัดส่วน `policy_stocks` เอง 


5. ติดตาม / ยกเลิก order 



🔹 งานที่ต้องส่ง 

* 
**ข้อ 1 Database Schema:** ออกแบบ schema ให้รองรับ business rules และ flow ทั้งหมด (ERD หรือ SQL DDL) โดยต้องมี entity แยกสำหรับ `stocks` และ `policy_stocks` พร้อมระบุ index strategy และเหตุผลใน README รวมถึง seed data ข้างต้นทั้งหมด 


* 
**ข้อ 2 REST API:** ออกแบบและเขียน REST API ให้รองรับ flow ทั้งหมดข้างต้น โดยไม่มีการกำหนด endpoints ตายตัว ให้ตัดสินใจเองว่าควรมี resource อะไร, ชื่อ path อย่างไร, HTTP method อะไรเหมาะสม และอธิบายเหตุผลใน README 



---

### --- PAGE 4 ---

* 
**ข้อ 3 Unit Test:** เขียน unit test อย่างน้อย 1 กรณีที่ครอบคลุม business rule เรื่อง duplicate order 


* 
**ข้อ 4 README.md:** 


* How to run 


* Design decision ของ API structure ที่เลือก 


* วิธีที่เลือก implement status transition และเหตุผล 


* Index strategy และเหตุผล 


* Tradeoff ที่ตัดสินใจระหว่างออกแบบ 


* What's missing - ระบุส่วนที่ไม่ได้ทำและเหตุผล