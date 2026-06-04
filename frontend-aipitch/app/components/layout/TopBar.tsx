'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, ChevronLeft } from 'lucide-react';

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isSubPage = pathname !== '/' && pathname !== '/recorder' && pathname !== '/history' && pathname !== '/rubrics';

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-slate-900 border-b border-indigo-100 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
      <div className="flex items-center gap-3">
        {isSubPage ? (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ChevronLeft size={16} /> Volver
          </button>
        ) : (
          <span className="md:hidden text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            AIPitch
          </span>
        )}
      </div>

      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}
    </header>
  );
}
