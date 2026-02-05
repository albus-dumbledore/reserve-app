'use client';

import { useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from './storage';

export function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);
  const initialRef = useRef(initialValue);

  useEffect(() => {
    const stored = readJSON<T>(key, initialRef.current);
    setValue(stored);
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    writeJSON(key, value);
  }, [key, value, ready]);

  return { value, setValue, ready };
}
