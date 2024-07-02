import { Form, FormSection } from '@scality/core-ui';
import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
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
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import {
  mockOffsetSize,
  reduxRender,
  renderWithRouterMatch,
  selectClick,
  TEST_API_BASE_URL,
} from '../../utils/testUtil';
import ReplicationForm, { GeneralReplicationGroup } from '../ReplicationForm';
import { newExpiration, newReplicationForm, newTransition } from '../utils';
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
  mockBucketOperations({
    isVersioningEnabled: true,
    isVeeamTagged: (bucketName) => (bucketName === 'bucket2' ? true : false),
  }),
);

jest.setTimeout(20_000);
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
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
  bucketOption1: () => screen.getByRole('option', { name: /bucket1/i }),
  bucketOption2: () => screen.getByRole('option', { name: /bucket2/i }),
};

const ReplicationFormWithProvider = (
  <WithFormProvider>
    <Form layout={{ kind: 'tab' }}>
      <FormSection title={{ name: 'General' }}>
        <GeneralReplicationGroup prefix="replication." />
      </FormSection>
      <ReplicationForm prefix="replication." />
    </Form>
  </WithFormProvider>
);

// prettier-ignore
describe('ReplicationForm', () => {
  it('should render a form for replication workflow', async () => {
        reduxRender(
          ReplicationFormWithProvider,
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
      await selectClick(selectors.bucketSelect());
      await userEvent.click(selectors.bucketOption2());

      // Select the first destination.
      const LocationName = screen.getByTestId('select-location-name-replication-0');
      const lControl = LocationName.querySelector('.sc-select__control')
      const locCtl = notFalsyTypeGuard(lControl);
      await selectClick(locCtl);
      expect(locCtl.querySelector('.sc-select__single-value')?.textContent).toBe(undefined);
      const lOption = LocationName.querySelector('.sc-select__option');
      const lOpt = notFalsyTypeGuard(lOption)
      expect(lOpt?.textContent).toBe("chapter-ux (ARTESCA)");
      await userEvent.click(lOpt);
      expect(locCtl.querySelector('.sc-select__single-value')?.textContent).toBe('chapter-ux (ARTESCA)');
      const lAddButton = LocationName.querySelector('#addbtn0')
      await userEvent.click(notFalsyTypeGuard(lAddButton))
      expect(lAddButton).toBeDisabled()

      // Select the second destination.
      const NewLocationName = screen.getByTestId('select-location-name-replication-1')
      const nlControl = NewLocationName.querySelector('.sc-select__control')
      const nlCtl = notFalsyTypeGuard(nlControl)
      await selectClick(nlCtl);

      expect(nlCtl.querySelector('.sc-select__single-value')?.textContent).toBe(undefined);
      const nlOption = NewLocationName.querySelectorAll('.sc-select__option')[1]
      const nlOpt = notFalsyTypeGuard(nlOption)
      expect(nlOpt?.textContent).toBe("ring-nick (RING S3)");
      await userEvent.click(nlOpt);
      expect(nlCtl.querySelector('.sc-select__single-value')?.textContent).toBe('ring-nick (RING S3)');
      const nlAddButon = NewLocationName.querySelector('#addbtn1')
      expect(nlAddButon).not.toBeDisabled()

      const formValidation = screen.getByTestId('form-replication');
      expect(formValidation.textContent).toBe('form-valid');
   
  });
  it('should disable the veeam bucket as the source and display a tooltip on hover', async () => {
    //S
    renderWithRouterMatch(ReplicationFormWithProvider);
    //E
    await waitForElementToBeRemoved(() => screen.getByText(/Loading locations/i))
    await waitFor(() => screen.getByText(/General/i));
    await selectClick(selectors.bucketSelect());
    //V
    expect(selectors.bucketOption1()).toHaveAttribute('aria-disabled', 'false');
    expect(selectors.bucketOption2()).toHaveAttribute('aria-disabled', 'true');    
    await userEvent.hover(selectors.bucketOption2());
    expect(
      screen.getByText(/Replication is not available for a Bucket that was created especially for Veeam./i),
    ).toBeInTheDocument();
  });
  it('should display toast when bucket tagging fails', async () => {
    //S
    server.use(
      mockBucketOperations({
       forceFailure: true,
      }),
    );
    renderWithRouterMatch(ReplicationFormWithProvider);
    //E
    await waitForElementToBeRemoved(() => screen.getByText(/Loading locations/i))
    await waitFor(() => screen.getByText(/General/i));
    //V
    await waitFor(() => {
      expect(within(screen.getByRole('status')).getByText(/Encountered issues loading bucket tagging, causing uncertainty about the source of Bucket. Please refresh the page./i)).toBeVisible();
    });
    //E
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    //V
    await waitFor(()=>{
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }, {timeout: 8000})
  }); 
});
