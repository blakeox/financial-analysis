import React from 'react';
import { Input, type InputProps } from './Input';
import { parsers } from '../lib/formUtils';

type ValidationResult = string | null;

type ValidationCallback<T> = (value: T) => ValidationResult;

type CommonValidatedProps<TValue> = {
  value: TValue;
  onValueChange: (value: TValue) => void;
  validator?: ValidationCallback<TValue>;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  onValidationChange?: (error: ValidationResult) => void;
};

type InputWithoutValue = Omit<InputProps, 'value' | 'onChange' | 'type'>;

type ValidatedInputProps = CommonValidatedProps<string> &
  InputWithoutValue & {
    /**
     * Whether to run validation immediately on mount. Defaults to false
     * to avoid showing errors before user interaction.
     */
    validateOnMount?: boolean;
    type?: InputProps['type'];
  };

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      value,
      onValueChange,
      validator,
      validateOnBlur = true,
      validateOnChange = false,
      validateOnMount = false,
      onValidationChange,
      onBlur,
      type = 'text',
      error: externalError,
      helperText,
      ...rest
    },
    ref
  ) => {
    const [validationError, setValidationError] = React.useState<ValidationResult>(null);
    const [touched, setTouched] = React.useState(false);

    const runValidation = React.useCallback(
      (currentValue: string) => {
        if (!validator) {
          return null;
        }
        const nextError = validator(currentValue);
        setValidationError(nextError);
        onValidationChange?.(nextError);
        return nextError;
      },
      [validator, onValidationChange]
    );

    React.useEffect(() => {
      if (validator && (validateOnMount || touched)) {
        runValidation(value);
      }
    }, [value, validator, validateOnMount, touched, runValidation]);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      const nextValue = event.target.value;
      onValueChange(nextValue);
      if (validateOnChange) {
        runValidation(nextValue);
      }
    };

    const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
      setTouched(true);
      if (validateOnBlur) {
        runValidation(event.target.value);
      }
      onBlur?.(event);
    };

    const derivedError = externalError ?? validationError ?? undefined;
    const helperTextProp = helperText ?? undefined;

    return (
      <Input
        {...rest}
        ref={ref}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...(helperTextProp !== undefined ? { helperText: helperTextProp } : {})}
        {...(derivedError !== undefined ? { error: derivedError } : {})}
      />
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

type ValidatedNumberInputProps = CommonValidatedProps<number | undefined> &
  InputWithoutValue & {
    type?: 'number' | 'text';
    parser?: (value: string) => number | undefined;
    format?: (value: number | undefined) => string;
    validateOnMount?: boolean;
  };

const defaultFormatNumber = (value: number | undefined) =>
  typeof value === 'number' && !Number.isNaN(value) ? value.toString() : '';

export const ValidatedNumberInput = React.forwardRef<HTMLInputElement, ValidatedNumberInputProps>(
  (
    {
      value,
      onValueChange,
      validator,
      validateOnBlur = true,
      validateOnChange = false,
      validateOnMount = false,
      onValidationChange,
      parser = parsers.optionalNumber,
      format = defaultFormatNumber,
      onBlur,
      type = 'number',
      error: externalError,
      helperText,
      ...rest
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState(() => format(value));
    const [validationError, setValidationError] = React.useState<ValidationResult>(null);
    const [touched, setTouched] = React.useState(false);

    React.useEffect(() => {
      const formatted = format(value);
      setInputValue((prev) => (prev === formatted ? prev : formatted));
    }, [value, format]);

    const runValidation = React.useCallback(
      (currentNumericValue: number | undefined) => {
        if (!validator) {
          return null;
        }
        const nextError = validator(currentNumericValue);
        setValidationError(nextError);
        onValidationChange?.(nextError);
        return nextError;
      },
      [validator, onValidationChange]
    );

    React.useEffect(() => {
      if (validator && (validateOnMount || touched)) {
        runValidation(value);
      }
    }, [value, validator, validateOnMount, touched, runValidation]);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      const nextDisplayValue = event.target.value;
      setInputValue(nextDisplayValue);
      const parsedValue = parser(nextDisplayValue);
      onValueChange(parsedValue);
      if (validateOnChange) {
        runValidation(parsedValue);
      }
    };

    const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
      setTouched(true);
      const parsedValue = parser(event.target.value);
      if (validateOnBlur) {
        runValidation(parsedValue);
      }
      onBlur?.(event);
    };

    const { inputMode, ...restProps } = rest;

    const derivedError = externalError ?? validationError ?? undefined;
    const helperTextProp = helperText ?? undefined;

    return (
      <Input
        {...restProps}
        ref={ref}
        type={type}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        inputMode={inputMode ?? (type === 'number' ? 'decimal' : undefined)}
        {...(helperTextProp !== undefined ? { helperText: helperTextProp } : {})}
        {...(derivedError !== undefined ? { error: derivedError } : {})}
      />
    );
  }
);

ValidatedNumberInput.displayName = 'ValidatedNumberInput';