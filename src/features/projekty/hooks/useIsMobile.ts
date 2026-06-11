import { useEffect, useState } from 'react';

/** Breakpoint mobile: < 768px (DESIGN.md — tabela desktop ≥ 768, karty mobile < 768). */
const MOBILE_QUERY = '(max-width: 767px)';

/**
 * Reaktywne wykrywanie mobile przez `matchMedia` (nie user-agent — decyzja D5).
 * Aktualizuje się przy zmianie szerokości okna; listener sprzątany w cleanup.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);

    const handleChange = (event: MediaQueryListEvent): void => {
      setIsMobile(event.matches);
    };

    // Synchronizuj na wypadek zmiany między initial state a montażem efektu.
    setIsMobile(media.matches);
    media.addEventListener('change', handleChange);

    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, []);

  return isMobile;
}
