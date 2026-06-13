import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HardDeleteDialog } from './HardDeleteDialog';

function renderDialog(over: { onConfirm?: () => void; onCancel?: () => void; isPending?: boolean } = {}) {
  return render(
    <HardDeleteDialog
      nazwa="Koszulka klubowa"
      isPending={over.isPending ?? false}
      onConfirm={over.onConfirm ?? (() => undefined)}
      onCancel={over.onCancel ?? (() => undefined)}
    />,
  );
}

describe('HardDeleteDialog', () => {
  it('renderuje danger styling: „Operacja nieodwracalna" + krok 1 „Usuń trwale"', () => {
    renderDialog();

    expect(screen.getByText('Operacja nieodwracalna')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń trwale' })).toBeInTheDocument();
  });

  it('przejście 3 kroków → onConfirm dopiero po ostatnim kroku', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderDialog({ onConfirm });

    // Krok 1 → 2.
    await user.click(screen.getByRole('button', { name: 'Usuń trwale' }));
    expect(onConfirm).not.toHaveBeenCalled();

    // Krok 2 → 3.
    await user.click(screen.getByRole('button', { name: 'Na pewno?' }));
    expect(onConfirm).not.toHaveBeenCalled();

    // Krok 3 → onConfirm.
    await user.click(screen.getByRole('button', { name: 'Tak, usuń bezpowrotnie' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('anulowanie na kroku 2 → onCancel, bez onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderDialog({ onConfirm, onCancel });

    await user.click(screen.getByRole('button', { name: 'Usuń trwale' }));
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('anulowanie resetuje krok do 1 (po ponownym otwarciu start od „Usuń trwale")', async () => {
    const user = userEvent.setup();

    renderDialog();

    // Wejdź na krok 2, potem anuluj → krok wraca do 1.
    await user.click(screen.getByRole('button', { name: 'Usuń trwale' }));
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    // Po anulowaniu danger button znów pokazuje krok 1.
    expect(screen.getByRole('button', { name: 'Usuń trwale' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Na pewno?' })).not.toBeInTheDocument();
  });

  it('klik w overlay anuluje bez onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderDialog({ onConfirm, onCancel });

    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('isPending blokuje przyciski', () => {
    renderDialog({ isPending: true });

    expect(screen.getByRole('button', { name: 'Usuń trwale' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeDisabled();
  });
});
