import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FlagBtn } from './FlagBtn';

describe('FlagBtn', () => {
  it('aktywny: renderuje zielony styl + ikonę Check, aria-pressed=true', () => {
    render(<FlagBtn label="ROZPISANE" isActive size="table" onToggle={vi.fn()} />);

    const button = screen.getByRole('button', { name: /rozpisane/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button.className).toContain('bg-flag-on-bg');
    // Check (lucide) renderuje element <svg> z klasą lucide-check.
    expect(button.querySelector('.lucide-check')).not.toBeNull();
  });

  it('nieaktywny: renderuje szary styl + ikonę Circle, aria-pressed=false', () => {
    render(<FlagBtn label="ROZPISANE" isActive={false} size="table" onToggle={vi.fn()} />);

    const button = screen.getByRole('button', { name: /rozpisane/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button.className).toContain('bg-flag-off-bg');
    expect(button.querySelector('.lucide-circle')).not.toBeNull();
  });

  it('klik wywołuje onToggle z zanegowaną wartością', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(<FlagBtn label="ROZPISANE" isActive={false} size="table" onToggle={handleToggle} />);

    await user.click(screen.getByRole('button', { name: /rozpisane/i }));

    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it('klik nie propaguje do rodzica (stopPropagation w klikalnym wierszu)', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();
    const handleToggle = vi.fn();
    render(
      <div onClick={handleRowClick}>
        <FlagBtn label="ROZPISANE" isActive={false} size="table" onToggle={handleToggle} />
      </div>,
    );

    await user.click(screen.getByRole('button', { name: /rozpisane/i }));

    expect(handleToggle).toHaveBeenCalledWith(true);
    expect(handleRowClick).not.toHaveBeenCalled();
  });
});
