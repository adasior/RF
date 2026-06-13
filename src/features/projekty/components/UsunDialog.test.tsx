import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UsunDialog } from './UsunDialog';

function renderDialog(over: { onConfirm?: () => void; onCancel?: () => void; isPending?: boolean } = {}) {
  return render(
    <UsunDialog
      nazwa="Koszulka klubowa"
      isPending={over.isPending ?? false}
      onConfirm={over.onConfirm ?? (() => undefined)}
      onCancel={over.onCancel ?? (() => undefined)}
    />,
  );
}

describe('UsunDialog', () => {
  it('renderuje dialog z nazwą projektu i przyciskami Usuń/Anuluj', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText(/Koszulka klubowa/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeInTheDocument();
  });

  it('potwierdzenie → onConfirm (archiwizacja)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderDialog({ onConfirm });

    await user.click(screen.getByRole('button', { name: 'Usuń' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('anulowanie → onCancel, bez onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderDialog({ onConfirm, onCancel });

    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('klik w overlay anuluje', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    renderDialog({ onCancel, onConfirm });

    // Klik poza dialogiem (overlay) — kontener dialogu zatrzymuje propagację.
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('isPending blokuje oba przyciski', () => {
    renderDialog({ isPending: true });

    expect(screen.getByRole('button', { name: 'Usuń' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeDisabled();
  });
});
