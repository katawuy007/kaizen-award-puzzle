# 🚀 คู่มือ Deploy เกม KAIZEN AWARD ขึ้น Netlify + เก็บข้อมูลบน Supabase

โปรเจกต์นี้ตั้งค่าพร้อมใช้งานจริงเรียบร้อยแล้ว (มีไฟล์ `netlify.toml`, `supabase/schema.sql`, และระบบเชื่อมต่ออัตโนมัติใน `src/utils/supabase.js`)

---

## ขั้นที่ 1: สร้างฐานข้อมูลฟรีบน Supabase (ใช้เวลา ~2 นาที)

1. เข้าไปที่ [https://supabase.com](https://supabase.com) แล้วสร้างโปรเจกต์ใหม่ (เลือก Region เป็น **Singapore** เพื่อให้เร็วที่สุดในไทย)
2. ไปที่เมนู **SQL Editor** (แถบซ้าย) -> กด **New query**
3. คัดลอกคำสั่งทั้งหมดจากไฟล์ **`supabase/schema.sql`** มาวาง แล้วกด **Run**
   - ระบบจะสร้างตาราง 2 ตารางอัตโนมัติ:
     - `kaizen_scores` — เก็บชื่อ แผนก หมวด เวลา ดาว และ Quiz Bonus สำหรับ **Hall of Fame Real-time**
     - `kaizen_play_logs` — เก็บสถิติทุกครั้งที่มีคนต่อจิ๊กซอร์สำเร็จ (แม้ไม่กรอกชื่อ) เพื่อใช้นับยอดผู้ร่วมงานจริง
   - พร้อมตั้งค่าความปลอดภัย **RLS** (ทุกคนอ่าน/บันทึกได้ แต่ลบหรือแก้ไขคะแนนคนอื่นไม่ได้) และเปิด **Realtime** เรียบร้อย
4. ไปที่เมนู **Project Settings -> API** แล้วคัดลอก 2 ค่านี้เก็บไว้:
   - **Project URL** (เช่น `https://abcdefgh.supabase.co`)
   - **anon public key**

---

## ขั้นที่ 2: Deploy ขึ้น Netlify (ใช้เวลา ~2 นาที)

### วิธี A: เชื่อมผ่าน GitHub (แนะนำ — อัปเดตอัตโนมัติทุกครั้งที่แก้โค้ด)
1. Push โฟลเดอร์โปรเจกต์นี้ขึ้น GitHub repository ของคุณ (ไฟล์ `.gitignore` จะกัน `node_modules` และ `.env` ไว้ให้แล้ว)
2. เข้าไปที่ [https://app.netlify.com](https://app.netlify.com) -> **Add new site -> Import an existing project -> เลือก GitHub repo**
3. Netlify จะอ่านค่าจาก `netlify.toml` อัตโนมัติ (`Build command: npm run build`, `Publish directory: dist`)
4. กด **Add environment variables** แล้วใส่ 2 ตัวแปรนี้:
   - `VITE_SUPABASE_URL` = *(Project URL จาก Supabase)*
   - `VITE_SUPABASE_ANON_KEY` = *(anon public key จาก Supabase)*
5. กด **Deploy site** รอ ~30 วินาที จะได้ลิงก์ `https://your-site-name.netlify.app` พร้อมเล่นทันที!

### วิธี B: ทดสอบเชื่อมต่อ Supabase บนเครื่องก่อน Deploy
1. คัดลอกไฟล์ `.env.example` เป็น `.env`
2. ใส่ค่า `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ลงใน `.env`
3. รัน `npm run dev` แล้วเปิดหน้า **Hall of Fame (อันดับ)** จะเห็นป้ายเปลี่ยนเป็น **`🟢 Supabase Live`** ทันที!

---

## ขั้นที่ 3: การใช้งานหน้าบูธ & ดึงรายงานหลังจบงาน

- **เปิดจอทีวีหน้าบูธ:** เปิดหน้าเว็บแล้วกดเปิดหน้าต่าง **Hall of Fame (อันดับ)** ค้างไว้ เมื่อมีผู้ร่วมงานเล่นจบและบันทึกชื่อจากมือถือของตัวเอง รายชื่อจะ **เด้งขึ้นจอทันทีแบบ Real-time**!
- **ดาวน์โหลด Excel/CSV ทันทีจากหน้าเว็บ:** กดปุ่ม **`Export CSV`** ในหน้า Hall of Fame (รองรับภาษาไทยใน Excel 100% ด้วย UTF-8 BOM)
- **ดูสถิติผู้เล่นทั้งหมด (รวมคนที่ไม่กรอกชื่อ):** เข้าไปที่ Supabase -> **Table Editor -> `kaizen_play_logs`** เพื่อดูยอดเล่นสำเร็จทั้งหมดและ Export เป็น CSV ได้ทุกเมื่อครับ
