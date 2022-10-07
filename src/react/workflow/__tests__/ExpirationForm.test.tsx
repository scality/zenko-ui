import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  TEST_API_BASE_URL,
  Wrapper as wrapper,
} from '../../utils/test';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ExpirationForm from '../ExpirationForm';
import { FormProvider, useForm } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { List } from 'immutable';
import { S3Bucket } from '../../../types/s3';
import { PerLocationMap } from '../../../types/config';
import { GeneralExpirationGroup } from '../ExpirationForm';
import { Form, FormSection } from '@scality/core-ui';

const instanceId = 'instanceId';
const accountName = 'pat';
const expirationId = 'expirationId';

const S3BucketList: List<S3Bucket> = List.of(
  {
    CreationDate: '2020-01-01T00:00:00.000Z',
    Name: 'bucket1',
    LocationConstraint: 'us-east-1',
    VersionStatus: 'Enabled',
  },
  {
    CreationDate: '2021-01-01T00:00:00.000Z',
    Name: 'bucket2',
    LocationConstraint: 'us-east-1',
    VersionStatus: 'Suspended',
  },
);

const locations: PerLocationMap<any> = {
  'chapter-ux': {
    details: {
      accessKey: 'AMFFHQC1TTUIQ9K6B7LO',
      bootstrapList: [],
      bucketName: 'replication-for-chapter-ux',
      endpoint: 'http://s3.workloadplane.scality.local',
      region: 'us-east-1',
      secretKey:
        'ICzSVrjcUJYYMiGU2TJV4hcCyuO0Ds6OJsh7D/Nyp/ua9zmCp2IxhBf38nv4N4x/9A6oZG11yiPkcFq7sYNWnepIuX+hJLlLN0RI/0MFv7WBhvA0Z5GN5zw24BtTiR6STgCxqaJ0kbE/2mc47TReap9PqiZ/vQZc4kSbBH+75EDTFqZsgKmEVGKNgKb9Llt56Ml4htdR3NJZ/Pd+BwiKMf1A6L9aroylkx8plarOkmM+9FS72lV2nDa/OStezRsNdsTDEMpXfApTewSBEE/Rq+7lgva8xrXZWz/V7f4L953m9i/lSd8ZhmCH2vpqowg+qGgVkVWMiSoAt5UpkzZBTg==',
    },
    locationType: 'location-scality-artesca-s3-v1',
    name: 'chapter-ux',
    objectId: '4ab68d3f-9eec-11ec-ae58-6e38b828d159',
  },
  'us-east-1': {
    isBuiltin: true,
    locationType: 'location-file-v1',
    name: 'us-east-1',
    objectId: '95dbedf5-9888-11ec-8565-1ac2af7d1e53',
  },
};

const server = setupServer(
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/accounts/${accountName}/workflows/${expirationId}`,
    (req, res, ctx) => res(ctx.json([])),
  ),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const WithFormProvider = ({ children }) => {
  const formMethods = useForm();
  const {
    formState: { isValid },
  } = formMethods;
  const childrenWithProps = React.Children.map(children, (child) => {
    return (
      <>
        <div data-testid="form-expiration">
          {isValid ? 'form-valid' : 'form-invalid'}
        </div>
        {child}
      </>
    );
  });
  return <FormProvider {...formMethods}>{childrenWithProps}</FormProvider>;
};

describe('ExpirationForm', () => {
  it('should render a form for expiration workflow', async () => {
    try {
      render(
        <WithFormProvider>
          <Form layout={{ kind: 'tab' }}>
            <FormSection title={{ name: 'General' }}>
              <GeneralExpirationGroup />
            </FormSection>
            <ExpirationForm bucketList={S3BucketList} locations={locations} />
          </Form>
        </WithFormProvider>,
        {
          wrapper,
        },
      );

      await waitFor(() => screen.getByText(/General/i));
      expect(screen.getByText(/State/i)).toBeInTheDocument();
      expect(screen.getByText(/Source/i)).toBeInTheDocument();
      expect(screen.getByText(/Bucket Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Filters/i)).toBeInTheDocument();
      expect(screen.getByText(/Prefix/i)).toBeInTheDocument();
      expect(screen.getByText(/Tags/i)).toBeInTheDocument();
      expect(screen.getByText(/Action/i)).toBeInTheDocument();
      expect(screen.getByText(/Current/i)).toBeInTheDocument();
      expect(screen.getByText(/Previous/i)).toBeInTheDocument();
      expect(
        screen.getByText('Remove expired Delete markers'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Expire incomplete Multipart uploads'),
      ).toBeInTheDocument();

      const spinButton = screen.getAllByRole('spinbutton');
      expect(spinButton[0].getAttribute('type')).toBe('number');
      expect(spinButton[1].getAttribute('type')).toBe('number');
      expect(spinButton[2].getAttribute('type')).toBe('number');

      const sourceBucket = screen.getByTestId('select-bucket-name-expiration');
      userEvent.click(
        notFalsyTypeGuard(sourceBucket.querySelector('.sc-select__control')),
      );
      userEvent.click(screen.getAllByRole('option')[0]);

      expect(sourceBucket.lastChild?.textContent).toBe(
        'bucket1 (us-east-1 / Local Filesystem)',
      );

      const expireCurrentToggleState = screen.getByTestId(
        'toggle-action-expire-current-version',
      );
      const expireCurrent = expireCurrentToggleState.querySelector(
        'input[placeholder="currentVersionDelayDaysToggle"]',
      );
      userEvent.click(notFalsyTypeGuard(expireCurrent));

      const expirePreviousToggleState = screen.getByTestId(
        'toggle-action-expire-previous-version',
      );
      const expirePrevious = expirePreviousToggleState.querySelector(
        'input[placeholder="previousVersionDelayDaysToggle"]',
      );

      const removeExpiredToggleState = screen.getByTestId(
        'toggle-action-remove-expired-markers',
      );
      const removeExpired = removeExpiredToggleState.querySelector(
        'input[placeholder="expireDeleteMarkersTrigger"]',
      );

      const expireIncompleteMultipartToggleState = screen.getByTestId(
        'toggle-action-expire-incomplete-multipart',
      );
      const expireIncompleteMultipart =
        expireIncompleteMultipartToggleState.querySelector(
          'input[placeholder="incompleteMultipartUploadDelayDaysToggle"]',
        );
      expect(expirePrevious).not.toBeDisabled();
      expect(removeExpired).toBeDisabled();
      expect(expireIncompleteMultipart).not.toBeDisabled();

      userEvent.click(
        notFalsyTypeGuard(sourceBucket.querySelector('.sc-select__control')),
      );
      userEvent.click(screen.getAllByRole('option')[1]);
      expect(sourceBucket.lastChild?.textContent).toBe(
        'bucket2 (us-east-1 / Local Filesystem)',
      );

      expect(expireCurrent).not.toBeDisabled();
      expect(expirePrevious).toBeDisabled();
      expect(removeExpired).toBeDisabled();
      expect(expireIncompleteMultipart).not.toBeDisabled();

      const formValidation = screen.getByTestId('form-expiration');
      expect(formValidation.textContent).toBe('form-valid');
    } catch (e) {
      console.log('should render a form for expiration workflow: ', e);
      throw e;
    }
  });
});
