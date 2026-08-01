import React from 'react';
import { Button } from './Button';
import { Callout } from './Callout';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <Callout
            variant="error"
            title="Something went wrong"
            className="max-w-md text-left"
            role="alert"
          >
            <p className="mb-4">
              An unexpected error occurred. Please try again or contact support if the problem
              persists.
            </p>
            {this.state.error?.message ? (
              <p className="mb-4 font-mono text-xs opacity-80">{this.state.error.message}</p>
            ) : null}
            <Button onClick={this.resetError} variant="primary" type="button">
              Try Again
            </Button>
          </Callout>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
