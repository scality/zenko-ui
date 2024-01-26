import { List } from 'immutable';
import { MemoryRouter } from 'react-router-dom';
import { XDM_FEATURE } from '../../../../js/config';
import { formatShortDate } from '../../../utils';
import { mockOffsetSize, reduxRender } from '../../../utils/testUtil';
import BucketList from '../BucketList';

describe.skip('BucketList', () => {
  beforeAll(() => {
    mockOffsetSize(200, 800);
  });

  const buckets = List([
    {
      CreationDate: '2020-04-19T16:15:29+00:00',
      LocationConstraint: 'us-east-1',
      Name: 'bucket1',
    },
    {
      CreationDate: '2020-04-19T16:15:29+00:00',
      LocationConstraint: 's3c-ring',
      Name: 'bucket2',
    },
  ]);
  const selectedBucketName = 'bucket2';
  const ingestionStates = {
    's3c-ring': 'enabled',
  };
  it('should list buckets with the data associated when XDM feature is enabled', () => {
    const { component } = reduxRender(
      <MemoryRouter>
        <BucketList
          //@ts-expect-error fix this when you are working on it
          buckets={buckets}
          locations={{
            'us-east-1': {
              isBuiltin: true,
              locationType: 'location-file-v1',
              name: 'us-east-1',
              objectId: '',
            },
            's3c-ring': {
              isBuiltin: false,
              locationType: 'location-scality-ring-s3-v1',
              name: 's3c-ring',
              objectId: '',
              details: {
                endpoint: 'https://s3.scality.com',
              },
            },
          }}
          selectedBucketName=""
          //@ts-expect-error fix this when you are working on it
          ingestionStates={ingestionStates}
        />
      </MemoryRouter>,
      {
        auth: {
          config: {
            features: [XDM_FEATURE],
          },
        },
      },
    );

    const rows = component
      .getAllByRole('rowgroup')[1]
      .getElementsByClassName('tr');

    const firstRow = rows[0];
    const firstRowCells = firstRow.getElementsByClassName('td');
    const firstBucketCellLink = firstRowCells[0];
    const firstBucketCellLocation = firstRowCells[1];
    const firstBucketCellAsyncNotification = firstRowCells[2];
    const firstBucketCellDate = firstRowCells[3];
    expect(firstBucketCellLink.textContent).toContain('bucket1');
    expect(firstBucketCellLocation.textContent).toBe(
      'us-east-1 / Local Filesystem',
    );
    expect(firstBucketCellAsyncNotification.textContent).toBe('-');
    expect(firstBucketCellDate.textContent).toBe(
      formatShortDate(new Date(buckets.get(0).CreationDate)),
    );
    const secondRow = rows[1];
    const secondRowCells = secondRow.getElementsByClassName('td');
    const secondBucketCellLink = secondRowCells[0];
    const secondBucketCellLocation = secondRowCells[1];
    const secondBucketCellAsyncNotification = secondRowCells[2];
    const secondBucketCellDate = secondRowCells[3];
    expect(secondBucketCellLink.textContent).toContain('bucket2');
    expect(secondBucketCellLocation.textContent).toBe(
      's3c-ring / Scality RING with S3 Connector',
    );
    expect(secondBucketCellAsyncNotification.textContent).toBe('Active');
    expect(secondBucketCellDate.textContent).toBe(
      formatShortDate(new Date(buckets.get(1).CreationDate)),
    );
  });
  it('should list buckets with the data associated when XDM feature is disabled', () => {
    const { component } = reduxRender(
      <MemoryRouter>
        <BucketList
          //@ts-expect-error fix this when you are working on it
          buckets={buckets}
          locations={{
            'us-east-1': {
              isBuiltin: true,
              locationType: 'location-file-v1',
              name: 'us-east-1',
              objectId: '',
            },
            's3c-ring': {
              isBuiltin: false,
              locationType: 'location-scality-ring-s3-v1',
              name: 's3c-ring',
              objectId: '',
              details: {
                endpoint: 'https://s3.scality.com',
              },
            },
          }}
          selectedBucketName=""
          ingestionStates={{}}
        />
      </MemoryRouter>,
      {},
    );

    const rows = component
      .getAllByRole('rowgroup')[1]
      .getElementsByClassName('tr');

    const firstRow = rows[0];
    const firstRowCells = firstRow.getElementsByClassName('td');
    const firstBucketCellLink = firstRowCells[0];
    const firstBucketCellLocation = firstRowCells[1];
    const firstBucketCellDate = firstRowCells[2];
    expect(firstBucketCellLink.textContent).toContain('bucket1');
    expect(firstBucketCellLocation.textContent).toBe(
      'us-east-1 / Local Filesystem',
    );
    expect(firstBucketCellDate.textContent).toBe(
      formatShortDate(new Date(buckets.get(0).CreationDate)),
    );
    const secondRow = rows[1];
    const secondRowCells = secondRow.getElementsByClassName('td');
    const secondBucketCellLink = secondRowCells[0];
    const secondBucketCellLocation = secondRowCells[1];
    const secondBucketCellDate = secondRowCells[2];
    expect(secondBucketCellLink.textContent).toContain('bucket2');
    expect(secondBucketCellLocation.textContent).toBe(
      's3c-ring / Scality RING with S3 Connector',
    );
    expect(secondBucketCellDate.textContent).toBe(
      formatShortDate(new Date(buckets.get(1).CreationDate)),
    );
  });
  it('should select row if the bucket name specified in the parameter matches one of the bucket names listed', () => {
    const { component } = reduxRender(
      <MemoryRouter>
        <BucketList
          //@ts-expect-error fix this when you are working on it
          buckets={buckets}
          locations={{}}
          selectedBucketName={selectedBucketName}
        />
      </MemoryRouter>,
      {},
    );

    const rows = component
      .getAllByRole('rowgroup')[1]
      .getElementsByClassName('tr');

    const firstRow = rows[0];
    expect(firstRow).toHaveAttribute('aria-selected', 'false');
    const secondRow = rows[1];
    expect(secondRow).toHaveAttribute('aria-selected', 'true');
  });

  it('should select no row if there is no bucket name specified in the parameter', () => {
    const { component } = reduxRender(
      <MemoryRouter>
        <BucketList
          //@ts-expect-error fix this when you are working on it
          buckets={buckets}
          locations={{}}
          selectedBucketName=""
        />
      </MemoryRouter>,
      {},
    );

    const rows = component
      .getAllByRole('rowgroup')[1]
      .getElementsByClassName('tr');

    const firstRow = rows[0];
    expect(firstRow).toHaveAttribute('aria-selected', 'false');
    const secondRow = rows[1];
    expect(secondRow).toHaveAttribute('aria-selected', 'false');
  });
});
