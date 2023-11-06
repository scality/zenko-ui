import { rest } from 'msw';
import { zenkoUITestConfig } from '../../react/utils/testUtil';

export const frozenDate = new Date('2021-01-01T00:00:00.000Z');
export const defaultMockedBuckets = [
  {
    Name: 'bucket1',
    CreationDate: frozenDate,
  },
  {
    Name: 'bucket2',
    CreationDate: frozenDate,
  },
];

const defaultMockedObjects = [
  {
    Key: '123',
    VersionId: '123',
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
    location?: string | ((bucketName: string) => string);
    isVersioningEnabled?: boolean | ((bucketName: string) => boolean);
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

      const bucketName = req.params.bucketName as string;

      if (req.url.searchParams.has('location')) {
        return res(
          ctx.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
            <LocationConstraint>${
              typeof location === 'function' ? location(bucketName) : location
            }</LocationConstraint>
          </LocationConstraint>
        `),
        );
      }

      if (req.url.searchParams.has('versioning')) {
        return res(
          ctx.xml(`
        <?xml version="1.0" encoding="UTF-8"?>
        <VersioningConfiguration>
           <Status>${
             (
               typeof isVersioningEnabled === 'function'
                 ? isVersioningEnabled(bucketName)
                 : isVersioningEnabled
             )
               ? 'Enabled'
               : 'Disabled'
           }</Status>
        </VersioningConfiguration>
          `),
        );
      }

      if (req.url.searchParams.has('cors')) {
        return res(
          ctx.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
          </CORSConfiguration>
        `),
        );
      }

      if (req.url.searchParams.has('acl')) {
        return res(
          ctx.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <AccessControlPolicy xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
            <Owner>
              <ID>1234</ID>
              <DisplayName>test</DisplayName>
            </Owner>
            <AccessControlList>
            </AccessControlList>
          </AccessControlPolicy>
        `),
        );
      }

      if (req.url.searchParams.has('object-lock')) {
        return res(
          ctx.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <ObjectLockConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
            <ObjectLockEnabled>Enabled</ObjectLockEnabled>
          </ObjectLockConfiguration>
        `),
        );
      }

      return res(ctx.status(404));
    },
  );
}

export const mockObjectListing = (
  bucketName: string,
  objects = defaultMockedObjects,
) => {
  return rest.get(
    `${zenkoUITestConfig.zenkoEndpoint}/${bucketName}`,
    (req, res, ctx) => {
      return res(
        ctx.xml(`
      <?xml version="1.0" encoding="UTF-8"?>
      <ListVersionsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
        <Name>${bucketName}</Name>
        <MaxKeys>1000</MaxKeys>
        <IsTruncated>false</IsTruncated>
        <Version>
          ${objects
            .map(
              (object) => `
            <Key>${object.Key}</Key>
            <VersionId>${object.VersionId}</VersionId>
            <IsLatest>true</IsLatest>
            <LastModified>2023-06-23T13:00:53.495Z</LastModified>
            <ETag>"799479f36fb1bd94ade2e7f5ef82b08e"</ETag>
            <Size>43028</Size>`,
            )
            .join('')}
        </Version>
        <Owner>
          <ID>1234567890</ID>
          <DisplayName>qwertyu</DisplayName>
        </Owner>
        <StorageClass>STANDARD</StorageClass>
      </ListVersionsResult>
      `),
      );
    },
  );
};

export const mockObjectEmpty = (bucketName: string) => {
  return rest.get(
    `${zenkoUITestConfig.zenkoEndpoint}/${bucketName}`,
    (req, res, ctx) => {
      return res(
        ctx.xml(`
      <?xml version="1.0" encoding="UTF-8"?>
      <ListVersionsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
        <Name>${bucketName}</Name>
        <MaxKeys>1000</MaxKeys>
      </ListVersionsResult>
      `),
      );
    },
  );
};

export const mockGetBucketTagging = (bucketName: string) => {
  return rest.get(
    `${zenkoUITestConfig.zenkoEndpoint}/${bucketName}`,
    (req, res, ctx) => {
      if (req.url.searchParams.has('tagging')) {
        return res(
          ctx.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <Tagging>
            <TagSet>
              <Tag><Key>X-Scality-Usecase</Key><Value>Veeam 12</Value></Tag>
            </TagSet>
          </Tagging>`),
        );
      }
    },
  );
};

export const mockGetBucketTaggingError = (bucketName: string) => {
  return rest.get(
    `${zenkoUITestConfig.zenkoEndpoint}/${bucketName}`,
    (req, res, ctx) => {
      if (req.url.searchParams.has('tagging')) {
        return res(ctx.status(500));
      }
    },
  );
};
