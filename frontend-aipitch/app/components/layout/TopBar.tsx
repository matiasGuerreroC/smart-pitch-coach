'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Mostrar el botón "Volver" si la ruta NO es ninguna de las principales
  const isSubPage = pathname !== '/' && pathname !== '/recorder' && pathname !== '/history' && pathname !== '/rubrics';

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
      <div>
        {isSubPage && (
          <button 
            onClick={() => router.back()}
            className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span className="mr-2">&larr;</span> Volver
          </button>
        )}
      </div>

      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      )}
    </header>
  );
}