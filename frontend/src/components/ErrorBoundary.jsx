import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
          <div className="bg-[#111118] border border-red-500/30 rounded-2xl p-12 max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-gray-400 mt-2 text-sm">
              {this.state.error?.message || 'Please refresh the page'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl hover:scale-105 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}