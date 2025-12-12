import React from 'react';

interface State { 
  hasError: boolean; 
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: any) { 
    super(props); 
    this.state = { hasError: false }; 
  }
  
  static getDerivedStateFromError(error: Error): State { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { 
    console.error('🔴 ErrorBoundary caught:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Log a sistema de monitoreo (ej: Sentry)
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack }}});
    
    this.setState({ error, errorInfo });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4">⚠️ Ha ocurrido un error</h1>
            <p className="text-sm text-gray-400 mb-6">
              Lo sentimos, algo salió mal. Por favor recarga la página o intenta más tarde.
            </p>
            {/* Comentado: process.env no está disponible sin tipos de Node
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-gray-900 p-4 rounded mb-4 text-xs">
                <summary className="cursor-pointer font-semibold mb-2">Detalles del error (dev)</summary>
                <pre className="overflow-auto">{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre className="overflow-auto mt-2 text-gray-500">{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            */}
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;