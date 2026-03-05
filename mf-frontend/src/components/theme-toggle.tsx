'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-[52px] h-[28px] rounded-full bg-muted-foreground/20" />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`
        relative w-[52px] h-[28px] rounded-full transition-all duration-300 
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${isDark 
          ? 'bg-primary shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]' 
          : 'bg-muted-foreground/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)]'
        }
      `}
      title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      aria-label="Alternar tema"
    >
      {/* Track icons */}
      <Sun className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-30 text-yellow-200' : 'opacity-0'}`} />
      <Moon className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-30 text-slate-600'}`} />
      
      {/* Sliding thumb */}
      <span
        className={`
          absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-md 
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isDark ? 'left-[27px]' : 'left-[3px]'}
        `}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-primary" />
        ) : (
          <Sun className="w-3 h-3 text-amber-500" />
        )}
      </span>
    </button>
  );
}
