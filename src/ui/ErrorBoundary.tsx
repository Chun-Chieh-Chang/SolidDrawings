'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches JavaScript errors in child component trees,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
          <div className="max-w-md w-full mx-4 p-6 bg-white rounded-xl shadow-2xl border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              An unexpected error occurred. The application has been paused to prevent further issues.
            </p>

            {this.state.error && (
              <details className="mb-4 text-xs">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                  Error Details
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded-lg overflow-auto max-h-40 text-gray-700">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Reload App
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Error: ${this.state.error?.toString()}\nStack: ${this.state.error?.stack}`
                  );
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Copy Error
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
