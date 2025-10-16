import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ValidatedInput, ValidatedNumberInput } from './ValidatedField';

describe('ValidatedInput', () => {
  it('shows validation error on blur when invalid', () => {
    const validator = (value: string) => (value.trim() ? null : 'Name is required');
    const handleValueChange = vi.fn();

    const Wrapper = () => {
      const [value, setValue] = React.useState('');
      const handleChange = (next: string) => {
        setValue(next);
        handleValueChange(next);
      };
      return React.createElement(ValidatedInput, {
        label: 'Name',
        value,
        onValueChange: handleChange,
        validator,
      });
    };

    render(React.createElement(Wrapper));

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: '' } });

    expect(screen.queryByText('Name is required')).toBeNull();

    fireEvent.blur(input);
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('validates on change when validateOnChange is true', () => {
    const validator = (value: string) => (value.includes('@') ? null : 'Must include @');
    const handleValueChange = vi.fn();

    const Wrapper = () => {
      const [value, setValue] = React.useState('');
      const handleChange = (next: string) => {
        setValue(next);
        handleValueChange(next);
      };
      return React.createElement(ValidatedInput, {
        label: 'Email',
        value,
        onValueChange: handleChange,
        validator,
        validateOnChange: true,
      });
    };

    render(React.createElement(Wrapper));

    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'invalid' } });

    expect(handleValueChange).toHaveBeenCalledWith('invalid');
    expect(screen.getByText('Must include @')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'user@example.com' } });
    expect(screen.queryByText('Must include @')).toBeNull();
  });

  it('notifies validation changes via callback', () => {
    const validator = (value: string) => (value ? null : 'Required');
    const handleValidationChange = vi.fn();

    const Wrapper = () => {
      const [value, setValue] = React.useState('');
      const handleChange = (next: string) => {
        setValue(next);
      };
      return React.createElement(ValidatedInput, {
        label: 'Company',
        value,
        onValueChange: handleChange,
        validator,
        onValidationChange: handleValidationChange,
        validateOnChange: true,
      });
    };

    render(React.createElement(Wrapper));

    const input = screen.getByLabelText('Company');
    fireEvent.change(input, { target: { value: 'OpenAI' } });
    expect(handleValidationChange).toHaveBeenLastCalledWith(null);

    fireEvent.change(input, { target: { value: '' } });
    expect(handleValidationChange).toHaveBeenLastCalledWith('Required');
  });
});

describe('ValidatedNumberInput', () => {
  it('parses number input using optional parser and validates on blur', async () => {
    const handleValueChange = vi.fn();
    const validator = (value: number | undefined) =>
      value !== undefined && value > 1000 ? 'Value must be 1000 or less' : null;

    const Wrapper = () => {
      const [value, setValue] = React.useState<number | undefined>(undefined);
      const handleChange = (next: number | undefined) => {
        setValue(next);
        handleValueChange(next);
      };
      return React.createElement(ValidatedNumberInput, {
        label: 'Budget',
        value,
        onValueChange: handleChange,
        validator,
      });
    };

    render(React.createElement(Wrapper));

    const input = screen.getByLabelText('Budget');
    fireEvent.change(input, { target: { value: '1500' } });

    expect(handleValueChange).toHaveBeenCalledWith(1500);
    expect(screen.queryByText('Value must be 1000 or less')).toBeNull();

    fireEvent.blur(input);
    await screen.findByText('Value must be 1000 or less');
  });

  it('updates display when parent value changes', () => {
    const Wrapper = () => {
      const [value, setValue] = React.useState<number | undefined>(undefined);
      return React.createElement(
        'div',
        null,
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setValue(42),
          },
          'Set Value'
        ),
        React.createElement(ValidatedNumberInput, {
          label: 'Projected Hours',
          value,
          onValueChange: setValue,
          validator: () => null,
        })
      );
    };

    render(React.createElement(Wrapper));

    fireEvent.click(screen.getByText('Set Value'));
    const input = screen.getByLabelText('Projected Hours') as HTMLInputElement;
    expect(input.value).toBe('42');
  });
});
