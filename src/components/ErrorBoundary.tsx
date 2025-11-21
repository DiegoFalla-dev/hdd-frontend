import React from 'react';

interface State { hasError: boolean; error?: any; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error('ErrorBoundary caught', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Ha ocurrido un error inesperado</h1>
            <p className="text-sm mb-4">Intenta recargar la aplicación.</p>
            <button onClick={()=>window.location.reload()} className="px-4 py-2 bg-red-700 rounded">Recargar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;