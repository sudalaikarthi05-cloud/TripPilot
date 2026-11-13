import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TripPilot caught an error in component boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--color-cream-light, #FAF8F5)',
          fontFamily: 'var(--font-body, system-ui, sans-serif)'
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '3rem 2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1px solid #E2DFD8'
          }}>
            <AlertCircle size={52} color="#C69239" style={{ marginBottom: '1.25rem' }} />
            <h2 style={{
              fontFamily: 'var(--font-heading, Playfair Display, serif)',
              fontSize: '1.8rem',
              color: '#173D32',
              marginBottom: '0.75rem'
            }}>
              Something Unexpected Happened
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: '#5C6B64',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              We encountered a temporary interface issue. Your data is safe. Try refreshing the page or head back to the home page.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={15} /> Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Home size={15} /> Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

