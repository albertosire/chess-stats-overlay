export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      <div className="min-h-screen bg-transparent" style={{ background: "transparent" }}>
        {children}
      </div>
    </>
  );
}
