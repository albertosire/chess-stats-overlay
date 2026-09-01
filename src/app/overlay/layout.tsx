export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent" style={{ background: "transparent" }}>
      {children}
    </div>
  );
}
