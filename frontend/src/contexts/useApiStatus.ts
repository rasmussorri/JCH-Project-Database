import { useContext } from 'react';
import { ApiStatusContext } from './ApiStatusContextDef';

export function useApiStatus() {
  const ctx = useContext(ApiStatusContext);
  if (!ctx) return null;
  return ctx;
}
