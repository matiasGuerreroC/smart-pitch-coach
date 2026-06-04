export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-blue-100 dark:border-slate-700 p-6 transition-shadow hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}