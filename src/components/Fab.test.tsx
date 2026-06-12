import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Fab } from './Fab';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderFab() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Fab />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('Fab', () => {
  it('renderuje przycisk z dostępną etykietą „Nowy projekt"', () => {
    renderFab();

    expect(screen.getByRole('button', { name: 'Nowy projekt' })).toBeInTheDocument();
  });

  it('klik nawiguje do /nowy', async () => {
    const user = userEvent.setup();
    renderFab();

    await user.click(screen.getByRole('button', { name: 'Nowy projekt' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/nowy');
  });
});
