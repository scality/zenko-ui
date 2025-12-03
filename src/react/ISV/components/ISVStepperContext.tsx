import { createContext, useContext } from 'react';
import { ISVPlatformConfig } from '../types';

export type ISVStepperContextType = {
  platform: ISVPlatformConfig;
};

export const ISVStepperContext = createContext<
  ISVStepperContextType | undefined
>(undefined);

export const useISVStepper = () => {
  const context = useContext(ISVStepperContext);
  if (!context) {
    throw new Error('useISVStepper must be used within ISVStepperProvider');
  }
  return context;
};

