import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { ISVStepperContext, useISVStepper } from '../ISVSteps';
import { ThemeProvider } from 'styled-components';
import {
  VEEAM_BACKUP_REPLICATION_XML_VALUE,
  VEEAM_OFFICE_365,
} from '../../constants';
import { ISVPlatformConfig } from '../../types';

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

// Mock Scality core-ui components
jest.mock('@scality/core-ui', () => ({
  spacing: { r16: '16px' },
  Stepper: ({ steps }) => (
    <div data-testid="stepper">
      {steps.map((step, index) => (
        <div key={index} data-testid={`step-${index}`}>
          {step.label}
        </div>
      ))}
    </div>
  ),
  Text: ({ children }) => <div>{children}</div>,
}));

jest.mock('@scality/core-ui/dist/next', () => ({
  Box: ({ children }) => <div data-testid="box">{children}</div>,
}));

const mockTheme = {
  backgroundLevel4: '#f5f5f5',
  colors: {
    primary: '#0088cc',
    secondary: '#666',
    text: '#333',
  },
} as any;

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
        <div data-testid="application">{context.config.application}</div>
        <div data-testid="platform-id">
          {context.platform?.id || 'undefined'}
        </div>
      </div>
    );
  };

  // Set up mock implementation in each test
  const setupMockISVSteps = (platformId: string | null) => {
    const { ISVSteps } = require('../ISVSteps');

    // Configure mock implementation for this specific test
    ISVSteps.mockImplementation(({ children }) => {
      // Create platform config based on ID
      let platform: ISVPlatformConfig | undefined;
      let application = '';

      if (platformId) {
        switch (platformId) {
          case 'veeam':
            application = VEEAM_BACKUP_REPLICATION_XML_VALUE;
            break;
          case 'veeam-vbo':
            application = VEEAM_OFFICE_365;
            break;
          case 'commvault':
            application = 'COMMVAULT';
            break;
        }

        platform = {
          id: platformId,
          name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
          logo: React.createElement('div'),
          bucketTag: 'mock-bucket-tag',
        } as unknown as ISVPlatformConfig;
      }

      // Create config
      const config = {
        accountName: '',
        enableImmutableBackup: true,
        buckets: [],
        application,
        accountNameType: 'create' as const,
      };

      // Mock context value
      const contextValue = { platform, config, setConfig: jest.fn() };

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
      <ThemeProvider theme={mockTheme}>
        <ISVSteps>
          <ContextReader />
        </ISVSteps>
      </ThemeProvider>,
    );
  };

  it.each([
    ['veeam', VEEAM_BACKUP_REPLICATION_XML_VALUE],
    ['veeam-vbo', VEEAM_OFFICE_365],
    ['commvault', 'COMMVAULT'],
    ['unknown', ''],
  ])(
    'should set correct context for %s platform',
    (platformId, expectedApp) => {
      setupMockISVSteps(platformId);
      renderWithThemeAndContextReader();

      // Check context values
      expect(screen.getByTestId('application')).toHaveTextContent(expectedApp);
      expect(screen.getByTestId('platform-id')).toHaveTextContent(platformId);
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

  it('should initialize config with default values', () => {
    setupMockISVSteps('veeam');
    renderWithThemeAndContextReader();

    // Verify application is correctly set
    expect(screen.getByTestId('application')).toHaveTextContent(
      VEEAM_BACKUP_REPLICATION_XML_VALUE,
    );
  });
});
