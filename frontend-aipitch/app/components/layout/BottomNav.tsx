'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mic, ClipboardList, BarChart3 } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/recorder', label: 'Nuevo', icon: Mic },
  { href: '/history', label: 'Historial', icon: ClipboardList },
  { href: '/rubrics', label: 'Rúbricas', icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-around items-center h-16 px-2">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
            {isActive && <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />}
          </Link>
        );
      })}
    </nav>
  );
}
