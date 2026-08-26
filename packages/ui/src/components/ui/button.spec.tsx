import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button, buttonVariants } from './button';

describe('Button', () => {
  it('renders a native button by default', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('applies the default variant and size when none are given', () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('h-10');
  });

  it.each(['destructive', 'outline', 'secondary', 'ghost', 'link'] as const)(
    'renders the %s variant',
    (variant) => {
      render(<Button variant={variant}>x</Button>);

      expect(screen.getByRole('button').className).toBe(buttonVariants({ variant }));
    },
  );

  it('lets a caller-supplied class win over the variant class', () => {
    render(
      <Button variant="destructive" className="bg-primary">
        x
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
    expect(button).not.toHaveClass('bg-destructive');
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick while disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the child element instead of a button when asChild is set', () => {
    render(
      <Button asChild>
        <a href="/docs">Docs</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', '/docs');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('forwards a ref to the underlying element', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>x</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
