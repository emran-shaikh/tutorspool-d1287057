import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundaryInner extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // Log error for debugging; could be sent to monitoring service
    console.error("Uncaught error in component tree", error, errorInfo);
  }

  handleReset = () => {
    // Simple reset: reload the page state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-background border border-border rounded-lg p-6 shadow-sm text-center space-y-4">
            <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred while loading this page. You can refresh or go back to the homepage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                Refresh page
              </Button>
              <Button asChild>
                <Link to="/">Go to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundaryInner>{children}</ErrorBoundaryInner>;
}
