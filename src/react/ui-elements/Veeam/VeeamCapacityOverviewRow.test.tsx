import { render, waitFor, screen } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { bucketName } from '../../../js/mock/S3Client';
import {
  NewWrapper,
  TEST_API_BASE_URL,
  mockOffsetSize,
} from '../../utils/testUtil';
import { VeeamCapacityOverviewRow } from './VeeamCapacityOverviewRow';
import { VEEAM_XML_PREFIX } from './VeeamConstants';

describe('VeeamCapacityOverviewRow', () => {
  const server = setupServer(
    rest.get(`${TEST_API_BASE_URL}/${bucketName}`, (req, res, ctx) => {
      return res(
        ctx.xml(`
          <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Tagging>
              <TagSet>
                <Tag>
                  <Key>X-Scality-Veeam-Application</Key>
                  <Value>Veeam Backup &amp;#38; Replication</Value>
                </Tag>
              </TagSet>
            </Tagging>
          `),
      );
    }),
    rest.get(
      `${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}/capacity.xml`,
      (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.xml(`
        <?xml version="1.0" encoding="UTF-8" ?>
          <CapacityInfo>
            <Capacity>107374182400</Capacity>
            <Available>107374182400</Available>
            <Used>0</Used>
        </CapacityInfo>`),
        );
      },
    ),
  );
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
    mockOffsetSize(200, 100);
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  it('should render the VeeamCapacityOverviewRow', async () => {
    render(<VeeamCapacityOverviewRow bucketName={bucketName} />, {
      wrapper: NewWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Max repository Capacity')).toBeInTheDocument();
    });

    expect(screen.getByText('100.0 GiB')).toBeInTheDocument();
  });

  it('should not render the row if SOSAPI is not enabled', () => {
    server.use(
      rest.get(`${TEST_API_BASE_URL}/${bucketName}`, (req, res, ctx) => {
        return res(
          ctx.xml(`
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
              <Tagging>
                <TagSet>
                  <Tag>
                    <Key>X-Scality-Veeam-Application</Key>
                    <Value>Test Application</Value>
                  </Tag>
                </TagSet>
              </Tagging>
            `),
        );
      }),
    );
    render(<VeeamCapacityOverviewRow bucketName={bucketName} />, {
      wrapper: NewWrapper(),
    });
    expect(
      screen.queryByText('Max repository Capacity'),
    ).not.toBeInTheDocument();
  });

  it('should display loading state', async () => {
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}/capacity.xml`,
        (req, res, ctx) => {
          return res(ctx.status(400));
        },
      ),
    );
    render(<VeeamCapacityOverviewRow bucketName={bucketName} />, {
      wrapper: NewWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Max repository Capacity')).toBeInTheDocument();
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error state', async () => {
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}/capacity.xml`,
        (req, res, ctx) => {
          return res(ctx.status(404));
        },
      ),
    );
    render(<VeeamCapacityOverviewRow bucketName={bucketName} />, {
      wrapper: NewWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Max repository Capacity')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });
});
