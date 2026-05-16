/**
 * Unified Calculator Handler
 *
 * Provides a standardized pattern for calculator implementations to reduce
 * duplication and ensure consistency across all calculators.
 */

import {
  DOM_IDS,
  hideResults,
  setLoadingState,
  showResults,
  showError,
  hideError,
  handleCalculatorResult,
  handleCalculatorError,
  setupResetButton,
} from './calculator-utilities';

type MaybePromise<T> = T | Promise<T>;

/**
 * Configuration for calculator initialization
 */
export interface CalculatorConfig<InputType, ResultType> {
  /** Calculator ID for events and storage */
  calculatorId: string;

  /** Parse form data to calculator input */
  parseInput: (form: HTMLFormElement) => InputType;

  /** Run calculator analysis */
  analyze: (input: InputType) => MaybePromise<ResultType>;

  /** Display results in the UI */
  displayResults: (result: ResultType, input: InputType) => void;

  /** Optional: validate input before analysis */
  validateInput?: (input: InputType) => void;

  /** Optional: custom error handling */
  onError?: (error: unknown) => void;

  /** Optional: custom success handling */
  onSuccess?: (result: ResultType, input: InputType) => void;
}

/**
 * Create a standard calculator handler
 */
export function createCalculatorHandler<InputType, ResultType>(
  config: CalculatorConfig<InputType, ResultType>
): void {
  const form = document.getElementById(DOM_IDS.FORM);
  const calculateBtn = document.getElementById(DOM_IDS.CALCULATE_BUTTON);
  const submitBtn = document.getElementById('submit-btn'); // Some forms use submit-btn

  if (!(form instanceof HTMLFormElement)) {
    console.warn(`[${config.calculatorId}] Calculator form not found`);
    return;
  }

  const activeCalculateBtn =
    calculateBtn instanceof HTMLButtonElement
      ? calculateBtn
      : submitBtn instanceof HTMLButtonElement
        ? submitBtn
        : null;

  // Setup form submission handler
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!activeCalculateBtn) {
      console.error(`[${config.calculatorId}] Calculate button not found`);
      return;
    }

    hideError();

    try {
      // Set loading state
      setLoadingState(activeCalculateBtn, true);
      hideResults();

      // Parse input
      const input = config.parseInput(form);

      // Validate input if validator provided
      if (config.validateInput) {
        config.validateInput(input);
      }

      // Run analysis (sync or async)
      const result = await config.analyze(input);

      // Display results
      config.displayResults(result, input);

      // Show results
      showResults();

      // Handle result storage and events
      handleCalculatorResult({
        calculatorId: config.calculatorId,
        result,
        formData: input,
      });

      // Custom success handler
      if (config.onSuccess) {
        config.onSuccess(result, input);
      }
    } catch (error) {
      const errorMessage = handleCalculatorError(error);
      showError(errorMessage);

      // Custom error handler
      if (config.onError) {
        config.onError(error);
      }
    } finally {
      setLoadingState(activeCalculateBtn, false);
    }
  });

  // Setup reset button
  setupResetButton(form);
}

/**
 * Async version for calculators that need API calls
 */
export function createAsyncCalculatorHandler<InputType, ResultType>(
  config: CalculatorConfig<InputType, ResultType> & {
    analyze: (input: InputType) => Promise<ResultType>;
  }
): void {
  createCalculatorHandler(config);
}

/**
 * Simple calculator wrapper for basic use cases
 */
export function createSimpleCalculator<InputType, ResultType>(
  calculatorId: string,
  parseInput: (form: HTMLFormElement) => InputType,
  analyze: (input: InputType) => ResultType,
  displayResults: (result: ResultType, input: InputType) => void
): void {
  createCalculatorHandler<InputType, ResultType>({
    calculatorId,
    parseInput,
    analyze,
    displayResults,
  });
}

/**
 * Simple async calculator wrapper
 */
export function createSimpleAsyncCalculator<InputType, ResultType>(
  calculatorId: string,
  parseInput: (form: HTMLFormElement) => InputType,
  analyze: (input: InputType) => Promise<ResultType>,
  displayResults: (result: ResultType, input: InputType) => void
): void {
  createAsyncCalculatorHandler<InputType, ResultType>({
    calculatorId,
    parseInput,
    analyze,
    displayResults,
  });
}
