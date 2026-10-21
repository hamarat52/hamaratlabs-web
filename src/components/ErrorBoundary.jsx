import { Component } from 'react';

// Yalnızca sardığı alt ağacı korur: içerideki bir render/effect hatası ya da lazy chunk'ın
// yüklenememesi (ağ hatası) sayfanın geri kalanını düşürmez; yerine `fallback` gösterilir.
// Hook karşılığı olmadığı için class bileşen (React error boundary yalnız class ile yazılır).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Sessizce yutma: hata konsolda görünür kalsın, ama ağaç ayakta kalsın.
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      const { fallback = null } = this.props;
      return typeof fallback === 'function' ? fallback(this.state.error) : fallback;
    }
    return this.props.children;
  }
}
