import React from 'react';

/**
 * Wraps React.lazy with automatic page reload on chunk load failure.
 *
 * After a new deployment, old chunk files no longer exist on the server.
 * The SPA catch-all rewrite serves index.html instead, causing a MIME type error.
 * This wrapper catches that error and reloads the page once to fetch the
 * new index.html with updated chunk references.
 *
 * Uses sessionStorage to prevent infinite reload loops.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().catch((error: Error) => {
      // Only attempt reload once per session to avoid infinite loops
      const hasReloaded = sessionStorage.getItem('chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
        // Return a never-resolving promise so the reload completes
        return new Promise<never>(() => {});
      }
      // Already reloaded once — clear the flag and throw
      sessionStorage.removeItem('chunk_reload');
      throw error;
    })
  );
}
