// Simple route management for testing in WebContainer
let currentPath = '/'
const listeners = new Set<(path: string) => void>()

export function useRoute() {
  function getPath() {
      return window.location.pathname;
  }

  function setPath(path: string) {
      window.history.pushState({}, "", path);
  }

  function onChange(callback: (path: string) => void) {
      window.addEventListener("popstate", () => {
          callback(getPath());
      });
  }

  return {
      getPath,
      setPath,
      onChange,
  };
}