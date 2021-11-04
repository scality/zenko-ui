import * as T from '../../../ui-elements/Table';
import Locations from '../Locations';
import React from 'react';
import { reduxMount } from '../../../utils/test';

const locationFile = {
  details: {
    bootstrapList: [],
  },
  locationType: 'location-file-v1',
  name: 'location-file',
  objectId: '0',
  isBuiltin: true,
};

const locationAwsS3 = {
  details: {
    accessKey: 'accessKey1',
    bootstrapList: [],
    bucketMatch: true,
    bucketName: 'bucketName1',
    endpoint: 'http://aws.com',
    secretKey: 'secret',
  },
  locationType: 'location-aws-s3-v1',
  name: 'location-aws-s3',
  objectId: '1',
  sizeLimitGB: 123,
};

const locationCeph = {
  details: {
    accessKey: 'accessKey2',
    bootstrapList: [],
    bucketMatch: true,
    bucketName: 'bucketName2',
    endpoint: 'http://ceph.com',
    secretKey: 'secret',
  },
  locationType: 'location-ceph-radosgw-s3-v1',
  name: 'location-ceph',
  objectId: '2',
  sizeLimitGB: 123,
};

const locationNFS = {
  details: {
    bootstrapList: [],
    endpoint: 'tcp+v3://sever/coco?rw',
  },
  locationType: 'location-nfs-mount-v1',
  name: 'location-nfs',
  objectId: '3',
};

const locationHD = {
  details: {
    bootstrapList: ['localhost:123', 'localhost:456'],
  },
  locationType: 'location-scality-hdclient-v2',
  name: 'location-hd',
  objectId: '4',
};

const locationRing = {
  details: {
    accessKey: 'accessKey3',
    bootstrapList: [],
    bucketMatch: true,
    bucketName: 'bucketName3',
    endpoint: 'http://coco.com',
    secretKey: 'secret',
  },
  locationType: 'location-scality-ring-s3-v1',
  name: 'location-ring',
  objectId: '5',
  sizeLimitGB: 123,
};

const locationSproxyd = {
  details: {
    bootstrapList: ['localhost:123', 'localhost:456'],
    chordCos: 3,
    proxyPath: '/proxy/path/',
  },
  locationType: 'location-scality-sproxyd-v1',
  name: 'location-sproxyd',
  objectId: '6',
};

const locations = {
  'location-file': locationFile,
  'location-aws-s3': locationAwsS3,
  'location-ceph': locationCeph,
  'location-nfs': locationNFS,
  'location-hd': locationHD,
  'location-ring': locationRing,
  'location-sproxyd': locationSproxyd,
};

const nbrOfColumnsExpected = 5;

