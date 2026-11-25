import { Component } from "react";

/**
 * Si una pantalla falla al dibujarse, muestra un aviso con opción de recargar en lugar de
 * dejar la página en blanco (y deja el error en la consola para depurarlo).
 */
export default class ErrorPantalla extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error en la pantalla:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-fondo flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-w-md w-full text-center space-y-3">
          <p className="text-sm font-bold text-gray-900">Algo salió mal al mostrar esta pantalla</p>
          <p className="text-xs text-gray-500">{String(this.state.error?.message || this.state.error)}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-guinda hover:bg-guindaDark text-white text-xs font-bold px-4 py-2.5 rounded-xl"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
