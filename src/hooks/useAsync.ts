import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

type State<T> = { data: T | null; error: string | null; loading: boolean; refreshing: boolean };

/**
 * Carga datos al enfocar la pantalla (también al volver a ella) y cuando cambian `deps`.
 * `refresh()` sirve para "deslizar para actualizar".
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true, refreshing: false });
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });
  const key = JSON.stringify(deps);

  const run = useCallback(async (mode: 'load' | 'refresh') => {
    setState((s) => ({ ...s, loading: mode === 'load' && s.data === null, refreshing: mode === 'refresh', error: null }));
    try {
      const data = await loaderRef.current();
      setState({ data, error: null, loading: false, refreshing: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos cargar la información.';
      setState((s) => ({ ...s, error: message, loading: false, refreshing: false }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      run('load');
      // `key` resume `deps`: al cambiar, la pantalla vuelve a cargar.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, key]),
  );

  return { ...state, reload: () => run('load'), refresh: () => run('refresh') };
}
