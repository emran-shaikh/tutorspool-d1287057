import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

const RELOAD_KEY = "chunk-reload-at";

/** True for "the page's code file could not be downloaded" style failures. */
function isLoadFailure(error: unknown): boolean {
  const msg = String((error as Error)?.message ?? error ?? "");
  return (
    /dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Failed to fetch/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Loading (CSS )?chunk/i.test(msg) ||
    /'text\/html' is not a valid JavaScript MIME type/i.test(msg)
  );
}

function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last > 60_000) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      window.location.reload();
      return true;
    }
  } catch {
    /* sessionStorage unavailable */
  }
  return false;
}

class ErrorBoundaryInner extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: String((error as Error)?.message ?? error ?? "") };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("Uncaught error in component tree", error, errorInfo);
    // A stale/failed code chunk (common right after a new version goes live)
    // should silently refresh into the new build instead of showing an error.
    if (isLoadFailure(error)) reloadOnce();
  }

  handleReset = () => {
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
            {this.state.message ? (
              <p className="text-xs text-muted-foreground/80 break-words">{this.state.message}</p>
            ) : null}
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
