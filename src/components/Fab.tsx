import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * FAB (mobile, DESIGN.md): okrągły terakotowy przycisk `fixed bottom-right` (20px),
 * 52×52, ikona Plus 22. Na mobile zastępuje CTA „+ Nowy projekt" z headera.
 */
export function Fab() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label="Nowy projekt"
      onClick={() => navigate('/nowy')}
      className="fixed bottom-5 right-5 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent text-white shadow-[0_4px_18px_rgba(181,84,45,0.30)] transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
    >
      <Plus size={22} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

export default Fab;
