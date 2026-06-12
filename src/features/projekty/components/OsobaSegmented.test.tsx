import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OSOBY } from '@/lib/config';

import { OsobaSegmented } from './OsobaSegmented';

function renderSegmented(value = '', onChange = vi.fn()) {
  render(
    <>
      <span id="dodal-label">Dodał</span>
      <OsobaSegmented value={value} onChange={onChange} labelledBy="dodal-label" />
    </>,
  );
  return onChange;
}

describe('OsobaSegmented', () => {
  it('renderuje radiogroup z wszystkimi osobami z OSOBY i zaznacza wybraną', () => {
    renderSegmented('Kasia');

    const group = screen.getByRole('radiogroup', { name: 'Dodał' });
    const radios = screen.getAllByRole('radio');

    expect(group).toBeInTheDocument();
    expect(radios).toHaveLength(OSOBY.length);
    OSOBY.forEach((osoba) => {
      expect(screen.getByRole('radio', { name: osoba })).toBeInTheDocument();
    });
    expect(screen.getByRole('radio', { name: 'Kasia' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Ania' })).not.toBeChecked();
  });

  it('klik w osobę wywołuje onChange z jej imieniem', async () => {
    const user = userEvent.setup();
    const onChange = renderSegmented('Ania');

    await user.click(screen.getByRole('radio', { name: 'Marek' }));

    expect(onChange).toHaveBeenCalledWith('Marek');
  });

  it('obsługuje klawiaturę: strzałka w prawo zaznacza następną osobę (wzorzec radiogroup)', async () => {
    const user = userEvent.setup();
    const onChange = renderSegmented(OSOBY[0]);

    // Tab wchodzi na zaznaczone radio, strzałka przesuwa zaznaczenie na następne.
    await user.tab();
    expect(screen.getByRole('radio', { name: OSOBY[0] })).toHaveFocus();

    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith(OSOBY[1]);
  });
});
