import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { debugError } from "@/lib/debugLogger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Lightweight error boundary for individual CollapsibleSections.
 * Shows a compact inline error with retry — other sections remain functional.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    debugError("[SectionErrorBoundary] Caught error:", error);
    debugError("[SectionErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-destructive/30 bg-destructive/5 rounded-sm p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-xs font-terminal text-destructive tracking-wider">
              &gt; SECTION_LOAD_ERROR
            </p>
            {import.meta.env.DEV && this.state.error && (
              <p className="text-xs font-mono text-destructive/70 break-all">
                {this.state.error.message}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="font-mono text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
