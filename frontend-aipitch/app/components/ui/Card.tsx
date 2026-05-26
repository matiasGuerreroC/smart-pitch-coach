export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition-shadow hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}