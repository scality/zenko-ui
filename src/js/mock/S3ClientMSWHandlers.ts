import { rest } from 'msw';
import { zenkoUITestConfig } from '../../react/utils/testUtil';

export const frozenDate = new Date('2021-01-01T00:00:00.000Z');
export const defaultMockedBuckets = [
  {
    Name: 'toto',
    CreationDate: frozenDate,
  },
  {
    Name: 'bucket',
    CreationDate: frozenDate,
  },
];

export function mockBucketListing(
  bucketList: { Name: string; CreationDate: Date }[] = defaultMockedBuckets,
  forceFailure = false,
) {
  return rest.get(`${zenkoUITestConfig.zenkoEndpoint}`, (req, res, ctx) => {
    if (forceFailure) {
      return res(ctx.status(500));
    }

    return res(
      ctx.xml(`
        <?xml version="1.0" encoding="UTF-8"?>
        <ListAllMyBucketsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
          <Owner>
            <ID>1234</ID>
            <DisplayName>test</DisplayName>
          </Owner>
          <Buckets>
            ${bucketList
              .map(
                (bucket) => `
              <Bucket>
                <Name>${bucket.Name}</Name>
                <CreationDate>${bucket.CreationDate.toISOString()}</CreationDate>
              </Bucket>
            `,
              )
              .join('')}
          </Buckets>
        </ListAllMyBucketsResult>
      `),
    );
  });
}

export function mockBucketOperations(
  {
    location = '',
    isVersioningEnabled = false,
    slowdown = false,
    forceFailure = false,
  }: {
    location?: string;
    isVersioningEnabled?: boolean;
    slowdown?: boolean;
    forceFailure?: boolean;
  } = {
    location: '',
    isVersioningEnabled: false,
    slowdown: false,
    forceFailure: false,
  },
) {
  return rest.get(
    `${zenkoUITestConfig.zenkoEndpoint}/:bucketName`,
    async (req, res, ctx) => {
      if (forceFailure) {
        return res(ctx.status(500));
      }

      if (slowdown) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (req.url.searchParams.has('location')) {
        return res(
          ctx.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
            <LocationConstraint>${location}</LocationConstraint>
          </LocationConstraint>
        `),
        );
      }

      if (req.url.searchParams.has('versioning')) {
        return res(
          ctx.xml(`
        <?xml version="1.0" encoding="UTF-8"?>
        <VersioningConfiguration>
           <Status>${isVersioningEnabled ? 'Enabled' : 'Disabled'}</Status>
        </VersioningConfiguration>
          `),
        );
      }

      return res(ctx.status(404));
    },
  );
}
