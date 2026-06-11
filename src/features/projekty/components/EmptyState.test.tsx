import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('wariant brak-projektow: nagłówek, opis i CTA „+ Nowy projekt"', () => {
    render(<EmptyState variant="brak-projektow" onAction={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Brak projektów' })).toBeInTheDocument();
    expect(screen.getByText('Dodaj pierwszy projekt.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Nowy projekt' })).toBeInTheDocument();
  });

  it('wariant brak-wynikow: nagłówek, opis i CTA „Pokaż wszystkie"', () => {
    render(<EmptyState variant="brak-wynikow" onAction={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'Brak projektów do pokazania' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Wszystko zrobione albo zmień filtr.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pokaż wszystkie' })).toBeInTheDocument();
  });

  it('klik CTA wywołuje onAction', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    render(<EmptyState variant="brak-projektow" onAction={handleAction} />);

    await user.click(screen.getByRole('button', { name: '+ Nowy projekt' }));

    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
