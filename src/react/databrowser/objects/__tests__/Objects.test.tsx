import { setupServer } from 'msw/node';
import { rest } from 'msw';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../../utils/testUtil';
import Objects from '../Objects';
import { screen, waitFor } from '@testing-library/react';
import router from 'react-router';

const BUCKET_NAME = 'bucket';
const COLD_OBJECT_KEY = 'my-cold-image.jpg';
const OBJECT_IN_DEFAULT_LOCATION = 'object-key';
const server = setupServer(
  //HANDLERS TO GET BUCKET INFO
  //get bucket cors
  rest.get(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
    if (req.url.searchParams.has('cors')) {
      return res(
        ctx.status(404),
        ctx.xml(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Error>
              <Code>NoSuchCORSConfiguration</Code>
              <Message>The CORS configuration does not exist</Message>
              <Resource></Resource>
              <RequestId>8a4fe292694e8b1f9445</RequestId>
          </Error>`,
        ),
      );
    }
  }),
  //get bucket location
  rest.get(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
    if (req.url.searchParams.has('location')) {
      return res(
        ctx.status(200),
        ctx.xml(
          `<?xml version="1.0" encoding="UTF-8"?>
        <LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">twsra</LocationConstraint>`,
        ),
      );
    }
  }),
  //get bucket acl
  rest.get(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
    if (req.url.searchParams.has('acl')) {
      return res(
        ctx.status(200),
        ctx.xml(
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <AccessControlPolicy>
              <Owner>
                  <ID>0a71e22b1567f62dcd11853d46efeb16c0485cb47dd6a90515ab9802f19bcb54</ID>
                  <DisplayName>william</DisplayName>
              </Owner>
              <AccessControlList>
                  <Grant>
                      <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
                          <ID>0a71e22b1567f62dcd11853d46efeb16c0485cb47dd6a90515ab9802f19bcb54</ID>
                          <DisplayName>william</DisplayName>
                      </Grantee>
                      <Permission>FULL_CONTROL</Permission>
                  </Grant>
              </AccessControlList>
          </AccessControlPolicy>`,
        ),
      );
    }
  }),
  //get bucket versioning
  rest.get(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
    if (req.url.searchParams.has('versioning')) {
      return res(
        ctx.status(200),
        ctx.xml(
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <VersioningConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
              <Status>Enabled</Status>
          </VersioningConfiguration>`,
        ),
      );
    }
  }),
  //get bucket object lock configuration
  rest.get(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
    if (req.url.searchParams.has('object-lock')) {
      return res(
        ctx.status(404),
        ctx.xml(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Error>
              <Code>ObjectLockConfigurationNotFoundError</Code>
              <Message>The object lock configuration was not found</Message>
              <Resource></Resource>
              <RequestId>2f67ded9db41ae0bfefb</RequestId>
          </Error>`,
        ),
      );
    }
  }),

  rest.get(
    `${TEST_API_BASE_URL}/${BUCKET_NAME}/${COLD_OBJECT_KEY}`,
    (req, res, ctx) => {
      if (req.url.searchParams.has('legal-hold')) {
        return res(
          ctx.status(400),
          ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
        <Error>
            <Code>InvalidRequest</Code>
            <Message>Bucket is missing Object Lock Configuration</Message>
            <Resource></Resource>
            <RequestId>25380d3b164f919b82c4</RequestId>
        </Error>`),
        );
      }
    },
  ),

  rest.get(
    `${TEST_API_BASE_URL}/${BUCKET_NAME}/${COLD_OBJECT_KEY}`,
    (req, res, ctx) => {
      if (req.url.searchParams.has('retention')) {
        return res(
          ctx.status(400),
          ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
          <Error>
              <Code>InvalidRequest</Code>
              <Message>Bucket is missing Object Lock Configuration</Message>
              <Resource></Resource>
              <RequestId>b6a633f20949b5dad567</RequestId>
          </Error>`),
        );
      }
    },
  ),

  rest.get(
    `${TEST_API_BASE_URL}/${BUCKET_NAME}/${OBJECT_IN_DEFAULT_LOCATION}`,
    (req, res, ctx) => {
      if (req.url.searchParams.has('legal-hold')) {
        return res(
          ctx.status(400),
          ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
        <Error>
            <Code>InvalidRequest</Code>
            <Message>Bucket is missing Object Lock Configuration</Message>
            <Resource></Resource>
            <RequestId>25380d3b164f919b82c4</RequestId>
        </Error>`),
        );
      }
    },
  ),

  rest.get(
    `${TEST_API_BASE_URL}/${BUCKET_NAME}/${OBJECT_IN_DEFAULT_LOCATION}`,
    (req, res, ctx) => {
      if (req.url.searchParams.has('retention')) {
        return res(
          ctx.status(400),
          ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
          <Error>
              <Code>InvalidRequest</Code>
              <Message>Bucket is missing Object Lock Configuration</Message>
              <Resource></Resource>
              <RequestId>b6a633f20949b5dad567</RequestId>
          </Error>`),
        );
      }
    },
  ),

  //list object
  rest.get(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
    if (req.url.searchParams.has('list-type')) {
      return res(
        ctx.xml(`
        <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
            <Name>${BUCKET_NAME}</Name>
            <Prefix/>
            <KeyCount>2</KeyCount>
            <MaxKeys>1000</MaxKeys>
            <IsTruncated>false</IsTruncated>
            <Contents>
                <Key>${COLD_OBJECT_KEY}</Key>
                <LastModified>2009-10-12T17:50:30.000Z</LastModified>
                <ETag>"fba9dede5f27731c9771645a39863328"</ETag>
                <Size>434234</Size>
                <StorageClass>europe25-myroom-cold</StorageClass>
            </Contents>
            <Contents>
                <Key>${OBJECT_IN_DEFAULT_LOCATION}</Key>
                <LastModified>2009-10-12T17:50:30.000Z</LastModified>
                <ETag>"fba9dede5f27731c9771645a39863328"</ETag>
                <Size>434234</Size>
                <StorageClass>default</StorageClass>
            </Contents>
        </ListBucketResult>
        `),
      );
    }
  }),
);

beforeAll(() => {
  jest.spyOn(router, 'useParams').mockReturnValue({
    bucketName: BUCKET_NAME,
  });
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Objects', () => {
  it('should remove the link to download for the object store in cold storage', async () => {
    //S
    reduxRender(<Objects />, {
      configuration: {
        latest: {
          locations: {
            'europe25-myroom-cold': {
              name: 'europe25-myroom-cold',
              isCold: true,
            },
          },
        },
      },
    });
    //E
    await waitFor(() => {
      expect(screen.getByText(/storage location/i)).toBeInTheDocument();
    });
    //V
    expect(
      screen.queryByRole('link', { name: new RegExp(COLD_OBJECT_KEY) }),
    ).toBe(null);
    expect(
      screen.getByRole('link', {
        name: new RegExp(OBJECT_IN_DEFAULT_LOCATION),
      }),
    ).toBeInTheDocument();
  });
});
