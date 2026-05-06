import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex-center bg-surface-base p-4">
          <div className="max-w-md w-full">
            <div className="card border-status-high/20 bg-status-high/5">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-status-high flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h2 className="font-semibold text-text-primary mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-sm text-text-secondary mb-4">
                    {this.state.error?.message ||
                      "An unexpected error occurred. Please try refreshing the page."}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-primary w-full"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
            {typeof import.meta.env.DEV === "boolean" && import.meta.env.DEV && this.state.error && (
              <div className="mt-4 p-4 bg-surface-sunken rounded-lg border border-border-default">
                <p className="text-xs font-mono text-text-tertiary whitespace-pre-wrap break-words">
                  {this.state.error.stack}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
