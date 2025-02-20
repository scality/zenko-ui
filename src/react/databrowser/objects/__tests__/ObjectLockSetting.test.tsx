import { screen, waitFor } from '@testing-library/react';
import { renderWithRouterMatch } from '../../../utils/testUtil';
import ObjectLockSetting from '../ObjectLockSetting';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import userEvent from '@testing-library/user-event';

const server = setupServer();
describe('ObjectLockSetting', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  it('should submit the form accordingly', async () => {
    //S
    const putInterceptor = jest.fn();
    server.use(
      rest.put('http://testendpoint/test-bucket/object', (req, res, ctx) => {
        if (req.url.searchParams.has('retention')) {
          putInterceptor(req.body);
          return res(ctx.status(200), ctx.json({}));
        } else {
          return res(ctx.status(500));
        }
      }),
    );

    //E
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
              retainUntilDate: new Date('2022-01-31 00:00:00'),
            },
          },
        },
      },
    );

    await userEvent.click(screen.getByRole('button', { name: /Save/i }));

    //V
    await waitFor(() => {
      expect(putInterceptor).toHaveBeenCalledWith(
        '<Retention xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Mode>GOVERNANCE</Mode><RetainUntilDate>2022-01-31T00:00:00Z</RetainUntilDate></Retention>',
      );
    });
  });

  it('should display and error when the submission failed', async () => {
    //S
    const putInterceptor = jest.fn();
    server.use(
      rest.put('http://testendpoint/test-bucket/object', (req, res, ctx) => {
        if (req.url.searchParams.has('retention')) {
          putInterceptor(req.body);
          return res(ctx.status(500));
        } else {
          return res(ctx.status(500));
        }
      }),
    );

    //E
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
              retainUntilDate: new Date('2022-01-31 00:00:00'),
            },
          },
        },
      },
    );

    await userEvent.click(screen.getByRole('button', { name: /Save/i }));

    //V
    await waitFor(() => {
      expect(putInterceptor).toHaveBeenCalledWith(
        '<Retention xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Mode>GOVERNANCE</Mode><RetainUntilDate>2022-01-31T00:00:00Z</RetainUntilDate></Retention>',
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          'An error occurred while saving the retention settings.',
        ),
      ).toBeInTheDocument();
    });
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
              retainUntilDate: new Date('2022-01-31 00:00:00'),
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
              retainUntilDate: new Date('2022-01-31 00:00:00'),
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
