import { Component, type ErrorInfo, type ReactNode } from 'react'

/** Renders `fallback` instead of crashing the tree when a child throws while rendering -- or
 * when a lazy() import fails to load. Used around the optional 3D preview, where a device
 * without WebGL or a failed asset download must degrade to the still image, not a blank form. */
export class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
