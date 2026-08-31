import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface PrivacyContextValue {
  hideAmounts: boolean;
  setHideAmounts: (value: boolean) => void;
  toggleHideAmounts: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hideAmounts, setHideAmounts] = useState(true);
  const toggleHideAmounts = useCallback(() => setHideAmounts((current) => !current), []);
  const value = useMemo(() => ({ hideAmounts, setHideAmounts, toggleHideAmounts }), [hideAmounts, toggleHideAmounts]);
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy(): PrivacyContextValue {
  const value = useContext(PrivacyContext);
  if (value === null) throw new Error('usePrivacy doit être utilisé dans PrivacyProvider.');
  return value;
}
