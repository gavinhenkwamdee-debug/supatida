import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
          </Link>
        </div>

        <div className="bg-white p-8 space-y-4" style={{ border: "1px solid var(--border)" }}>
          <h2 className="text-lg tracking-wide" style={{ color: "var(--charcoal)" }}>นโยบายความเป็นส่วนตัว (Privacy Policy)</h2>

          <div className="space-y-3 text-sm font-sans" style={{ color: "var(--charcoal)" }}>
            <p>
              Supatida เก็บรวบรวมข้อมูลส่วนบุคคลของท่าน (ชื่อ, เบอร์โทรศัพท์, วันเกิด, และข้อมูลความสนใจที่ท่านให้ไว้ตอนสมัครสมาชิก)
              เพื่อวัตถุประสงค์ดังนี้:
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--muted)" }}>
              <li>จัดการบัญชีสมาชิกและระบบสะสมแต้ม</li>
              <li>แจ้งและมอบสิทธิพิเศษตามระดับสมาชิก</li>
              <li>ติดต่อเกี่ยวกับสินค้า บริการ และโปรโมชันที่เกี่ยวข้อง</li>
              <li>ปรับปรุงคุณภาพสินค้าและบริการให้ตรงความต้องการของลูกค้า</li>
            </ul>
            <p>
              ข้อมูลของท่านจะถูกเก็บรักษาอย่างปลอดภัย และจะไม่ถูกเปิดเผยต่อบุคคลภายนอกโดยไม่ได้รับความยินยอม
              ยกเว้นกรณีที่กฎหมายกำหนด ท่านมีสิทธิขอเข้าถึง แก้ไข หรือขอให้ลบข้อมูลส่วนบุคคลของท่านได้ทุกเมื่อ
              โดยติดต่อผ่านช่องทาง LINE Official ของร้าน
            </p>
            <p style={{ color: "var(--muted)" }}>
              เอกสารนี้เป็นแนวทางเบื้องต้นตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) พ.ศ. 2562 โปรดปรึกษาผู้เชี่ยวชาญด้านกฎหมาย
              เพื่อความถูกต้องครบถ้วนตามข้อกำหนดของธุรกิจท่าน
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
