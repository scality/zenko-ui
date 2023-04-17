import { ErrorPage500, Loader } from '@scality/core-ui';
import { createContext, useContext } from 'react';
import { useQuery } from 'react-query';
import { getAppConfig } from '../../../js/config';
import { AppConfig } from '../../../types/entities';

const _ConfigContext = createContext<AppConfig | null>(null);

export const useConfig = (): AppConfig => {
  const context = useContext(_ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: config, status } = useQuery('config', getAppConfig, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (status === 'idle' || status === 'loading') {
    return <Loader />;
  }

  if (status === 'error') {
    return <ErrorPage500 locale="en" />;
  }

  return (
    <_ConfigContext.Provider value={config}>{children}</_ConfigContext.Provider>
  );
};
