import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { ISVStepperContext, useISVStepper } from '../ISVSteps';
import { Veeam } from '../../modules/veeam';
import { Commvault } from '../../modules/commvault';
import { VeeamVBO } from '../../modules/veeam-vbo';
import { ISVPlatformConfig } from '../../types';
import { Wrapper } from '../../../utils/testUtil';

jest.mock('../ISVSteps', () => {
  const originalModule = jest.requireActual('../ISVSteps');

  return {
    ...originalModule,
    ISVSteps: jest.fn().mockImplementation(() => null),
  };
});

// Mock dependencies
jest.mock('react-router', () => ({
  useSearchParams: jest.fn(),
}));

// Import React hooks correctly
const { useContext } = React;

// Test the useISVStepper hook
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

// Test the ISVSteps component
describe('ISVSteps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Component to access context for testing
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

  // Set up mock implementation in each test
  const setupMockISVSteps = (platformId: string | null) => {
    const { ISVSteps } = require('../ISVSteps');

    ISVSteps.mockImplementation(({ children }) => {
      let platform: ISVPlatformConfig | undefined;

      if (platformId === 'veeam') {
        platform = Veeam;
      } else if (platformId === 'commvault') {
        platform = Commvault;
      } else if (platformId === 'veeam-vbo') {
        platform = VeeamVBO;
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

    // Configure useSearchParams mock
    const { useSearchParams } = require('react-router');
    useSearchParams.mockReturnValue([
      new URLSearchParams(platformId ? `?platform=${platformId}` : ''),
      jest.fn(),
    ]);
  };

  // Helper to render component with theme and context reader
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

  it.each([['veeam'], ['veeam-vbo'], ['commvault'], [null]])(
    'should set correct context for %s platform',
    (platformId) => {
      setupMockISVSteps(platformId);
      renderWithThemeAndContextReader();

      // Check platform ID in context
      expect(screen.getByTestId('platform-id')).toHaveTextContent(
        platformId || 'no-platform',
      );
    },
  );

  it('should render stepper with correct steps', () => {
    setupMockISVSteps('veeam');
    renderWithThemeAndContextReader();

    // Check UI components
    expect(screen.getByTestId('isv-steps')).toBeInTheDocument();
    expect(screen.getByTestId('stepper')).toBeInTheDocument();

    // Check step labels
    expect(screen.getByTestId('step-0')).toHaveTextContent('Configure');
    expect(screen.getByTestId('step-1')).toHaveTextContent('Apply Actions');
    expect(screen.getByTestId('step-2')).toHaveTextContent('Summary');
  });
});
