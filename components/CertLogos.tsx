export default function CertLogos({ igi, gci }: { igi: boolean; gci: boolean }) {
  if (!igi && !gci) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-end gap-2 pointer-events-none">
      {igi && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/igi-logo.png" alt="IGI Certified" style={{ width: "80px", opacity: 0.85 }} />
      )}
      {gci && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/gci-logo.jpg" alt="GCI Certified" style={{ width: "80px", opacity: 0.85 }} />
      )}
    </div>
  );
}
