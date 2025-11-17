'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: any) {
    // Ignore browser extension errors (Firefox MetaMask, Chrome extensions, etc.)
    if (
      error.message?.includes('moz-extension://') || 
      error.message?.includes('chrome-extension://') ||
      error.message?.includes('has not been authorized yet') ||
      error.stack?.includes('moz-extension://') ||
      error.stack?.includes('chrome-extension://')
    ) {
      console.warn('🦊 Browser extension error (safely ignored):', error.message);
      this.setState({ hasError: false });
      return;
    }
    
    console.error('❌ Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Don't show error UI for extension issues
      if (
        this.state.error.message?.includes('extension://') ||
        this.state.error.message?.includes('has not been authorized')
      ) {
        return this.props.children;
      }

      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
