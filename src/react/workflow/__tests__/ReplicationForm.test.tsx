import { Form, FormSection } from '@scality/core-ui';
import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { List } from 'immutable';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { getConfigOverlay } from '../../../js/mock/managementClientMSWHandlers';
import {
  mockBucketListing,
  mockBucketOperations,
} from '../../../js/mock/S3ClientMSWHandlers';
import { PerLocationMap } from '../../../types/config';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import {
  mockOffsetSize,
  reduxRender,
  selectClick,
  TEST_API_BASE_URL,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import ReplicationForm, { GeneralReplicationGroup } from '../ReplicationForm';
import { newExpiration, newReplicationForm, newTransition } from '../utils';
import { debug } from 'jest-preview';

const accountId = 'accountId';
const accountName = 'pat';
const replicationId = 'expirationId';

const bucketName = 'replication-for-chapter-ux';

const server = setupServer(
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/accounts/${accountName}/workflows/${replicationId}`,
    (req, res, ctx) => res(ctx.json([])),
  ),
  mockBucketListing(),
  getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID),
  mockBucketOperations(),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const WithFormProvider = ({ children }) => {
  const formMethods = useForm({
    defaultValues: {
      type: 'replication',
      replication: newReplicationForm(bucketName),
      expiration: newExpiration(bucketName),
      transition: newTransition(bucketName),
    },
  });
  const {
    formState: { isValid },
  } = formMethods;
  const childrenWithProps = React.Children.map(children, (child) => {
    return (
      <>
        <div data-testid="form-replication">
          {isValid ? 'form-valid' : 'form-invalid'}
        </div>
        {child}
      </>
    );
  });
  return <FormProvider {...formMethods}>{childrenWithProps}</FormProvider>;
};
const selectors = {
  bucketSelect: () => screen.getByLabelText(/bucket name \*/i),
  bucketOption: () => screen.getByRole('option', { name: /bucket2/i }),
};
// prettier-ignore
describe('ReplicationForm', () => {
  it('should render a form for replication workflow', async () => {
      const { component } =
        reduxRender(
          <WithFormProvider>
            <Form layout={{ kind: 'tab' }}>
              <FormSection title={{ name: 'General' }}>
                <GeneralReplicationGroup prefix="replication." />
              </FormSection>
              <ReplicationForm
                prefix="replication."
              />
            </Form>
          </WithFormProvider>,
          {
            networkActivity: {
              counter: 0,
              messages: List.of(),
            },
            instances: {
              selectedId: INSTANCE_ID,
            },
            auth: {
              config: { features: [] },
              selectedAccount: { id: accountId },
            },
          }
        );

        await waitForElementToBeRemoved(() => screen.getByText(/Loading locations/i))
      await waitFor(() => screen.getByText(/General/i));
      debug()
      
      expect(screen.getByText(/State/i)).toBeInTheDocument();
      expect(screen.getByText(/Source/i)).toBeInTheDocument();
      expect(screen.getByText(/Bucket Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Filter/i)).toBeInTheDocument();
      expect(screen.getByText(/Prefix/i)).toBeInTheDocument();
      expect(screen.getByText(/Destination/i)).toBeInTheDocument();
      expect(screen.getByText(/Location Name/i)).toBeInTheDocument();

      const formValidationa = screen.getByTestId('form-replication');
      expect(formValidationa.textContent).toBe('form-valid');

      // Select the Source Bucket.
      selectClick(selectors.bucketSelect());
      userEvent.click(selectors.bucketOption());

      // Select the first destination.
      const LocationName = screen.getByTestId('select-location-name-replication-0');
      const lControl = LocationName.querySelector('.sc-select__control')
      const locCtl = notFalsyTypeGuard(lControl);
      selectClick(locCtl);
      expect(locCtl.querySelector('.sc-select__single-value')?.textContent).toBe(undefined);
      const lOption = LocationName.querySelector('.sc-select__option');
      const lOpt = notFalsyTypeGuard(lOption)
      expect(lOpt?.textContent).toBe("chapter-ux (ARTESCA)");
      userEvent.click(lOpt);
      expect(locCtl.querySelector('.sc-select__single-value')?.textContent).toBe('chapter-ux (ARTESCA)');
      const lAddButton = LocationName.querySelector('#addbtn0')
      userEvent.click(notFalsyTypeGuard(lAddButton))
      expect(lAddButton).toBeDisabled()

      // Select the second destination.
      const NewLocationName = screen.getByTestId('select-location-name-replication-1')
      const nlControl = NewLocationName.querySelector('.sc-select__control')
      const nlCtl = notFalsyTypeGuard(nlControl)
      selectClick(nlCtl);

      expect(nlCtl.querySelector('.sc-select__single-value')?.textContent).toBe(undefined);
      const nlOption = NewLocationName.querySelectorAll('.sc-select__option')[1]
      const nlOpt = notFalsyTypeGuard(nlOption)
      expect(nlOpt?.textContent).toBe("ring-nick (RING S3)");
      userEvent.click(nlOpt);
      expect(nlCtl.querySelector('.sc-select__single-value')?.textContent).toBe('ring-nick (RING S3)');
      const nlAddButon = NewLocationName.querySelector('#addbtn1')
      expect(nlAddButon).not.toBeDisabled()

      const formValidation = screen.getByTestId('form-replication');
      expect(formValidation.textContent).toBe('form-valid');
   
  });
});
