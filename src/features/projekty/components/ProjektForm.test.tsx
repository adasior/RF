import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ProjektForm, type ProjektFormProps } from './ProjektForm';

function renderForm(over: Partial<ProjektFormProps> = {}) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  render(
    <ProjektForm
      mode="create"
      isSubmitting={false}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...over}
    />,
  );

  return { onSubmit, onCancel };
}

describe('ProjektForm — walidacja', () => {
  it('submit bez wymaganych pól pokazuje błędy PL pod nazwa/kategoria/dodał; onSubmit NIE wywołane', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Zapisz projekt' }));

    expect(await screen.findByText('Nazwa jest wymagana')).toBeInTheDocument();
    expect(screen.getByText('Kategoria jest wymagana')).toBeInTheDocument();
    expect(screen.getByText('Pole „Dodał" jest wymagane')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('wybór „Inne…" bez wpisania własnej kategorii blokuje submit z komunikatem PL', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/nazwa projektu/i), 'Bluzy dla klubu');
    await user.selectOptions(screen.getByLabelText(/kategoria/i), 'Inne…');
    await user.click(screen.getByRole('radio', { name: 'Ania' }));
    await user.click(screen.getByRole('button', { name: 'Zapisz projekt' }));

    expect(await screen.findByText('Podaj kategorię')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ProjektForm — kategoria „Inne…" (D9)', () => {
  it('input własnej kategorii pojawia się dopiero po wyborze „Inne…", a jego wartość trafia do kategoria', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    expect(screen.queryByLabelText(/własna kategoria/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/kategoria/i), 'Inne…');
    const wlasna = await screen.findByLabelText(/własna kategoria/i);

    await user.type(screen.getByLabelText(/nazwa projektu/i), 'Sztandar');
    await user.type(wlasna, 'Sztandar haftowany');
    await user.click(screen.getByRole('radio', { name: 'Bartek' }));
    await user.click(screen.getByRole('button', { name: 'Zapisz projekt' }));

    expect(onSubmit).toHaveBeenCalledWith({
      nazwa: 'Sztandar',
      kategoria: 'Sztandar haftowany',
      dodal: 'Bartek',
      kontakt: null,
      uwagi: null,
    });
  });
});

describe('ProjektForm — poprawny submit', () => {
  it('wysyła wartości formularza; puste opcjonalne pola jako null', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/nazwa projektu/i), 'Koszulki firmowe');
    await user.selectOptions(screen.getByLabelText(/kategoria/i), 'T-shirt');
    await user.type(screen.getByLabelText(/kontakt/i), 'jan@firma.pl');
    await user.click(screen.getByRole('radio', { name: 'Kasia' }));
    await user.click(screen.getByRole('button', { name: 'Zapisz projekt' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      nazwa: 'Koszulki firmowe',
      kategoria: 'T-shirt',
      dodal: 'Kasia',
      kontakt: 'jan@firma.pl',
      uwagi: null,
    });
  });

  it('Anuluj wywołuje onCancel bez submitu', async () => {
    const user = userEvent.setup();
    const { onSubmit, onCancel } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ProjektForm — mode=edit (reuse w U9)', () => {
  it('wypełnia pola z defaultValues i pokazuje „Zapisz zmiany"; kategoria spoza listy → „Inne…" + input', () => {
    renderForm({
      mode: 'edit',
      defaultValues: {
        nazwa: 'Sztandar',
        kategoria: 'Sztandar haftowany',
        dodal: 'Marek',
        kontakt: 'klub@example.com',
        uwagi: 'Pilne',
      },
    });

    expect(screen.getByLabelText(/nazwa projektu/i)).toHaveValue('Sztandar');
    expect(screen.getByLabelText(/^kategoria/i)).toHaveValue('Inne…');
    expect(screen.getByLabelText(/własna kategoria/i)).toHaveValue('Sztandar haftowany');
    expect(screen.getByRole('radio', { name: 'Marek' })).toBeChecked();
    expect(screen.getByLabelText(/kontakt/i)).toHaveValue('klub@example.com');
    expect(screen.getByLabelText(/uwagi/i)).toHaveValue('Pilne');
    expect(screen.getByRole('button', { name: 'Zapisz zmiany' })).toBeInTheDocument();
  });
});
