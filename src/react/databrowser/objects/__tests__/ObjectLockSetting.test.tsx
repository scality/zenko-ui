import { screen } from '@testing-library/react';
import { XDM_FEATURE } from '../../../../js/config';
import { AppConfig } from '../../../../types/entities';
import { renderWithRouterMatch } from '../../../utils/testUtil';
import ObjectLockSetting from '../ObjectLockSetting';

const config: AppConfig = {
  zenkoEndpoint: 'http://localhost:8000',
  stsEndpoint: 'http://localhost:9000',
  iamEndpoint: 'http://localhost:10000',
  managementEndpoint: 'http://localhost:11000',
  //@ts-expect-error fix this when you are working on it
  navbarEndpoint: 'http://localhost:12000',
  navbarConfigUrl: 'http://localhost:13000',
  features: [XDM_FEATURE],
};

describe('ObjectLockSetting', () => {
  const errorMessage = 'This is an error test message';

  it('should render ObjectLockSetting component with an error banner', async () => {
    renderWithRouterMatch(<ObjectLockSetting />, undefined, {
      uiErrors: {
        errorMsg: errorMessage,
        errorType: 'byComponent',
      },
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should render ObjectLockSetting component with current data filled', async () => {
    renderWithRouterMatch(
      <ObjectLockSetting />,
      {
        route: '/test-bucket/objects?prefix=object&versionId=1',
        path: '/:bucketName/objects',
      },
      {
        s3: {
          objectMetadata: {
            bucketName: 'test-bucket',
            objectRetention: {
              mode: 'GOVERNANCE',
              retainUntilDate: '2022-01-31 00:00:00"',
            },
          },
        },
      },
    );

    expect(screen.getByLabelText('Retention')).toBeDisabled();
    expect(screen.getByLabelText('Retention')).toBeChecked();

    expect(screen.getByLabelText('Governance')).toBeChecked();

    expect(screen.getByLabelText('Retention until date')).toHaveValue(
      '2022-01-31',
    );
  });

  it('should disable the governance option for ObjectLockSetting component ', async () => {
    renderWithRouterMatch(
      <ObjectLockSetting />,
      {
        route: '/test-bucket/objects?prefix=object&versionId=1',
        path: '/:bucketName/objects',
      },
      {
        s3: {
          objectMetadata: {
            bucketName: 'test-bucket',
            objectRetention: {
              mode: 'COMPLIANCE',
              retainUntilDate: '2022-01-31 00:00:00"',
            },
          },
        },
      },
    );

    expect(screen.getByLabelText('Retention')).toBeDisabled();
    expect(screen.getByLabelText('Retention')).toBeChecked();

    expect(screen.getByLabelText('Governance')).toBeDisabled();

    expect(screen.getByLabelText('Compliance')).toBeChecked();

    expect(screen.getByLabelText('Retention until date')).toHaveValue(
      '2022-01-31',
    );
  });
});
