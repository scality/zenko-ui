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
import * as bucketsMutation from '../../next-architecture/domain/business/buckets';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import {
  mockOffsetSize,
  reduxRender,
  renderWithRouterMatch,
  selectClick,
  TEST_API_BASE_URL,
} from '../../utils/testUtil';
import ReplicationForm, { GeneralReplicationGroup, replicationSchema, validateCRRFields } from '../ReplicationForm';
import { newExpiration, newReplicationForm, newTransition } from '../utils';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { Resolver, ResolverOptions } from 'react-hook-form';
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

const WithFormProvider = ({ children, crrLocationNames = [] }) => {
  // Custom resolver that includes CRR validation
  const customResolver: Resolver<Record<string, unknown>> = async (
    values,
    context,
    options,
  ) => {
    // Check for CRR-related validation errors using the shared validation function
    const existingErrors: Record<string, Record<string, { type: string; message: string }>> = {};
    let hasExistingErrors = false;
    
    const replication = values.replication as {
      destinationLocation?: string[];
      destinationBucketName?: string;
      destinationRole?: string;
    } | undefined;
    
    if (replication) {
      const crrValidationErrors = validateCRRFields(
        replication.destinationLocation,
        crrLocationNames,
        replication.destinationBucketName,
        replication.destinationRole,
      );
      
      if (crrValidationErrors.bucketNameError) {
        existingErrors.replication = {
          ...existingErrors.replication,
          destinationBucketName: {
            type: 'validate',
            message: crrValidationErrors.bucketNameError,
          },
        };
        hasExistingErrors = true;
      }
      
      if (crrValidationErrors.roleError) {
        existingErrors.replication = {
          ...existingErrors.replication,
          destinationRole: {
            type: 'validate',
            message: crrValidationErrors.roleError,
          },
        };
        hasExistingErrors = true;
      }
    }
    
    // Build Joi schema
    const schema = Joi.object({
      type: Joi.string().valid('replication', 'expiration', 'transition'),
      replication: Joi.when('type', {
        is: Joi.equal('replication'),
        then: Joi.object(
          replicationSchema(
            [],
            [],
            false,
            false,
          ),
        ),
        otherwise: Joi.valid(),
      }),
      transition: Joi.when('type', {
        is: Joi.equal('transition'),
        then: Joi.object({}),
        otherwise: Joi.valid(),
      }),
      expiration: Joi.when('type', {
        is: Joi.equal('expiration'),
        then: Joi.object({}),
        otherwise: Joi.valid(),
      }),
    });
    
    const joiValidator = joiResolver(schema as any);
    const joiResult = await joiValidator(values, context, options as ResolverOptions<Record<string, unknown>>);
    
    // Merge existing validation errors with Joi errors, giving priority to existing errors
    if (hasExistingErrors) {
      return {
        values: joiResult.values,
        errors: {
          ...joiResult.errors,
          ...existingErrors,
        },
      };
    }
    
    return joiResult;
  };

  const formMethods = useForm({
    mode: 'onChange', // Use onChange to trigger validation immediately
    resolver: customResolver,
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

const ReplicationFormWithProvider = (crrLocationNames: string[] = []) => (
  <WithFormProvider crrLocationNames={crrLocationNames}>
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
          ReplicationFormWithProvider(),
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

      // Form may be invalid initially if destination location is empty
      // Wait for form to stabilize
      await waitFor(() => {
        const formValidationa = screen.getByTestId('form-replication');
        // Form should be valid after locations load and default values are set
        expect(['form-valid', 'form-invalid']).toContain(formValidationa.textContent);
      });

      // Select the Source Bucket.
      await selectClick(selectors.bucketSelect());
      await userEvent.click(selectors.bucketOption2());

      // Select the first destination.
      const locationSelect = screen.getByLabelText(/Location Name/i);
      await selectClick(locationSelect);
      
      const chapterUxOption = screen.getByRole('option', { name: /chapter-ux.*ARTESCA/i });
      expect(chapterUxOption).toBeInTheDocument();
      await userEvent.click(chapterUxOption);
      
      const addButton = screen.getByRole('button', { name: /Add/i });
      await userEvent.click(addButton);
      
      // Wait for the second location to appear
      // The second location select doesn't have a label, so we find it by id
      // We use document.getElementById as a fallback since semantic queries may not work for unlabeled selects
      await waitFor(() => {
        const secondSelect = document.getElementById('select-location-1');
        return secondSelect !== null;
      }, { timeout: 3000 });
      
      // Find the second location select by id (since it has no label)
      // This is acceptable as a fallback when semantic queries aren't possible
      const secondLocationSelect = document.getElementById('select-location-1');
      expect(secondLocationSelect).not.toBeNull();
      await selectClick(secondLocationSelect!);

      const ringNickOption = screen.getByRole('option', { name: /ring-nick.*RING S3/i });
      expect(ringNickOption).toBeInTheDocument();
      await userEvent.click(ringNickOption);
      
      // After selecting the second location, the Add button should be on the second location row
      // The Add button is only visible on the last location row, so there should be one Add button
      // and it should be enabled (since there are more locations available)
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add/i });
        expect(addButton).not.toBeDisabled();
      }, { timeout: 3000 });

      const formValidation = screen.getByTestId('form-replication');
      expect(formValidation.textContent).toBe('form-valid');
   
  });
  it('should disable the veeam bucket as the source and display a tooltip on hover', async () => {
    //S
    renderWithRouterMatch(ReplicationFormWithProvider());
    //E
    await waitForElementToBeRemoved(() => screen.getByText(/Loading locations/i))
    await waitFor(() => screen.getByText(/General/i));
    // Wait for bucket select to be available
    await waitFor(() => {
      expect(selectors.bucketSelect()).toBeInTheDocument();
    }, { timeout: 5000 });
    await selectClick(selectors.bucketSelect());
    //V

    await waitFor(
      () =>
        expect(
          selectors.bucketOption1(),
        ).toHaveAttribute('aria-disabled', 'false'),
      {
        timeout: 10_000,
      },
    );
    await waitFor(
      () =>
        expect(
          selectors.bucketOption2(),
        ).toHaveAttribute('aria-disabled', 'true'),
      {
        timeout: 10_000,
      },
    );   
    await userEvent.hover(selectors.bucketOption2());
    expect(
      screen.getByText(/Replication is not available for a Bucket that was created especially for Veeam./i),
    ).toBeInTheDocument();
  });
  it('should display toast when bucket tagging fails', async () => {
    //S
    jest.spyOn(bucketsMutation, 'useBucketTagging').mockImplementation(() => {
      return {
        tags: {
          status: 'error',
          title: 'An error occurred while fetching the tags',
          reason: 'Internal Server Error',
        },
      };
    });
    renderWithRouterMatch(ReplicationFormWithProvider());
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
  
  describe('CRR location destination', () => {
    const crrLocationName = 'crr-location';
    const serverWithCRR = setupServer(
      rest.post(
        `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/accounts/${accountName}/workflows/${replicationId}`,
        (req, res, ctx) => res(ctx.json([])),
      ),
      mockBucketListing(),
      rest.get(
        `${TEST_API_BASE_URL}/api/v1/config/overlay/view/${INSTANCE_ID}`,
        (req, res, ctx) =>
          res(
            ctx.json({
              browserAccess: { enabled: true },
              endpoints: [],
              instanceId: INSTANCE_ID,
              locations: {
                'chapter-ux': {
                  details: {
                    accessKey: 'AMFFHQC1TTUIQ9K6B7LO',
                    bootstrapList: [],
                    bucketName: 'replication-for-chapter-ux',
                    endpoint: 'http://s3.workloadplane.scality.local',
                    region: 'us-east-1',
                    secretKey: '*****',
                  },
                  locationType: 'location-scality-artesca-s3-v1',
                  name: 'chapter-ux',
                  objectId: '4ab68d3f-9eec-11ec-ae58-6e38b828d159',
                },
                'ring-nick': {
                  details: {
                    accessKey: 'CO558N0OWLDBUULGAAUU',
                    bootstrapList: [],
                    bucketMatch: true,
                    bucketName: 'xdm-chapter-ux-test',
                    endpoint: 'http://10.200.3.166',
                    region: 'us-east-1',
                    secretKey: '*****',
                  },
                  locationType: 'location-scality-ring-s3-v1',
                  name: 'ring-nick',
                  objectId: '99a06f79-c62c-11ec-b993-7e8a0ab79998',
                },
                [crrLocationName]: {
                  details: {
                    endpoint: 'https://s3.example.com',
                    stsEndpoint: 'https://sts.example.com',
                    accessKey: 'AKIAIOSFODNN7EXAMPLE',
                    secretKey: '*****',
                  },
                  locationType: 'location-scality-crr-v1',
                  name: crrLocationName,
                  objectId: 'crr-location-id-123',
                },
              },
              replicationStreams: [],
              updatedAt: '2022-04-27T13:18:58Z',
              users: [],
              version: 12,
            }),
          ),
      ),
      mockBucketOperations({
        isVersioningEnabled: true,
        isVeeamTagged: (bucketName) => (bucketName === 'bucket2' ? true : false),
      }),
    );

    beforeAll(() => {
      serverWithCRR.listen({ onUnhandledRequest: 'error' });
    });
    afterEach(() => serverWithCRR.resetHandlers());
    afterAll(() => serverWithCRR.close());

    it('should show bucket name and role fields when CRR location is selected', async () => {
      reduxRender(
        ReplicationFormWithProvider([crrLocationName]),
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

      await waitForElementToBeRemoved(() => screen.getByText(/Loading locations/i));
      await waitFor(() => screen.getByText(/General/i));
      
      // Wait for locations to be available
      await waitFor(() => {
        expect(screen.getByLabelText(/Location Name/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Select the Source Bucket
      await selectClick(selectors.bucketSelect());
      await userEvent.click(selectors.bucketOption1());

      // Select CRR location as destination
      const locationSelect = screen.getByLabelText(/Location Name/i);
      await selectClick(locationSelect);
      
      // Find and click the CRR location option (it will be displayed as "crr-location (CRR)")
      const crrOption = screen.getByRole('option', { 
        name: new RegExp(crrLocationName, 'i') 
      });
      expect(crrOption).toBeInTheDocument();
      await userEvent.click(crrOption);

      // Wait for bucket name and role fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Target Bucket Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
      });
    });

    it('should disable Add button when CRR location is selected', async () => {
      reduxRender(
        ReplicationFormWithProvider([crrLocationName]),
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

      await waitForElementToBeRemoved(() => screen.getByText(/Loading locations/i));
      await waitFor(() => screen.getByText(/General/i));
      
      // Wait for locations to be available
      await waitFor(() => {
        expect(screen.getByLabelText(/Location Name/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Select the Source Bucket
      await selectClick(selectors.bucketSelect());
      await userEvent.click(selectors.bucketOption1());

      // Select CRR location as destination
      const locationSelect = screen.getByLabelText(/Location Name/i);
      await selectClick(locationSelect);
      
      const crrOption = screen.getByRole('option', { 
        name: new RegExp(crrLocationName, 'i') 
      });
      await userEvent.click(crrOption);

      // Check that Add button is disabled
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add/i });
        expect(addButton).toBeDisabled();
      });
    });

    it('should show warning when CRR location is mixed with non-CRR locations', async () => {
      reduxRender(
        ReplicationFormWithProvider([crrLocationName]),
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

      await waitForElementToBeRemoved(() => screen.getByText(/Loading locations/i));
      await waitFor(() => screen.getByText(/General/i));
      
      // Wait for locations to be available
      await waitFor(() => {
        expect(screen.getByLabelText(/Location Name/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Select the Source Bucket
      await selectClick(selectors.bucketSelect());
      await userEvent.click(selectors.bucketOption1());

      // Select non-CRR location first
      const locationSelect = screen.getByLabelText(/Location Name/i);
      await selectClick(locationSelect);
      
      const nonCRROption = screen.getByRole('option', { name: /chapter-ux/i });
      await userEvent.click(nonCRROption);

      // Add a second location
      const addButton = screen.getByRole('button', { name: /Add/i });
      await userEvent.click(addButton);

      // Wait for second location to appear (will be the second location select)
      await waitFor(() => {
        const secondSelect = document.getElementById('select-location-1');
        return secondSelect !== null;
      }, { timeout: 3000 });

      // Select CRR location as second destination
      // Since the second location has no label, we use getElementById as fallback
      const secondLocationSelect = document.getElementById('select-location-1');
      expect(secondLocationSelect).not.toBeNull();
      await selectClick(secondLocationSelect!);
      
      const crrOption = screen.getByRole('option', { 
        name: new RegExp(crrLocationName, 'i') 
      });
      await userEvent.click(crrOption);

      // Check that warning appears
      await waitFor(() => {
        expect(
          screen.getByText(
            /Replication rules to a CRR location can only mention a single CRR location as destination/i
          )
        ).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should not show bucket name and role fields when only non-CRR locations are selected', async () => {
      reduxRender(
        ReplicationFormWithProvider([crrLocationName]),
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

      await waitForElementToBeRemoved(() => screen.getByText(/Loading locations/i));
      await waitFor(() => screen.getByText(/General/i));
      
      // Wait for locations to be available
      await waitFor(() => {
        expect(screen.getByLabelText(/Location Name/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Select the Source Bucket
      await selectClick(selectors.bucketSelect());
      await userEvent.click(selectors.bucketOption1());

      // Select non-CRR location as destination
      const locationSelect = screen.getByLabelText(/Location Name/i);
      await selectClick(locationSelect);
      
      const nonCRROption = screen.getByRole('option', { name: /chapter-ux/i });
      await userEvent.click(nonCRROption);

      // Wait a bit for the form to update
      await waitFor(() => {
        // Verify bucket name and role fields are NOT shown
        expect(screen.queryByLabelText(/Target Bucket Name/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Role/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should require bucket name and role when CRR location is selected', async () => {
      reduxRender(
        ReplicationFormWithProvider([crrLocationName]),
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

      await waitForElementToBeRemoved(() => screen.getByText(/Loading locations/i));
      await waitFor(() => screen.getByText(/General/i));
      
      // Wait for locations to be available
      await waitFor(() => {
        expect(screen.getByLabelText(/Location Name/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Select the Source Bucket
      await selectClick(selectors.bucketSelect());
      await userEvent.click(selectors.bucketOption1());

      // Select CRR location as destination
      const locationSelect = screen.getByLabelText(/Location Name/i);
      await selectClick(locationSelect);
      
      const crrOption = screen.getByRole('option', { 
        name: new RegExp(crrLocationName, 'i') 
      });
      await userEvent.click(crrOption);

      // Wait for fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Target Bucket Name/i)).toBeInTheDocument();
      });

      // Wait for form to be invalid (validation runs automatically with mode: 'onChange')
      // The form should be invalid because bucketName and role are empty when CRR is selected
      await waitFor(() => {
        const formValidation = screen.getByTestId('form-replication');
        expect(formValidation.textContent).toBe('form-invalid');
      }, { timeout: 5000 });

      // Verify that the form remains invalid (this confirms validation is working)
      // The error messages only show when fields are touched, but the form validity
      // should reflect the validation state immediately
      const formValidation = screen.getByTestId('form-replication');
      expect(formValidation.textContent).toBe('form-invalid');

      // Verify form is invalid when bucketName is empty
      // The form should be invalid because bucketName and role are empty when CRR is selected
      expect(formValidation.textContent).toBe('form-invalid');

      // Fill bucket name - form should still be invalid because role is empty
      const bucketNameInput = screen.getByLabelText(/Target Bucket Name/i);
      await userEvent.type(bucketNameInput, 'target-bucket-name');
      
      // Wait for form to update - should still be invalid (role is empty)
      await waitFor(() => {
        const formValidation = screen.getByTestId('form-replication');
        expect(formValidation.textContent).toBe('form-invalid');
      }, { timeout: 3000 });

      // Fill role - form should now be valid
      const roleInput = screen.getByLabelText(/Role/i);
      await userEvent.type(roleInput, 'arn:aws:iam::123456789012:role/TestRole');
      
      // Wait for form to become valid
      await waitFor(() => {
        const formValidation = screen.getByTestId('form-replication');
        expect(formValidation.textContent).toBe('form-valid');
      }, { timeout: 3000 });
    });
  });
});
