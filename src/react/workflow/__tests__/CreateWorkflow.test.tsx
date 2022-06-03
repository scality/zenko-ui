import CreateWorkflow from '../CreateWorkflow';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../utils/test';
import {
  screen,
  waitFor,
} from '@testing-library/react';
import { List } from 'immutable';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { notFalsyTypeGuard } from '../../../types/typeGuards';

const instanceId = 'instanceId';
const accountId = 'accountId';
const accountName = 'pat';

const server = setupServer(rest.post(
  `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/accounts/${accountName}/workflows/create-workflow`,
  (req, res, ctx) => res(ctx.json([])),
),);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CreateWorkflow', () => {
  it('should render a form for create workflow', async () => {
    try {
      const { component: { container } }  = reduxRender(<CreateWorkflow />, {
        networkActivity: {
          counter: 0,
          messages: List.of(),
        },
        instances: {
          selectedId: instanceId,
        },
        auth: {
          config: { features: [] },
          selectedAccount: { id: accountId },
        },
        oidc: {
          user: {
            access_token: ''
          }
        },
        configuration: {
          latest: {
            endpoints: [],
          },
        },
      });

      await waitFor(() => screen.getByText(/Create New Workflow/i));

      expect(screen.getByText('Type')).toBeInTheDocument();

      const createButton = screen.getByText('Create');
      expect(createButton).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();

      expect(container.getElementsByClassName('sc-select__option').length).toBe(0);
      const form = notFalsyTypeGuard(container.querySelector('form'));

      userEvent.click(notFalsyTypeGuard(form.querySelector('.sc-select__control')));

      expect(container.getElementsByClassName('sc-select__option').length).toBe(3);
      const replicationOption = screen.getByRole('option', { name: 'Replication' });
      const ExpirationOption = screen.getByRole('option', { name: 'Expiration' });
      const TransitionOption = screen.getByRole('option', { name: 'Transition' });

      expect(replicationOption).toBeInTheDocument();
      expect(ExpirationOption).toBeInTheDocument();
      expect(TransitionOption).toBeInTheDocument();

      userEvent.click(notFalsyTypeGuard(ExpirationOption));
      expect(screen.getByText('Expiration')).toBeInTheDocument();

      userEvent.click(notFalsyTypeGuard(form.querySelector('.sc-select__control')));
      expect(screen.getByText('Replication')).toBeInTheDocument();

      expect(createButton).not.toBeDisabled();

    } catch (e) {
      console.log('should render a form for create workflow: ', e);
      throw e;
    }
  });

});
