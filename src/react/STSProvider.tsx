import { createContext, type JSX, useContext, useMemo } from 'react';
import STSClient from '../js/STSClient';
import { useConfig } from './next-architecture/ui/ConfigProvider';

type STSContextValue = {
  stsClient: STSClient | null;
};

const STSContext = createContext<STSContextValue | null>(null);

export const useStsClient = () => {
  const context = useContext(STSContext);

  if (!context) {
    throw new Error('The useStsClient hook can only be used within STSProvider.');
  }

  return context.stsClient;
};

const STSProvider = ({ children }: { children: JSX.Element }) => {
  const { stsEndpoint } = useConfig();

  const stsClient = useMemo(() => {
    if (stsEndpoint) {
      return new STSClient({ endpoint: stsEndpoint });
    }
    return null;
  }, [stsEndpoint]);

  return <STSContext.Provider value={{ stsClient }}>{children}</STSContext.Provider>;
};

export default STSProvider;
