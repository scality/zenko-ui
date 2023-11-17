import BucketCreate, { bucketErrorMessage } from '../BucketCreate';
import {
  TEST_API_BASE_URL,
  renderWithRouterMatch,
  selectClick,
} from '../../../utils/testUtil';
import { XDM_FEATURE } from '../../../../js/config';
import {
  screen,
  act,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LOCATIONS,
  getConfigOverlay,
} from '../../../../js/mock/managementClientMSWHandlers';
import { setupServer } from 'msw/node';
import { INSTANCE_ID } from '../../../actions/__tests__/utils/testUtil';
import { debug } from 'jest-preview';

const server = setupServer(getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID));

describe('BucketCreate', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const errorMessage = 'This is an error test message';
  const selectors = {
    objectlock: () => screen.getByLabelText(/object-lock/i),
    versioning: () => screen.getByLabelText(/versioning/i),
    asyncMetadata: () => screen.getByLabelText(/async metadata updates/i),
    locationSelect: () => screen.getByLabelText(/Storage Service Location/i),
    ringLocationOption: () =>
      screen.getByRole('option', { name: /ring-nick/i }),
  };
  it('should render BucketCreate component with an error banner', () => {
    renderWithRouterMatch(
      <BucketCreate />,
      {
        route: '/accounts/my-account/create-bucket',
        path: '/accounts/:accountName/create-bucket',
      },
      {
        uiErrors: {
          errorMsg: errorMessage,
          errorType: 'byComponent',
        },
      },
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
  // TESTING INPUT NAME:
  // 1) empty name input
  // 2) name input < 3 characters
  // 3) name input > 63 characters
  const tests = [
    {
      description:
        'should render an input form error when submitting with an empty name',
      testValue: '',
      expectedEmptyNameError: '"Bucket Name" is not allowed to be empty',
      expectedMinLengthNameError: null,
      expectedMaxLengthNameError: null,
      expectedPAtternNameError: null,
    },
    {
      description:
        'should render an input form error when submitting with a name.length < 3',
      testValue: 'ab',
      expectedEmptyNameError: null,
      expectedMinLengthNameError:
        '"Bucket Name" length must be at least 3 characters long',
      expectedMaxLengthNameError: null,
      expectedPAtternNameError: null,
    },
    {
      description:
        'should render an input form error when submitting with a name.length > 63',
      testValue:
        'z4vbhlmekc0a8n85fenehn6ehbwfskmsh4tgoky53ktdmqlwq5xjvi7hm32jfukb',
      expectedEmptyNameError: null,
      expectedMinLengthNameError: null,
      expectedPAtternNameError: null,
      expectedMaxLengthNameError:
        '"Bucket Name" length must be less than or equal to 63 characters long',
    },
    {
      description:
        'should render an input form error when submitting with a name with uppercase letters',
      testValue: 'dozA',
      expectedEmptyNameError: null,
      expectedMinLengthNameError: null,
      expectedPAtternNameError: bucketErrorMessage
        .replaceAll(/\(/g, '\\(')
        .replaceAll(/\)/g, '\\)'),
      expectedMaxLengthNameError: null,
    },
    {
      description:
        'should render an input form error when submitting with a name with special characters',
      testValue: 'doz_',
      expectedEmptyNameError: null,
      expectedMinLengthNameError: null,
      expectedPAtternNameError: bucketErrorMessage
        .replaceAll(/\(/g, '\\(')
        .replaceAll(/\)/g, '\\)'),
      expectedMaxLengthNameError: null,
    },
  ];
  tests.forEach((t) => {
    it(t.description, async () => {
      renderWithRouterMatch(<BucketCreate />, {
        route: '/accounts/my-account/create-bucket',
        path: '/accounts/:accountName/create-bucket',
      });

      await waitForElementToBeRemoved(() =>
        screen.getByText(/Loading locations/i),
      );

      // NOTE: All validation methods in React Hook Form are treated
      // as async functions, so it's important to wrap async around your act.
      await act(async () => {
        userEvent.type(
          screen.getByRole('textbox', { name: /bucket name */i }),
          `${t.testValue}`,
        );
        await userEvent.tab();
      });

      if (t.expectedEmptyNameError !== null) {
        await act(async () => {
          userEvent.type(
            screen.getByRole('textbox', { name: /bucket name */i }),
            `toberemoved`,
          );
          userEvent.clear(
            screen.getByRole('textbox', { name: /bucket name */i }),
          );
        });

        selectClick(selectors.locationSelect());
        expect(
          screen.getByText(new RegExp(`.*${t.expectedEmptyNameError}.*`, 'i')),
        ).toBeInTheDocument();
      } else if (t.expectedMinLengthNameError !== null) {
        expect(
          screen.getByText(
            new RegExp(`.*${t.expectedMinLengthNameError}.*`, 'i'),
          ),
        ).toBeInTheDocument();
      } else if (t.expectedMaxLengthNameError !== null) {
        expect(
          screen.getByText(
            new RegExp(`.*${t.expectedMaxLengthNameError}.*`, 'i'),
          ),
        ).toBeInTheDocument();
      } else if (t.expectedPAtternNameError !== null) {
        expect(
          screen.getByText(
            new RegExp(`.*${t.expectedPAtternNameError}.*`, 'i'),
          ),
        ).toBeInTheDocument();
      }
    });
  });
  it('should set versioning and disable it while enabling object lock', () => {
    //S
    renderWithRouterMatch(<BucketCreate />, {
      route: '/accounts/my-account/create-bucket',
      path: '/accounts/:accountName/create-bucket',
    });
    //E
    userEvent.click(selectors.objectlock());
    //V
    expect(selectors.versioning()).toBeChecked();
    expect(selectors.versioning()).toBeDisabled();
  });
  it('should set versioning and disable it while enabling Async Metadata updates for RING', async () => {
    //S
    renderWithRouterMatch(
      <BucketCreate />,
      {
        route: '/accounts/my-account/create-bucket',
        path: '/accounts/:accountName/create-bucket',
      },
      {
        configuration: { latest: { locations: LOCATIONS } },
        auth: { config: { features: [XDM_FEATURE] } },
        instanceStatus: {
          latest: { state: { capabilities: { s3cIngestLocation: true } } },
        },
      },
    );
    await waitForElementToBeRemoved(() =>
      screen.getByText(/Loading locations/i),
    );
    //E
    selectClick(selectors.locationSelect());
    userEvent.click(selectors.ringLocationOption());
    userEvent.click(selectors.asyncMetadata());
    //V
    await waitFor(() => expect(selectors.versioning()).toBeChecked());
    expect(selectors.versioning()).toBeDisabled();
  });
  it('should disable cold location as a source storage location while creating a bucket', async () => {
    const coldLocation = 'europe25-myroom-cold';
    //S
    renderWithRouterMatch(
      <BucketCreate />,
      {
        route: '/accounts/my-account/create-bucket',
        path: '/accounts/:accountName/create-bucket',
      },
      {
        configuration: {
          latest: {
            locations: {
              [coldLocation]: {
                locationType: 'location-dmf-v1',
                name: coldLocation,
                isCold: true,
                details: {
                  endpoint: 'ws://tape.myroom.europe25.cnes:8181',
                  repoId: ['repoId'],
                  nsId: 'nsId',
                  username: 'username',
                  password: 'password',
                },
              },
            },
          },
        },
      },
    );
    await waitForElementToBeRemoved(() =>
      screen.getByText(/Loading locations/i),
    );
    //E
    selectClick(selectors.locationSelect());
    //V
    expect(
      screen.queryByRole('option', { name: new RegExp(coldLocation, 'i') }),
    ).toHaveAttribute('aria-disabled', 'true');
  });
  it('should disable versioning for Microsoft Azure Blob Storage', async () => {
    //S
    const azureblobstorage = 'azureblobstorage';
    renderWithRouterMatch(
      <BucketCreate />,
      {
        route: '/accounts/my-account/create-bucket',
        path: '/accounts/:accountName/create-bucket',
      },
      {
        configuration: {
          latest: {
            locations: {
              [azureblobstorage]: {
                locationType: 'location-azure-v1',
                name: azureblobstorage,
                details: {},
              },
            },
          },
        },
      },
    );
    await waitForElementToBeRemoved(() =>
      screen.getByText(/Loading locations/i),
    );
    //E
    selectClick(selectors.locationSelect());
    userEvent.click(
      screen.getByRole('option', { name: new RegExp(azureblobstorage, 'i') }),
    );
    //V
    expect(screen.getByLabelText('Versioning')).toBeDisabled();
    //E
    userEvent.click(screen.getByLabelText('Object-lock'));
    //Verify the versioning is off even though set object-lock for Azure Blob Storage
    expect(screen.getByLabelText('Versioning')).toBeDisabled();
    expect(screen.getByLabelText('Versioning')).not.toBeChecked();
  });
  it('should be able to remove object-lock after setting it', () => {
    //S
    renderWithRouterMatch(<BucketCreate />, {
      route: '/accounts/my-account/create-bucket',
      path: '/accounts/:accountName/create-bucket',
    });
    //E
    userEvent.click(selectors.objectlock());
    //V
    expect(selectors.objectlock()).toBeChecked();
    expect(selectors.objectlock()).toBeEnabled();
    //E
    userEvent.click(selectors.objectlock());
    //V
    expect(selectors.objectlock()).not.toBeChecked();
    expect(selectors.objectlock()).toBeEnabled();
  });
});
