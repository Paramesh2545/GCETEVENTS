import { useState, useEffect, useCallback } from 'react';

interface UseLazyDataOptions {
  enabled?: boolean;
  delay?: number;
}

export function useLazyData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseLazyDataOptions = {}
) {
  const { enabled = true, delay = 0 } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, enabled]);

  useEffect(() => {
    if (enabled) {
      if (delay > 0) {
        const timer = setTimeout(fetchData, delay);
        return () => clearTimeout(timer);
      } else {
        fetchData();
      }
    }
  }, [...dependencies, enabled, delay, fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useLazyDataOnDemand<T>(
  fetchFn: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  return { data, isLoading, error, fetchData };
}
