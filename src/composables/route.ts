// Simple route management for testing in WebContainer
let currentPath = '/'
const listeners = new Set<(path: string) => void>()

export function useRoute() {
  return {
    getPath: () => currentPath,
    setPath: (path: string) => {
      currentPath = path
      listeners.forEach(listener => listener(path))
      
      // Update URL if possible (for non-WebContainer environments)
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', path)
      }
    },
    onChange: (callback: (path: string) => void) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    }
  }
}