describe('Locations', () => {
  it('should render Locations component alphabetically sorted', () => {
    const { component } = reduxMount(<Locations />, {
      configuration: {
        latest: {
          locations,
          endpoints: [],
        },
      },
      workflow: {
        replications: [],
      },
    });

    expect(component.find('div#location-list')).toHaveLength(1);
    const rows = component.find(T.Row);
    expect(rows).toHaveLength(7);

    const firstRow = rows.first();
    const firstRowColumns = firstRow.find(T.Cell).map(column => column.text());
    expect(firstRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(firstRowColumns[0]).toEqual('location-aws-s3');
    expect(firstRowColumns[1]).toEqual('Amazon S3');
    expect(firstRowColumns[2]).toEqual('bucketName1');
    // edit button
    expect(
      firstRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      firstRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeFalsy();

    const secondRow = rows.at(1);
    const secondRowColumns = secondRow
      .find(T.Cell)
      .map(column => column.text());
    expect(secondRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(secondRowColumns[0]).toEqual('location-ceph');
    expect(secondRowColumns[1]).toEqual('Ceph RADOS Gateway');
    expect(secondRowColumns[2]).toEqual('bucketName2');
    // edit button
    expect(
      secondRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      secondRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeFalsy();

    const thirdRow = rows.at(2);
    const thirdRowColumns = thirdRow.find(T.Cell).map(column => column.text());
    expect(thirdRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(thirdRowColumns[0]).toEqual('location-file');
    expect(thirdRowColumns[1]).toEqual('Local Filesystem');
    expect(thirdRowColumns[2]).toEqual('');
    // edit button
    expect(
      thirdRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeTruthy();
    // delete button
    expect(
      thirdRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeTruthy();

    const fourthRow = rows.at(3);
    const fourthRowColumns = fourthRow
      .find(T.Cell)
      .map(column => column.text());
    expect(fourthRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(fourthRowColumns[0]).toEqual('location-hd');
    expect(fourthRowColumns[1]).toEqual('Storage Service for ARTESCA');
    expect(fourthRowColumns[2]).toEqual('');
    // edit button
    expect(
      fourthRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      fourthRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeFalsy();

    const fifthRow = rows.at(4);
    const fifthRowColumns = fifthRow.find(T.Cell).map(column => column.text());
    expect(fifthRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(fifthRowColumns[0]).toEqual('location-nfs');
    expect(fifthRowColumns[1]).toEqual('NFS Mount');
    expect(fifthRowColumns[2]).toEqual('');
    // edit button
    expect(
      fifthRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      fifthRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeFalsy();

    const sixthRow = rows.at(5);
    const sixthRowColumns = sixthRow.find(T.Cell).map(column => column.text());
    expect(sixthRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(sixthRowColumns[0]).toEqual('location-ring');
    expect(sixthRowColumns[1]).toEqual('Scality RING with S3 Connector');
    expect(sixthRowColumns[2]).toEqual('bucketName3');
    // edit button
    expect(
      sixthRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      sixthRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeFalsy();

    const seventhRow = rows.at(6);
    const seventhRowColumns = seventhRow
      .find(T.Cell)
      .map(column => column.text());
    expect(seventhRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(seventhRowColumns[0]).toEqual('location-sproxyd');
    expect(seventhRowColumns[1]).toEqual('Scality RING with Sproxyd Connector');
    expect(seventhRowColumns[2]).toEqual('');
    // edit button
    expect(
      seventhRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      seventhRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeFalsy();
  });

  it('should disable delete location button if location is being used for replication', () => {
    const { component } = reduxMount(<Locations />, {
      configuration: {
        latest: {
          locations: { 'location-aws-s3': locationAwsS3 },
          endpoints: [],
        },
      },
      workflow: {
        replications: [
          {
            destination: {
              locations: [
                {
                  name: 'location-aws-s3',
                },
              ],
            },
          },
        ],
      },
    });

    expect(component.find('div#location-list')).toHaveLength(1);
    const rows = component.find(T.Row);
    expect(rows).toHaveLength(1);

    const firstRow = rows.first();
    const firstRowColumns = firstRow.find(T.Cell).map(column => column.text());
    expect(firstRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(firstRowColumns[0]).toEqual('location-aws-s3');
    expect(firstRowColumns[1]).toEqual('Amazon S3');
    expect(firstRowColumns[2]).toEqual('bucketName1');
    // edit button
    expect(
      firstRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      firstRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeTruthy();
  });

  it('should disable delete location button if location is attached to a bucket', () => {
    const { component } = reduxMount(<Locations />, {
      configuration: {
        latest: {
          locations: { 'location-aws-s3': locationAwsS3 },
          endpoints: [],
        },
      },
      stats: {
        bucketList: [
          {
            name: 'bucket1',
            location: 'location-aws-s3',
          },
        ],
      },
      workflow: {
        replications: [],
      },
    });

    expect(component.find('div#location-list')).toHaveLength(1);
    const rows = component.find(T.Row);
    expect(rows).toHaveLength(1);

    const firstRow = rows.first();
    const firstRowColumns = firstRow.find(T.Cell).map(column => column.text());
    expect(firstRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(firstRowColumns[0]).toEqual('location-aws-s3');
    expect(firstRowColumns[1]).toEqual('Amazon S3');
    expect(firstRowColumns[2]).toEqual('bucketName1');
    // edit button
    expect(
      firstRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      firstRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeTruthy();
  });

  it('should disable delete location button if location is being used for endpoint', () => {
    const { component } = reduxMount(<Locations />, {
      configuration: {
        latest: {
          locations: { 'location-aws-s3': locationAwsS3 },
          endpoints: [
            {
              hostname: 'host1',
              locationName: 'location-aws-s3',
            },
          ],
        },
      },
      workflow: {
        replications: [],
      },
    });

    expect(component.find('div#location-list')).toHaveLength(1);
    const rows = component.find(T.Row);
    expect(rows).toHaveLength(1);

    const firstRow = rows.first();
    const firstRowColumns = firstRow.find(T.Cell).map(column => column.text());
    expect(firstRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(firstRowColumns[0]).toEqual('location-aws-s3');
    expect(firstRowColumns[1]).toEqual('Amazon S3');
    expect(firstRowColumns[2]).toEqual('bucketName1');
    // edit button
    expect(
      firstRow
        .find(T.Cell)
        .find(T.ActionButton)
        .first()
        .prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      firstRow
        .find(T.Cell)
        .find(T.ActionButton)
        .at(1)
        .prop('disabled'),
    ).toBeTruthy();
  });
});
