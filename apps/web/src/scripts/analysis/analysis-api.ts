export class AnalysisRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisRequestError';
  }
}

const DEFAULT_ERROR_MESSAGE = 'Unable to complete the analysis request. Please try again.';

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }

  const errorDetails = data.error;
  if (errorDetails && typeof errorDetails === 'object') {
    const errorRecord = errorDetails as Record<string, unknown>;
    if (typeof errorRecord.message === 'string' && errorRecord.message.trim().length > 0) {
      return errorRecord.message;
    }
  }

  return fallback;
};

export const postAnalysisRequest = async <TResponse>(
  endpoint: string,
  payload: unknown,
  options: { signal?: AbortSignal } = {}
): Promise<TResponse> => {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    });
  } catch (error) {
    throw new AnalysisRequestError(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // ignore JSON parse errors, we will handle below
  }

  if (!response.ok) {
    const message = extractErrorMessage(data, `Analysis request failed (${response.status})`);
    throw new AnalysisRequestError(message);
  }

  if (data == null || typeof data !== 'object') {
    throw new AnalysisRequestError(DEFAULT_ERROR_MESSAGE);
  }

  return data as TResponse;
};
