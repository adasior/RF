import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmSheet } from './ConfirmSheet';

function renderSheet(nowaWartosc: boolean) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  render(
    <ConfirmSheet
      nazwa="Koszulka klubowa"
      flagaLabel="ROZPISANE"
      nowaWartosc={nowaWartosc}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );

  return { onConfirm, onCancel };
}

describe('ConfirmSheet', () => {
  it('nowaWartosc=true: tytuł „Zaznaczyć flagę?", nazwa projektu i podgląd flagi aktywnej', () => {
    renderSheet(true);

    const dialog = screen.getByRole('dialog', { name: 'Zaznaczyć flagę?' });
    expect(within(dialog).getByText('Koszulka klubowa')).toBeInTheDocument();
    // Podgląd FlagBtn pokazuje stan PO zmianie (aktywny).
    expect(within(dialog).getByRole('button', { name: /rozpisane/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('nowaWartosc=false: tytuł „Cofnąć flagę?" i podgląd flagi nieaktywnej', () => {
    renderSheet(false);

    const dialog = screen.getByRole('dialog', { name: 'Cofnąć flagę?' });
    expect(within(dialog).getByRole('button', { name: /rozpisane/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('klik „Tak, zmień" wywołuje onConfirm (bez onCancel)', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderSheet(true);

    await user.click(screen.getByRole('button', { name: 'Tak, zmień' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('klik „Anuluj" wywołuje onCancel (bez onConfirm)', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderSheet(true);

    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Escape = anuluj (zamknięcie sheetu klawiaturą)', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderSheet(true);

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('klik w overlay = anuluj; klik w treść sheetu NIE anuluje', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderSheet(true);

    // Klik w treść sheetu (tytuł) — stopPropagation, brak anulowania.
    await user.click(screen.getByText('Zaznaczyć flagę?'));
    expect(onCancel).not.toHaveBeenCalled();

    // Klik w overlay (rodzic dialogu) — anuluj.
    const overlay = screen.getByRole('dialog').parentElement;
    expect(overlay).not.toBeNull();
    if (overlay) {
      await user.click(overlay);
    }
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
