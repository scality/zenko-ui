import { render, screen, waitFor, within } from '@testing-library/react';
import VeeamTable from './VeeamTable';
import {
  NewWrapper,
  TEST_API_BASE_URL,
  mockOffsetSize,
} from '../../utils/testUtil';
import { Stepper } from '@scality/core-ui';
import { actions } from './useMutationTableData';
import { setupServer } from 'msw/node';
import {
  bucketName,
  getVeeamMutationHandler,
} from '../../../js/mutations.test';
import { getConfigOverlay } from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import Configuration from './VeeamConfiguration';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';

const allFailHandlers = [
  rest.get('*', (_, res, ctx) => {
    return res(ctx.status(500), ctx.json({}));
  }),
  rest.post('*', (_, res, ctx) => {
    return res(ctx.status(500), ctx.json({}));
  }),
  rest.put('*', (_, res, ctx) => res(ctx.status(500))),
  rest.patch('*', (_, res, ctx) => res(ctx.status(500))),
  rest.delete('*', (_, res, ctx) => res(ctx.status(500))),
  rest.head('*', (_, res, ctx) => res(ctx.status(500))),
];
const goodHandlers = [
  ...getVeeamMutationHandler(),
  getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID),
];
jest.setTimeout(500_000);
describe('VeeamTable', () => {
  const server = setupServer();
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
    mockOffsetSize(600, 800);
  });
  afterEach(() => {
    // reset the event listen between the tests
    server.events.removeAllListeners();
    server.resetHandlers();
  });
  afterAll(() => server.close());

  const selectors = {
    setBucketName: () => screen.getByLabelText(/Bucket name*/i),
    cancelButton: () => screen.getByRole('button', { name: /Exit/i }),
    continueButton: () => screen.getByRole('button', { name: /Continue/i }),
    veeamConfigActionTable: () =>
      screen.getByText('Configure ARTESCA for Veeam'),
    allRows: () => screen.getAllByRole('row').filter((_, index) => index > 0),
    retryButton: () => screen.getByRole('button', { name: /retry/i }),
  };

  const setupTest = () => {
    render(
      <Stepper
        steps={[
          {
            label: 'Configuration',
            Component: Configuration,
          },
          {
            label: 'Action Status',
            Component: VeeamTable,
          },
        ]}
      />,
      { wrapper: NewWrapper() },
    );
  };

  const expectInitialState = (status: 'Failed' | 'Success') => {
    selectors.allRows().forEach((row, index) => {
      const cells = within(row).getAllByRole('gridcell');
      expect(cells).toHaveLength(3);
      expect(cells[0]).toHaveTextContent(`${index + 1}`);
      expect(cells[1]).toHaveTextContent(actions[index]);

      if (index === 0) {
        try {
          expect(cells[2]).toHaveTextContent(/Pending.../i);
        } catch (error) {
          expect(cells[2]).toHaveTextContent(new RegExp(status, 'i'));
        }
      }
    });
  };

  it('should retry the failed actions', async () => {
    //Setup
    server.use(...allFailHandlers);
    setupTest();
    //Exercise
    userEvent.type(selectors.setBucketName(), bucketName);
    await waitFor(() => {
      expect(selectors.continueButton()).toBeEnabled();
    });
    userEvent.click(selectors.continueButton());

    // Veeam action table
    await waitFor(() => {
      expect(selectors.veeamConfigActionTable()).toBeInTheDocument();
    });

    //Verify
    expectInitialState('Failed');
    server.events.on('response:mocked', ({ status }) => {
      if (status !== 500) {
        server.resetHandlers(...allFailHandlers);
      }
    });

    for (let i = 0; i < actions.length; i++) {
      await waitFor(
        () => {
          expect(
            within(selectors.allRows()[i]).getAllByRole('gridcell')[2],
          ).toHaveTextContent('Failed');
        },
        { timeout: 30_000 },
      );
      //E
      server.resetHandlers(...goodHandlers);

      userEvent.click(selectors.retryButton());
      //V
      await waitFor(
        () => {
          expect(
            within(selectors.allRows()[i]).getAllByRole('gridcell')[2],
          ).toHaveTextContent('Success');
        },
        { timeout: 30_000 },
      );
    }
  });

  it('should render the Veeam table', async () => {
    //Setup
    server.resetHandlers(...goodHandlers);
    setupTest();
    //Exercise
    //type the bucket name in configuration form
    userEvent.type(selectors.setBucketName(), bucketName);
    await waitFor(() => {
      expect(selectors.continueButton()).toBeEnabled();
    });
    userEvent.click(selectors.continueButton());

    //V
    // Veeam action table
    await waitFor(() => {
      expect(selectors.veeamConfigActionTable()).toBeInTheDocument();
    });

    expectInitialState('Success');
    expect(selectors.allRows()).toHaveLength(actions.length);
    expect(selectors.cancelButton()).toBeDisabled();
    expect(selectors.continueButton()).toBeDisabled();

    // wait for all the actions to be completed
    for (let i = 0; i < actions.length; i++) {
      await waitFor(() => {
        expect(
          within(selectors.allRows()[i]).getAllByRole('gridcell')[2],
        ).toHaveTextContent('Success');
      });
    }
  });
});
