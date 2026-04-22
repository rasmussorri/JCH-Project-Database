import { useState, useCallback } from 'react';
import { ApiStatusContext } from './ApiStatusContextDef';

export function ApiStatusProvider({ children }: { children: React.ReactNode }) {
  const [apiCreditsExhausted, setApiCreditsExhausted] = useState(false);
  return (
    <ApiStatusContext.Provider
      value={{
        apiCreditsExhausted,
        setApiCreditsExhausted: useCallback((value: boolean) => setApiCreditsExhausted(value), []),
      }}
    >
      {children}
    </ApiStatusContext.Provider>
  );
}
