import BucketList from '../BucketList';
import { List } from 'immutable';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { Row } from '../../../ui-elements/Table';
import { formatShortDate } from '../../../utils';
import { reduxMount } from '../../../utils/test';

describe('BucketList', () => {
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

  it('should list buckets with the data associated with', () => {
    const { component } = reduxMount(
      <MemoryRouter>
        <BucketList
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
            },
          }}
          selectedBucketName=""
          ingestionStates={ingestionStates}
        />
      </MemoryRouter>,
    );
    const rows = component.find(Row);
    const firstRow = rows.first();
    const firstBucketCellLink = firstRow.find('Cell').at(0);
    const firstBucketCellLocation = firstRow.find('Cell').at(1);
    const firstBucketCellAsyncNotification = firstRow.find('Cell').at(2);
    const firstBucketCellDate = firstRow.find('Cell').at(3);
    expect(firstBucketCellLink.text()).toContain('bucket1');
    expect(firstBucketCellLocation.text()).toBe('us-east-1 / Local Filesystem');
    expect(firstBucketCellAsyncNotification.text()).toBe('-');
    expect(firstBucketCellDate.text()).toBe(
      formatShortDate(new Date(buckets.get(0).CreationDate)),
    );

    const secondRow = rows.at(1);
    const secondBucketCellLink = secondRow.find('Cell').at(0);
    const secondBucketCellLocation = secondRow.find('Cell').at(1);
    const secondBucketCellAsyncNotification = secondRow.find('Cell').at(2);
    const secondBucketCellDate = secondRow.find('Cell').at(3);
    expect(secondBucketCellLink.text()).toContain('bucket2');
    expect(secondBucketCellLocation.text()).toBe(
      's3c-ring / Scality RING with S3 Connector',
    );
    expect(secondBucketCellAsyncNotification.text()).toBe('Active');
    expect(secondBucketCellDate.text()).toBe(
      formatShortDate(new Date(buckets.get(1).CreationDate)),
    );
  });

  it('should select row if the bucket name specified in the parameter matches one of the bucket names listed', () => {
    const { component } = reduxMount(
      <MemoryRouter>
        <BucketList
          buckets={buckets}
          locations={{}}
          selectedBucketName={selectedBucketName}
        />
      </MemoryRouter>,
    );

    const rows = component.find(Row);
    const firstRow = rows.first();
    expect(firstRow.prop('isSelected')).toBe(false);

    const secondRow = rows.at(1);
    expect(secondRow.prop('isSelected')).toBe(true);
  });

  it('should select no row if there is no bucket name specified in the parameter', () => {
    const { component } = reduxMount(
      <MemoryRouter>
        <BucketList buckets={buckets} locations={{}} selectedBucketName="" />
      </MemoryRouter>,
    );

    const rows = component.find(Row);
    const firstRow = rows.first();
    expect(firstRow.prop('isSelected')).toBe(false);

    const secondRow = rows.at(1);
    expect(secondRow.prop('isSelected')).toBe(false);
  });
});
