import { createContext } from 'react';

export interface ApiStatusContextValue {
  apiCreditsExhausted: boolean;
  setApiCreditsExhausted: (value: boolean) => void;
}

export const ApiStatusContext = createContext<ApiStatusContextValue | null>(null);
