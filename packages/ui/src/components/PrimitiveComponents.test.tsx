import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { Badge } from './Badge';
import { Button } from './Button';
import { Callout } from './Callout';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { FieldShell, fieldDescribedBy } from './FieldShell';
import { ErrorBoundary } from './ErrorBoundary';
import { badgeVariants, buttonVariants, calloutVariants, cardVariants } from '../lib/classNames';

describe('Button', () => {
  it('renders primary with fa-button-primary', () => {
    render(<Button>Save</Button>);
    const el = screen.getByRole('button', { name: 'Save' });
    expect(el.className).toContain(buttonVariants.primary);
    expect(el.className).toContain('fa-button-primary');
  });

  it('maps danger alias destructive to fa-button-danger', () => {
    render(
      <Button variant="destructive" type="button">
        Delete
      </Button>
    );
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain(
      buttonVariants.danger
    );
  });

  it('disables while loading', () => {
    render(
      <Button isLoading type="button">
        Working
      </Button>
    );
    expect(screen.getByRole('button', { name: 'Working' })).toBeDisabled();
  });
});

describe('Badge', () => {
  it('composes fa-badge-* variants', () => {
    const { rerender } = render(<Badge variant="success">Ok</Badge>);
    expect(screen.getByText('Ok').className).toContain(badgeVariants.success);
    rerender(<Badge variant="warning">Warn</Badge>);
    expect(screen.getByText('Warn').className).toContain(badgeVariants.warning);
  });
});

describe('Card', () => {
  it('composes fa-card variants', () => {
    render(
      <Card variant="rail" data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>
    );
    expect(screen.getByTestId('card').className).toContain(cardVariants.rail);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
  });
});

describe('Callout', () => {
  it('composes fa-callout-* and maps error → danger surface', () => {
    render(
      <Callout variant="error" title="Failed">
        Details
      </Callout>
    );
    const note = screen.getByRole('note');
    expect(note.className).toContain(calloutVariants.error);
    expect(note.className).toContain('fa-callout-danger');
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });
});

describe('FieldShell', () => {
  it('wires label, helper, and describedBy', () => {
    const id = 'loan-amount';
    render(
      <FieldShell controlId={id} label="Loan amount" helperText="Principal only">
        <input id={id} aria-describedby={fieldDescribedBy(id, { helperText: 'Principal only' })} />
      </FieldShell>
    );
    expect(screen.getByLabelText('Loan amount')).toBeInTheDocument();
    expect(screen.getByText('Principal only')).toHaveAttribute('id', `${id}-helper`);
  });

  it('shows error alert and hides helper when error is set', () => {
    const id = 'rate';
    render(
      <FieldShell controlId={id} label="Rate" error="Required" helperText="APR">
        <input id={id} />
      </FieldShell>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
    expect(screen.queryByText('APR')).not.toBeInTheDocument();
    expect(fieldDescribedBy(id, { error: 'Required', helperText: 'APR' })).toBe(`${id}-error`);
  });
});

describe('ErrorBoundary', () => {
  it('renders fa-callout-danger fallback for island failures', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Boom = () => {
      throw new Error('island crash');
    };

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('fa-callout-danger');
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('island crash')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    spy.mockRestore();
  });
});
