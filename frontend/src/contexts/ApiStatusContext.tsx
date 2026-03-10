import { createContext, useContext, useState, useCallback } from 'react';

interface ApiStatusContextValue {
  apiCreditsExhausted: boolean;
  setApiCreditsExhausted: (value: boolean) => void;
}

const ApiStatusContext = createContext<ApiStatusContextValue | null>(null);

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

export function useApiStatus() {
  const ctx = useContext(ApiStatusContext);
  if (!ctx) return null;
  return ctx;
}
