import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { ISVStepperContext, useISVStepper } from '../ISVSteps';
import { VeeamVBRPlatform } from '../../platforms/veeam-vbr';
import { CommvaultPlatform } from '../../platforms/commvault';
import { VeeamVBOPlatform } from '../../platforms/veeam-vbo';
import { ISVPlatform } from '../../engine/types';
import { Wrapper } from '../../../utils/testUtil';

jest.mock('../ISVSteps', () => {
  const originalModule = jest.requireActual('../ISVSteps');

  return {
    ...originalModule,
    ISVSteps: jest.fn().mockImplementation(() => null),
  };
});

jest.mock('react-router', () => ({
  useSearchParams: jest.fn(),
}));

const { useContext } = React;

describe('useISVStepper', () => {
  it('should throw an error when used outside of the Provider', () => {
    const TestComponent = () => {
      useISVStepper();
      return null;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useISVStepper must be used within ISVStepperProvider',
    );
  });
});

describe('ISVSteps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const ContextReader = () => {
    const context = useContext(ISVStepperContext);
    if (!context) return null;

    return (
      <div>
        <div data-testid="platform-id">
          {context.platform?.id || 'no-platform'}
        </div>
      </div>
    );
  };

  const setupMockISVSteps = (platformId: string | null) => {
    const { ISVSteps } = require('../ISVSteps');

    ISVSteps.mockImplementation(({ children }) => {
      let platform: ISVPlatform | undefined;

      if (platformId === 'veeam-vbr') {
        platform = VeeamVBRPlatform;
      } else if (platformId === 'commvault') {
        platform = CommvaultPlatform;
      } else if (platformId === 'veeam-vbo') {
        platform = VeeamVBOPlatform;
      }

      const contextValue = { platform };

      return (
        <ISVStepperContext.Provider value={contextValue}>
          <div data-testid="isv-steps">
            <div data-testid="stepper">
              <div data-testid="step-0">Configure</div>
              <div data-testid="step-1">Apply Actions</div>
              <div data-testid="step-2">Summary</div>
            </div>
          </div>
          {children}
        </ISVStepperContext.Provider>
      );
    });

    const { useSearchParams } = require('react-router');
    useSearchParams.mockReturnValue([
      new URLSearchParams(platformId ? `?platform=${platformId}` : ''),
      jest.fn(),
    ]);
  };

  const renderWithThemeAndContextReader = () => {
    const { ISVSteps } = require('../ISVSteps');

    return render(
      <Wrapper>
        <ISVSteps>
          <ContextReader />
        </ISVSteps>
      </Wrapper>,
    );
  };

  it.each([['veeam-vbr'], ['veeam-vbo'], ['commvault'], [null]])(
    'should set correct context for %s platform',
    (platformId) => {
      setupMockISVSteps(platformId);
      renderWithThemeAndContextReader();

      expect(screen.getByTestId('platform-id')).toHaveTextContent(
        platformId || 'no-platform',
      );
    },
  );

  it('should render stepper with correct steps', () => {
    setupMockISVSteps('veeam-vbr');
    renderWithThemeAndContextReader();

    expect(screen.getByTestId('isv-steps')).toBeInTheDocument();
    expect(screen.getByTestId('stepper')).toBeInTheDocument();

    expect(screen.getByTestId('step-0')).toHaveTextContent('Configure');
    expect(screen.getByTestId('step-1')).toHaveTextContent('Apply Actions');
    expect(screen.getByTestId('step-2')).toHaveTextContent('Summary');
  });
});
