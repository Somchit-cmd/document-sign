'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage =
        this.state.error?.message || 'An unexpected error occurred';

      return (
        <div className="flex items-center justify-center p-6 min-h-[200px]">
          <Card className="w-full max-w-md border-emerald-200 dark:border-emerald-800 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base text-emerald-800 dark:text-emerald-300">
                    Something went wrong
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    This component encountered an error and couldn&apos;t render properly.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>

              <Collapsible
                open={this.state.showDetails}
                onOpenChange={(open) => this.setState({ showDetails: open })}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span>Error details</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        this.state.showDetails ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-2 p-3 rounded-md bg-muted text-[11px] text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap break-words">
                    {this.state.error?.stack || errorMessage}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </CollapsibleContent>
              </Collapsible>

              <Button
                onClick={this.handleReset}
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
