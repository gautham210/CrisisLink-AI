// ============================================================
// useTrafficNetwork.js — Custom Hook (v4)
// - Uses global singleton cache (one fetch per session)
// - isFirstLoad captured with useRef so hook count never changes
// - Subsequent mounts return instantly with no loading state
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { getNetworkRoutes, getCachedRoutes, hasNetworkEverLoaded } from '../utils/networkCache';

export default function useTrafficNetwork() {
  // Capture "was this the first load?" at mount time using a ref
  // so it's stable and doesn't affect Hook ordering.
  const isFirstLoadRef = useRef(!hasNetworkEverLoaded());

  const startReady = hasNetworkEverLoaded();

  // Always initialise as array — getCachedRoutes() returns null before first fetch
  const [networkRoutes, setNetworkRoutes] = useState(() => {
    const cached = getCachedRoutes();
    return Array.isArray(cached) ? cached : [];
  });
  const [isLoading, setIsLoading]         = useState(!startReady);
  const [loadingPhase, setLoadingPhase]   = useState('Initializing city traffic system...');
  const [progress, setProgress]           = useState({ done: 0, total: 0 });

  useEffect(() => {
    // Already fully loaded — restore from cache, skip fetch entirely
    if (hasNetworkEverLoaded()) {
      const cached = getCachedRoutes();
      if (cached?.length) setNetworkRoutes(cached);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const run = async () => {
      setIsLoading(true);
      setLoadingPhase('Initializing city traffic system...');

      const routes = await getNetworkRoutes(
        undefined,
        (done, total) => {
          if (!isMounted) return;
          setProgress({ done, total });
          setLoadingPhase(`Mapping road network... (${done}/${total})`);
        }
      );

      if (isMounted) {
        setNetworkRoutes(routes);
        setIsLoading(false);
        setLoadingPhase('');
      }
    };

    run();

    return () => { isMounted = false; };
  }, []);

  // Expose as plain boolean — stable value, does not trigger re-renders
  return {
    networkRoutes,
    isLoading,
    isFirstLoad: isFirstLoadRef.current,
    loadingPhase,
    progress
  };
}
