import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  }

  async sendMessage(
    message: string,
    customerCode: string,
    history: ChatHistoryMessage[],
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackReply(message, customerCode, history);
    }

    const systemPrompt = `You are an AI investment advisor for a Fund Management system.
You help customer ${customerCode} with investment decisions.
You can discuss investment policies, portfolio allocation, and stock market trends.
Keep responses concise and professional. Use Thai language when the customer writes in Thai.
Available policies: KMASTER (Thai Stock Fund), TMBUSB (Fixed Income Fund), SCBDV (Dividend Stock Fund).
Available stocks: PTT, SCB, CPALL, KBank, BBL, ADVANC, TRUE, DTAC.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: message },
    ];

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      return response.data.choices[0]?.message?.content || 'No response generated.';
    } catch (err) {
      this.logger.error('Chatbot API error', err);
      return this.getFallbackReply(message, customerCode, history);
    }
  }

  private getFallbackReply(
    message: string,
    customerCode: string,
    history: ChatHistoryMessage[],
  ): string {
    const lower = message.toLowerCase();
    const hasHistory = history.length > 0;

    // Intent detection
    const detectIntent = (msg: string): string => {
      const l = msg.toLowerCase();

      // Greetings
      if (l.match(/^(สวัสดี|hello|hi|hey|หวัดดี|ฮัลโหล|อรุณ)/)) return 'greeting';

      // Investment recommendations
      if (l.includes('แนะนำ') || l.includes('เสนอ') || l.includes('suggest') || l.includes('เริ่มต้น') || l.includes('มือใหม่') || l.includes('beginner')) return 'recommend';

      // Comparison
      if (l.includes('เปรียบเทียบ') || l.includes('compare') || l.includes('ต่างกัน') || l.includes('เลือก') || l.includes('ไหนดี')) return 'compare';

      // Specific policy
      if (l.includes('kmaster') || l.includes('หุ้นไทย')) return 'policy_kmaster';
      if (l.includes('tmbusb') || l.includes('ตราสารหนี้') || l.includes('พันธบัตร')) return 'policy_tmbusb';
      if (l.includes('scbdv') || l.includes('ปันผล') || l.includes('dividend')) return 'policy_scbdv';

      // General policy
      if (l.includes('policy') || l.includes('นโยบาย') || l.includes('กองทุน')) return 'policy';

      // Portfolio
      if (l.includes('portfolio') || l.includes('พอร์ต') || l.includes('พอร์ท')) {
        if (l.includes('สร้าง') || l.includes('create') || l.includes('ใหม่') || l.includes('เปิด')) return 'portfolio_create';
        if (l.includes('จัด') || l.includes('จัดสรร') || l.includes('สัดส่วน') || l.includes('allocat')) return 'portfolio_alloc';
        if (l.includes('ดู') || l.includes('เช็ค') || l.includes('check') || l.includes('status') || l.includes('ของผม')) return 'portfolio_check';
        return 'portfolio';
      }

      // Order
      if (l.includes('order') || l.includes('สั่งซื้อ') || l.includes('เทรด') || l.includes('ซื้อกองทุน')) {
        if (l.includes('ยกเลิก') || l.includes('cancel') || l.includes('terminate')) return 'order_cancel';
        if (l.includes('ขั้นตอน') || l.includes('วิธี') || l.includes('how') || l.includes('step')) return 'order_step';
        return 'order';
      }

      // Stock
      if (l.includes('หุ้น') || l.includes('stock') || l.includes('ราคา') || l.includes('price')) return 'stock';

      // Risk
      if (l.includes('ความเสี่ยง') || l.includes('risk') || l.includes('เสี่ยง')) return 'risk';

      // Return / profit
      if (l.includes('กำไร') || l.includes('ผลตอบแทน') || l.includes('return') || l.includes('yield') || l.includes('ปันผล')) return 'return';

      // Amount / budget
      if (l.match(/[\d,]+.*บาท/) || l.includes('amount') || l.includes('งบ') || l.includes('budget') || l.includes('เงิน')) return 'amount';

      // Thank you
      if (l.includes('ขอบคุณ') || l.includes('thank') || l.includes('thanks') || l.includes('ขอบคุง')) return 'thanks';

      // Help
      if (l.includes('ช่วย') || l.includes('help') || l.includes('ทำอะไร') || l.includes('คำสั่ง')) return 'help';

      return 'unknown';
    };

    // Context-aware: detect what user might be asking about based on conversation
    const getContextHint = (): string | null => {
      if (!hasHistory) return null;
      const lastAssistant = history.filter((h) => h.role === 'assistant').pop();

      if (!lastAssistant) return null;

      const prevContent = lastAssistant.content.toLowerCase();

      // If assistant just talked about a specific policy, user might be following up
      if (prevContent.includes('kmaster')) return 'kmaster_context';
      if (prevContent.includes('tmbusb')) return 'tmbusb_context';
      if (prevContent.includes('scbdv')) return 'scbdv_context';
      if (prevContent.includes('portfolio')) return 'portfolio_context';

      // If user's last message was a question about a topic
      const lastUser = history.filter((h) => h.role === 'user').pop();
      if (lastUser) {
        const userLower = lastUser.content.toLowerCase();
        if (userLower.includes('กองทุน') || userLower.includes('นโยบาย')) return 'policy_context';
        if (userLower.includes('invest') || userLower.includes('ลงทุน')) return 'invest_context';
      }

      return null;
    };

    const intent = detectIntent(message);
    const contextHint = getContextHint();

    // Generate response based on intent
    switch (intent) {
      case 'greeting':
        return `สวัสดีครับคุณ ${customerCode}! 👋\n\nผมเป็น AI Investment Advisor พร้อมช่วยเรื่องการลงทุนของคุณ\n\n问我ได้เกี่ยวกับ:\n• 📊 นโยบายการลงทุน (KMASTER, TMBUSB, SCBDV)\n• 💼 วิธีจัด Portfolio\n• 🛒 ขั้นตอนการสั่งซื้อ\n• 📈 ข้อมูลหุ้น\n\n💡 ลองถาม เช่น "กองทุนไหนดีสำหรับมือใหม่?"`;

      case 'recommend':
        return `💡 **แนะนำกองทุนสำหรับมือใหม่:**\n\nถ้าเพิ่งเริ่มลงทุน แนะนำตามระดับความเสี่ยงที่รับได้:\n\n🟢 **เริ่มจาก TMBUSB (ตราสารหนี้)**\n• ความเสี่ยงต่ำที่สุด\n• เหมาะกับ: ต้องการความมั่นคง\n• เงินต้นปลอดภัย ได้ผลตอบแทนสม่ำเสมอ\n\n🟡 **แล้วเพิ่ม SCBDV (หุ้นปันผล)**\n• ความเสี่ยงปานกลาง\n• ได้เงินปันผลสม่ำเสมอ\n• เหมาะกับ: ต้องการรายได้เสริม\n\n🔴 **ถ้ารับความเสี่ยงได้ — KMASTER**\n• ความเสี่ยงสูง แต่ผลตอบแทนมากกว่า\n• เหมาะกับ: ลงทุนระยะยาว 5+ ปี\n\n💡 **คำแนะนำ:** เริ่มจาก TMBUSB ก่อน แล้วค่อยกระจายไปนโยบายอื่น`;

      case 'compare':
        return `📊 **เปรียบเทียบนโยบายการลงทุน:**\n\n| นโยบาย | ความเสี่ยง | ประเภท | เหมาะกับ |\n|---------|-----------|--------|----------|\n| TMBUSB | 🟢 ต่ำ | ตราสารหนี้ | ต้องการความมั่นคง |\n| SCBDV | 🟡 ปานกลาง | หุ้นปันผล | ต้องการเงินปันผล |\n| KMASTER | 🔴 สูง | หุ้นไทย | รับความเสี่ยงได้ |\n\n**สัดส่วนหุ้น:**\n• **KMASTER**: PTT 40%, SCB 35%, CPALL 25%\n• **TMBUSB**: KBank 50%, BBL 50%\n• **SCBDV**: ADVANC 40%, TRUE 30%, DTAC 30%\n\n💡 แนะนำ: มือใหม่เริ่มจาก TMBUSB แล้วค่อยกระจาย`;

      case 'policy_kmaster':
        return `🇹🇭 **KMASTER — กองทุนหุ้นไทย**\n\n📊 **สัดส่วนการลงทุน:**\n• PTT (ปตท.) — 40% (พลังงาน)\n• SCB (ไทยพาณิชย์) — 35% (ธนาคาร)\n• CPALL (ซีพี ออลล์) — 25% (ค้าปลีก)\n\n✅ **จุดเด่น:**\n• เน้นหุ้นใหญ่ที่มีความมั่นคงสูง\n• เหมาะกับการลงทุนระยะยาว\n\n⚠️ **ความเสี่ยง:** สูง — ผันผวนตามตลาดหุ้น\n\n💡 ลงทุน 1 ล้านบาท จะได้:\n• PTT — 4 แสนบาท\n• SCB — 3.5 แสนบาท\n• CPALL — 2.5 แสนบาท`;

      case 'policy_tmbusb':
        return `🏦 **TMBUSB — กองทุนตราสารหนี้**\n\n📊 **สัดส่วนการลงทุน:**\n• KBank (กสิกรไทย) — 50%\n• BBL (กรุงเทพ) — 50%\n\n✅ **จุดเด่น:**\n• ความเสี่ยงต่ำที่สุดในระบบ\n• รายได้สม่ำเสมอ\n• เงินต้นปลอดภัย\n\n💡 **เหมาะกับ:**\n• นักลงทุนมือใหม่\n• ต้องการเก็บเงินระยะสั้น-กลาง\n• ไม่ต้องการความผันผวน\n\n📈 ผลตอบแทน: สม่ำเสมอ ไม่ผันผวนมาก`;

      case 'policy_scbdv':
        return `💰 **SCBDV — กองทุนหุ้นปันผล**\n\n📊 **สัดส่วนการลงทุน:**\n• ADVANC (แอดวานซ์) — 40% (โทรคมนาคม)\n• TRUE (ทรู) — 30% (โทรคมนาคม)\n• DTAC (โทเทิ่ล) — 30% (โทรคมนาคม)\n\n✅ **จุดเด่น:**\n• เน้นหุ้นที่จ่ายเงินปันผลสูง\n• ได้รายได้สม่ำเสมอจากเงินปันผล\n• กลุ่มสื่อสารมีรายได้มั่นคง\n\n💡 **เหมาะกับ:**\n• ต้องการเงินปันผลสม่ำเสมอ\n• ลงทุนระยะกลาง-ยาว\n• ต้องการรายได้เสริม`;

      case 'policy':
        return `📋 **นโยบายการลงทุนทั้งหมด:**\n\n1️⃣ **KMASTER** — หุ้นไทย (เสี่ยงสูง)\n   PTT 40% | SCB 35% | CPALL 25%\n\n2️⃣ **TMBUSB** — ตราสารหนี้ (เสี่ยงต่ำ)\n   KBank 50% | BBL 50%\n\n3️⃣ **SCBDV** — หุ้นปันผล (เสี่ยงปานกลาง)\n   ADVANC 40% | TRUE 30% | DTAC 30%\n\n💡 พิมพ์ชื่อนโยบายเพื่อดูรายละเอียด เช่น "KMASTER"`;

      case 'portfolio':
        return `💼 **การจัดการ Portfolio:**\n\n问我ได้เกี่ยวกับ:\n• "สร้าง Portfolio" — ขั้นตอนการเปิดพอร์ตใหม่\n• "จัดสัดส่วน" — วิธีกระจายเงิน\n• "ดู Portfolio" — วิธีตรวจสอบสถานะ\n\n💡 หรือพิมพ์คำถามเช่น:\n• "อยากลงทุน 100,000 บาท" — ผมจะแนะนำสัดส่วน\n• "กองทุนไหนดี" — ผมจะเปรียบเทียบให้`;

      case 'portfolio_create':
        return `📝 **ขั้นตอนสร้าง Portfolio:**\n\n1️⃣ ไปที่หน้า **Portfolios** (เมนูด้านซ้าย)\n2️⃣ กดปุ่ม **"Create New"**\n3️⃣ เลือกนโยบายที่ต้องการ:\n   • KMASTER (หุ้นไทย)\n   • TMBUSB (ตราสารหนี้)\n   • SCBDV (หุ้นปันผล)\n4️⃣ ยืนยัน — ระบบจะสร้าง Portfolio ให้อัตโนมัติ\n\n⚠️ **เงื่อนไข:**\n• 1 Portfolio ผูกกับ 1 นโยบายเท่านั้น\n• 1 ลูกค้ามีได้สูงสุด 3 Portfolios (นโยบายละ 1)`;

      case 'portfolio_alloc':
        return `📊 **การจัดสรรเงินใน Portfolio:**\n\nระบบจะกระจายเงินตามสัดส่วนหุ้นในนโยบายโดยอัตโนมัติ\n\n**ตัวอย่าง:** ลงทุน 1,000,000 บาท ใน KMASTER\n• PTT — 400,000 บาท (40%)\n• SCB — 350,000 บาท (35%)\n• CPALL — 250,000 บาท (25%)\n\n**ตัวอย่าง:** ลงทุน 500,000 บาท ใน SCBDV\n• ADVANC — 200,000 บาท (40%)\n• TRUE — 150,000 บาท (30%)\n• DTAC — 150,000 บาท (30%)\n\n💡 ไม่ต้องเลือกหุ้นเอง — ระบบจัดการให้!`;

      case 'portfolio_check':
        return `🔍 **วิธีดู Portfolio:**\n\n1️⃣ ไปที่หน้า **Portfolios** (เมนูด้านซ้าย)\n2️⃣ จะเห็น Portfolio ทั้งหมดของคุณ\n3️⃣ กดเลือก Portfolio เพื่อดูรายละเอียด:\n   • 💰 มูลค่าปัจจุบัน (NAV)\n   • 📈 กำไร/ขาดทุน\n   • 📊 สัดส่วนการถือหุ้น\n   • 📋 รายการ Order ย้อนหลัง\n\n💡 Portfolio จะอัปเดตอัตโนมัติตามราคาตลาด`;

      case 'order':
        return `📋 **การสั่งซื้อ (Order):**\n\n问我ได้เกี่ยวกับ:\n• "ขั้นตอนสั่งซื้อ" — วิธีสร้าง Order\n• "ยกเลิก Order" — เงื่อนไขการยกเลิก\n\n💡 **เงื่อนไขสำคัญ:**\n• 1 Portfolio = 1 active order เท่านั้น\n• ห้ามสร้าง order ใหม่ถ้ายังมี PENDING หรือ PROCESSING\n• ระบบจะกระจายเงินตามสัดส่วนหุ้นอัตโนมัติ`;

      case 'order_step':
        return `🛒 **ขั้นตอนการสั่งซื้อ:**\n\n1️⃣ ไปที่หน้า **Orders** (เมนูด้านซ้าย)\n2️⃣ เลือก Portfolio จาก dropdown\n3️⃣ กดปุ่ม **"Execute Order"**\n4️⃣ ระบุจำนวนเงิน (บาท)\n5️⃣ กด **"Confirm Order"**\n\n⏱️ **สถานะจะเปลี่ยนอัตโนมัติ:**\n\`PENDING\` → \`PROCESSING\` (2 วินาที) → \`COMPLETED\` / \`FAILED\` (5 วินาที)\n\n⚠️ **เงื่อนไข:**\n• ห้ามสร้าง order ใหม่ถ้ายังมี PENDING หรือ PROCESSING อยู่\n• สถานะ COMPLETED แล้วจะไม่เปลี่ยนอีก`;

      case 'order_cancel':
        return `❌ **การยกเลิก Order:**\n\n**เงื่อนไข:** ยกเลิกได้เฉพาะ status **PENDING** เท่านั้น\n\n**ขั้นตอน:**\n1️⃣ ไปที่หน้า **Orders** หรือ **Portfolio Details**\n2️⃣ หารายการที่ต้องการยกเลิก\n3️⃣ กดปุ่ม **"Terminate"**\n4️⃣ ยืนยันการยกเลิก\n\n⚠️ **ไม่สามารถยกเลิกได้หาก:**\n• status เป็น PROCESSING\n• status เป็น COMPLETED\n• status เป็น FAILED`;

      case 'stock':
        return `📈 **ข้อมูลหุ้นในระบบ:**\n\n**กลุ่มพลังงาน:**\n• **PTT** — ปตท. (ใช้ใน KMASTER 40%)\n\n**กลุ่มธนาคาร:**\n• **SCB** — ไทยพาณิชย์ (ใช้ใน KMASTER 35%)\n• **KBank** — กสิกรไทย (ใช้ใน TMBUSB 50%)\n• **BBL** — กรุงเทพ (ใช้ใน TMBUSB 50%)\n\n**กลุ่มสื่อสาร:**\n• **ADVANC** — แอดวานซ์ (ใช้ใน SCBDV 40%)\n• **TRUE** — ทรู (ใช้ใน SCBDV 30%)\n• **DTAC** — โทเทิ่ล (ใช้ใน SCBDV 30%)\n\n**กลุ่มค้าปลีก:**\n• **CPALL** — ซีพี ออลล์ (ใช้ใน KMASTER 25%)\n\n💡 ดูราคาล่าสุดได้ที่หน้า Policies`;

      case 'risk':
        return `⚖️ **ระดับความเสี่ยง:**\n\n🟢 **ต่ำ — TMBUSB** (ตราสารหนี้)\n• ความเสี่ยง: ต่ำที่สุด\n• เหมาะกับ: 保守型 นักลงทุน, มือใหม่\n• เงินต้นปลอดภัย ได้ผลตอบแทนสม่ำเสมอ\n\n🟡 **ปานกลาง — SCBDV** (หุ้นปันผล)\n• ความเสี่ยง: ปานกลาง\n• เหมาะกับ: ต้องการเงินปันผลสม่ำเสมอ\n• มีทั้งเงินปันผลและกำไรจากหุ้น\n\n🔴 **สูง — KMASTER** (หุ้นไทย)\n• ความเสี่ยง: สูง\n• เหมาะกับ: รับความเสี่ยงได้, ลงทุนระยะยาว\n• ผลตอบแทนผันผวนสูง แต่มีโอกาสกำไรมาก\n\n💡 แนะนำ: เริ่มจาก TMBUSB แล้วค่อยกระจาย`;

      case 'return':
        return `💰 **ผลตอบแทน:**\n\n📈 **KMASTER** (หุ้นไทย)\n• ผลตอบแทน: ผันผวนสูง\n• ขึ้นกับตลาดหุ้น\n• ผลตอบแทนมากกว่าถ้าตลาดดี\n\n📊 **SCBDV** (หุ้นปันผล)\n• เงินปันผล: สม่ำเสมอ\n• กำไรจากหุ้น: ปานกลาง\n• เหมาะกับ: ต้องการรายได้เสริม\n\n🏦 **TMBUSB** (ตราสารหนี้)\n• ผลตอบแทน: สม่ำเสมอ\n• ความผันผวนต่ำ\n• เหมาะกับ: เก็บเงินระยะสั้น-กลาง\n\n💡 ลงทุนระยะยาว = KMASTER\n   ต้องการรายได้ = SCBDV\n   เก็บเงิน = TMBUSB`;

      case 'amount': {
        const amountMatch = message.match(/[\d,]+/);
        if (amountMatch) {
          const amount = parseInt(amountMatch[0].replace(/,/g, ''), 10);
          if (amount >= 1000000) {
            return `💰 **งบประมาณ ${amount.toLocaleString()} บาท**\n\nแนะนำกระจายการลงทุน:\n\n**ทางเลือก 1: ปลอดภัย (เสี่ยงต่ำ)**\n• TMBUSB ทั้งหมด — ${amount.toLocaleString()} บาท\n• เหมาะกับ: เก็บเงิน ไม่ต้องการความเสี่ยง\n\n**ทางเลือก 2: สมดุล (เสี่ยงปานกลาง)**\n• TMBUSB — ${Math.floor(amount * 0.6).toLocaleString()} บาท (60%)\n• SCBDV — ${Math.floor(amount * 0.4).toLocaleString()} บาท (40%)\n• เหมาะกับ: ต้องการทั้งความมั่นคงและเงินปันผล\n\n**ทางเลือก 3: เติบโต (เสี่ยงสูง)**\n• KMASTER — ${Math.floor(amount * 0.7).toLocaleString()} บาท (70%)\n• SCBDV — ${Math.floor(amount * 0.3).toLocaleString()} บาท (30%)\n• เหมาะกับ: ลงทุนระยะยาว 5+ ปี`;
          }
          return `💰 **งบประมาณ ${amount.toLocaleString()} บาท**\n\n💡 แนะนำ:\n• เริ่มจาก TMBUSB ก่อน (ความเสี่ยงต่ำ)\n• หรือ SCBDV ถ้าต้องการเงินปันผล\n• KMASTER สำหรับการลงทุนระยะยาว\n\nขั้นตอน:\n1. สร้าง Portfolio ที่หน้า Portfolios\n2. สั่งซื้อที่หน้า Orders\n3. ระบบจะจัดสรรเงินอัตโนมัติ`;
        }
        return `💰 **การลงทุน:**\n\n💡 บอกรายละเอียดได้ เช่น:\n• "อยากลงทุน 100,000 บาท" — ผมจะแนะนำสัดส่วน\n• "มีงบ 500,000" — ผมจะเปรียบเทียบทางเลือก\n\nหรือถามเกี่ยวกับ:\n• "กองทุนไหนดี" — ผมจะแนะนำตามงบประมาณ`;
      }

      case 'thanks':
        return `😊 ยินดีครับคุณ ${customerCode}!\n\nถ้ามีคำถามอื่นๆ 问我ได้เลยนะครับ\n\nหวังว่าจะช่วยเรื่องการลงทุนได้ครับ! 📈`;

      case 'help':
        return `🤖 **AI Investment Advisor ช่วยอะไรได้บ้าง:**\n\n📋 **นโยบายการลงทุน**\n• ดูรายละเอียดแต่ละนโยบาย\n• เปรียบเทียบความเสี่ยงและผลตอบแทน\n• แนะนำกองทุนสำหรับมือใหม่\n\n💼 **Portfolio**\n• วิธีสร้างและจัดการ Portfolio\n• วิธีดูสถานะและมูลค่า\n• การจัดสรรเงินใน Portfolio\n\n🛒 **การสั่งซื้อ**\n• ขั้นตอนการสร้าง Order\n• เงื่อนไขการยกเลิก\n• สถานะของ Order\n\n📈 **หุ้น**\n• ข้อมูลหุ้นในระบบ\n• ราคาล่าสุด\n\n💡 **ตัวอย่างคำถาม:**\n• "กองทุนไหนดีสำหรับมือใหม่?"\n• "เปรียบเทียบ KMASTER กับ TMBUSB"\n• "อยากลงทุน 100,000 บาท"\n• "ขั้นตอนสั่งซื้อ"`;

      default: {
        // Context-aware responses
        if (contextHint) {
          switch (contextHint) {
            case 'kmaster_context':
              return `💡 **นอกจาก KMASTER แล้ว** ยังมี:\n\n• **TMBUSB** — ตราสารหนี้ (เสี่ยงต่ำ)\n  • KBank 50%, BBL 50%\n  • เหมาะกับ: ต้องการความมั่นคง\n\n• **SCBDV** — หุ้นปันผล (เสี่ยงปานกลาง)\n  • ADVANC 40%, TRUE 30%, DTAC 30%\n  • เหมาะกับ: ต้องการเงินปันผล\n\n💡 หรือถามต่อ เช่น:\n• "เปรียบเทียบทั้ง 3"\n• "ลงทุน 500,000 บาท ควรเลือกอะไร"`;
            case 'tmbusb_context':
              return `💡 **TMBUSB เหมาะกับมือใหม่** เพราะ:\n• ความเสี่ยงต่ำที่สุด\n• เงินต้นปลอดภัย\n• ได้ผลตอบแทนสม่ำเสมอ\n\nถ้าต้องการผลตอบแทนมากขึ้น ลองเพิ่ม:\n• **SCBDV** — เสี่ยงปานกลาง ได้เงินปันผล\n• **KMASTER** — เสี่ยงสูง ผลตอบแทนมากกว่า\n\n💡 ลองถาม "เปรียบเทียบทั้ง 3" เพื่อดูภาพรวม`;
            case 'scbdv_context':
              return `💡 **SCBDV เหมาะกับ:**\n• ต้องการเงินปันผลสม่ำเสมอ\n• ลงทุนระยะกลาง-ยาว\n• กลุ่มสื่อสารมีรายได้มั่นคง\n\nถ้าต้องการความมั่นคงมากขึ้น:\n• **TMBUSB** — ตราสารหนี้ (เสี่ยงต่ำ)\n\nถ้าต้องการผลตอบแทนมากขึ้น:\n• **KMASTER** — หุ้นไทย (เสี่ยงสูง)\n\n💡 ลองถาม "ลงทุน 100,000 บาท ควรเลือกอะไร"`;
            case 'portfolio_context':
              return `💡 **สร้าง Portfolio ขั้นตอน:**\n\n1️⃣ ไปที่หน้า **Portfolios**\n2️⃣ กด **"Create New"**\n3️⃣ เลือกนโยบาย\n4️⃣ ยืนยัน\n\n⚠️ 1 Portfolio ผูกกับ 1 นโยบายเท่านั้น\n\nแล้วก็สั่งซื้อได้ที่หน้า **Orders** เลย!`;
            case 'policy_context':
              return `💡 **นโยบายการลงทุนทั้งหมด:**\n\n1️⃣ **KMASTER** — หุ้นไทย (เสี่ยงสูง)\n2️⃣ **TMBUSB** — ตราสารหนี้ (เสี่ยงต่ำ)\n3️⃣ **SCBDV** — หุ้นปันผล (เสี่ยงปานกลาง)\n\n问我ได้เกี่ยวกับ:\n• "เปรียบเทียบทั้ง 3"\n• "กองทุนไหนดีสำหรับมือใหม่"\n• "ลงทุน 100,000 บาท"`;
            case 'invest_context':
              return `💡 **เริ่มลงทุน:**\n\nถ้าเพิ่งเริ่ม แนะนำ:\n1. **TMBUSB** — เริ่มจากความเสี่ยงต่ำ\n2. **SCBDV** — เพิ่มเงินปันผล\n3. **KMASTER** — ถ้ารับความเสี่ยงได้\n\n问我ได้เกี่ยวกับ:\n• "กองทุนไหนดีสำหรับมือใหม่"\n• "เปรียบเทียบทั้ง 3"\n• "ลงทุน 100,000 บาท"`;
          }
        }

        // Generic catch-all
        const catchAlls = [
          `问我ได้เกี่ยวกับ:\n• 📊 นโยบายการลงทุน (KMASTER, TMBUSB, SCBDV)\n• 💼 วิธีจัด Portfolio\n• 🛒 การสั่งซื้อและยกเลิก Order\n• 📈 ข้อมูลหุ้น\n\n💡 ลองถาม เช่น:\n• "กองทุนไหนดีสำหรับมือใหม่?"\n• "เปรียบเทียบทั้ง 3"\n• "อยากลงทุน 100,000 บาท"`,
          `ผมช่วยเรื่องการลงทุนได้ครับ! 🎯\n\nลองถามเกี่ยวกับ:\n• "แนะนำกองทุน" — ผมจะแนะนำตามความเสี่ยง\n• "เปรียบเทียบ" — ผมจะเปรียบเทียบทั้ง 3 นโยบาย\n• "ลงทุน X บาท" — ผมจะแนะนำสัดส่วน\n• "ขั้นตอนสั่งซื้อ" — ผมจะอธิบายวิธีทำ\n\n💡 หรือพิมพ์ "ช่วย" เพื่อดูคำสั่งทั้งหมด`,
          `สวัสดีครับ! 📊\n\nผมเป็น AI Investment Advisor\n\n问我ได้เกี่ยวกับ:\n1. 📋 นโยบายการลงทุน\n2. 💼 การจัด Portfolio\n3. 🛒 การสั่งซื้อ\n4. 📈 ข้อมูลหุ้น\n\n💡 ตัวอย่างคำถาม:\n• "กองทุนไหนดีสำหรับมือใหม่?"\n• "เปรียบเทียบ KMASTER กับ TMBUSB"\n• "อยากลงทุน 50,000 บาท"`,
        ];

        return catchAlls[Math.floor(Math.random() * catchAlls.length)];
      }
    }
  }
}
