'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Mic, ClipboardList, BarChart3, LogOut } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/recorder', label: 'Nuevo Análisis', icon: Mic },
  { href: '/history', label: 'Historial', icon: ClipboardList },
  { href: '/rubrics', label: 'Rúbricas', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="px-2 py-4 mb-6">
        <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          AIPitch
        </span>
      </div>
      <nav className="flex-1 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                isActive
                  ? 'bg-white dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-100/60 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-indigo-100 dark:border-slate-800 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
