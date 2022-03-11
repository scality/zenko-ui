import * as T from '../../../ui-elements/Table';
import Locations from '../Locations';
import React from 'react';
import '@testing-library/jest-dom';
import { mockOffsetSize, reduxRender } from '../../../utils/test';
import { XDM_FEATURE } from '../../../../js/config';
import { screen, prettyDOM, getAllByRole, getByText, getByLabelText } from '@testing-library/react';
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
const nbrOfColumnsExpectedWithoutXDM = 4;

beforeAll(() => {
  mockOffsetSize(200, 800);
});

function expectFirstRow(gridCellOfFirstRow: HTMLElement[], num: number, str: string) { ///Amazon S3/
  expect(getByText(
    gridCellOfFirstRow[num],
    new RegExp( str ),
  )).toBeInTheDocument();
}

function expectButtonNotDisable(buttonOfFirstRow: HTMLElement[], num: number, str: string) {
  expect(getByLabelText(
    buttonOfFirstRow[num],
    new RegExp( str ),
  )).not.toBeDisabled();
}

describe('Locations', () => {
  it.only('should render Locations component alphabetically sorted', () => {
    reduxRender(<Locations />, {
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

    expect(screen.getAllByRole('columnheader').length).toEqual(nbrOfColumnsExpectedWithoutXDM);
    //console.log(prettyDOM(buttonOfFirstRow[1]))
    /*********************************************************/
    const firstRow = screen.getAllByRole('row')[1];
    const gridCellOfFirstRow = getAllByRole(firstRow, 'gridcell');
    const buttonOfFirstRow = getAllByRole(firstRow, 'button');

    expectFirstRow(gridCellOfFirstRow, 0, 'location-aws-s3');
    expectFirstRow(gridCellOfFirstRow, 1, 'Amazon S3');
    expectFirstRow(gridCellOfFirstRow, 2, 'bucketName1');

    expectButtonNotDisable(buttonOfFirstRow, 0, 'Edit Location');
    expectButtonNotDisable(buttonOfFirstRow, 1, 'Delete Location');
    /*********************************************************/
    const secondRow = screen.getAllByRole('row')[2];
    const gridCellOfSecondRow = getAllByRole(secondRow, 'gridcell');
    expect(gridCellOfSecondRow.length).toEqual(nbrOfColumnsExpectedWithoutXDM);

    expectFirstRow(gridCellOfSecondRow, 0, 'location-ceph');
    expectFirstRow(gridCellOfSecondRow, 1, 'Ceph RADOS Gateway');
    expectFirstRow(gridCellOfSecondRow, 2, 'bucketName2');

    const buttonOfSecondtRow = getAllByRole(secondRow, 'button');
    expectButtonNotDisable(buttonOfSecondtRow, 0, 'Edit Location');
    expectButtonNotDisable(buttonOfSecondtRow, 1, 'Delete Location');
    /*********************************************************/
    const thirdRow = screen.getAllByRole('row')[3];
    const gridCellOfThirdRow = getAllByRole(thirdRow, 'gridcell');
    expect(gridCellOfThirdRow.length).toEqual(nbrOfColumnsExpectedWithoutXDM);

    expectFirstRow(gridCellOfThirdRow, 0, 'location-file');
    expectFirstRow(gridCellOfThirdRow, 1, 'Local Filesystem');

    const buttonOfThirdRow = getAllByRole(secondRow, 'button');
    expectButtonNotDisable(buttonOfThirdRow, 0, 'Edit Location');
    expectButtonNotDisable(buttonOfThirdRow, 1, 'Delete Location');
    /*********************************************************/
    const fourthRow = screen.getAllByRole('row')[4];
    const gridCellOfFourthRow = getAllByRole(fourthRow, 'gridcell');
    expect(gridCellOfFourthRow.length).toEqual(nbrOfColumnsExpectedWithoutXDM);

    expectFirstRow(gridCellOfFourthRow, 0, 'location-hd');
    expectFirstRow(gridCellOfFourthRow, 1, 'Storage Service for ARTESCA');

    const buttonOfFourthRow = getAllByRole(secondRow, 'button');
    expectButtonNotDisable(buttonOfFourthRow, 0, 'Edit Location');
    expectButtonNotDisable(buttonOfFourthRow, 1, 'Delete Location');
    /*********************************************************/
    const fifthRow = screen.getAllByRole('row')[5];
    const gridCellOfFifthRow = getAllByRole(fifthRow, 'gridcell');
    expect(gridCellOfFifthRow.length).toEqual(nbrOfColumnsExpectedWithoutXDM);

    expectFirstRow(gridCellOfFifthRow, 0, 'location-nfs');
    expectFirstRow(gridCellOfFifthRow, 1, 'NFS Mount');

    const buttonOfFifthRow = getAllByRole(fifthRow, 'button');
    expectButtonNotDisable(buttonOfFifthRow, 0, 'Edit Location');
    expectButtonNotDisable(buttonOfFifthRow, 1, 'Delete Location');
    /*********************************************************/
    const sixthRow = screen.getAllByRole('row')[6];
    const gridCellOfSixthRow = getAllByRole(sixthRow, 'gridcell');
    expect(gridCellOfSixthRow.length).toEqual(nbrOfColumnsExpectedWithoutXDM);

    expectFirstRow(gridCellOfSixthRow, 0, 'location-ring');
    expectFirstRow(gridCellOfSixthRow, 1, 'Scality RING with S3 Connector');
    expectFirstRow(gridCellOfSixthRow, 2, 'bucketName3');
    console.log(prettyDOM(gridCellOfSixthRow[1]))

    const buttonOfSixthtRow = getAllByRole(sixthRow, 'button');
    expectButtonNotDisable(buttonOfSixthtRow, 0, 'Edit Location');
    expectButtonNotDisable(buttonOfSixthtRow, 1, 'Delete Location');
    /*********************************************************/
    const seventhRow = screen.getAllByRole('row')[7];
    const gridCellOfSeventhRow = getAllByRole(seventhRow, 'gridcell');
    expect(gridCellOfSeventhRow.length).toEqual(nbrOfColumnsExpectedWithoutXDM);

    expectFirstRow(gridCellOfSeventhRow, 0, 'location-sproxyd');
    expectFirstRow(gridCellOfSeventhRow, 1, 'Scality RING with Sproxyd Connector');

    const buttonOfSeventhtRow = getAllByRole(seventhRow, 'button');
    expectButtonNotDisable(buttonOfSeventhtRow, 0, 'Edit Location');
    expectButtonNotDisable(buttonOfSeventhtRow, 1, 'Delete Location');

  });
  it('should disable delete location button if location is being used for replication when XDM feature is disabled', () => {
    const { component } = reduxMount(<Locations />, {
      configuration: {
        latest: {
          locations: {
            'location-aws-s3': locationAwsS3,
          },
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
    const firstRowColumns = firstRow
      .find(T.Cell)
      .map((column) => column.text());
    expect(firstRowColumns.length).toEqual(nbrOfColumnsExpectedWithoutXDM);
    expect(firstRowColumns[0]).toEqual('location-aws-s3');
    expect(firstRowColumns[1]).toEqual('Amazon S3');
    expect(firstRowColumns[2]).toEqual('bucketName1');
    // edit button
    expect(
      firstRow.find(T.Cell).find(T.ActionButton).first().prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      firstRow.find(T.Cell).find(T.ActionButton).at(1).prop('disabled'),
    ).toBeTruthy();
  });
  it('should disable delete location button if location is being used for replication when XDM feature is enabled', () => {
    const { component } = reduxMount(<Locations />, {
      auth: {
        config: {
          features: [XDM_FEATURE],
        },
      },
      configuration: {
        latest: {
          locations: {
            'location-aws-s3': locationAwsS3,
          },
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
    const firstRowColumns = firstRow
      .find(T.Cell)
      .map((column) => column.text());
    expect(firstRowColumns.length).toEqual(nbrOfColumnsExpected);
    expect(firstRowColumns[0]).toEqual('location-aws-s3');
    expect(firstRowColumns[1]).toEqual('Amazon S3');
    expect(firstRowColumns[2]).toEqual('bucketName1');
    // edit button
    expect(
      firstRow.find(T.Cell).find(T.ActionButton).first().prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      firstRow.find(T.Cell).find(T.ActionButton).at(1).prop('disabled'),
    ).toBeTruthy();
  });
  it('should disable delete location button if location is attached to a bucket', () => {
    const { component } = reduxMount(<Locations />, {
      configuration: {
        latest: {
          locations: {
            'location-aws-s3': locationAwsS3,
          },
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
    const firstRowColumns = firstRow
      .find(T.Cell)
      .map((column) => column.text());
    expect(firstRowColumns.length).toEqual(nbrOfColumnsExpectedWithoutXDM);
    expect(firstRowColumns[0]).toEqual('location-aws-s3');
    expect(firstRowColumns[1]).toEqual('Amazon S3');
    expect(firstRowColumns[2]).toEqual('bucketName1');
    // edit button
    expect(
      firstRow.find(T.Cell).find(T.ActionButton).first().prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      firstRow.find(T.Cell).find(T.ActionButton).at(1).prop('disabled'),
    ).toBeTruthy();
  });
  it('should disable delete location button if location is being used for endpoint', () => {
    const { component } = reduxMount(<Locations />, {
      configuration: {
        latest: {
          locations: {
            'location-aws-s3': locationAwsS3,
          },
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
    const firstRowColumns = firstRow
      .find(T.Cell)
      .map((column) => column.text());
    expect(firstRowColumns.length).toEqual(nbrOfColumnsExpectedWithoutXDM);
    expect(firstRowColumns[0]).toEqual('location-aws-s3');
    expect(firstRowColumns[1]).toEqual('Amazon S3');
    expect(firstRowColumns[2]).toEqual('bucketName1');
    // edit button
    expect(
      firstRow.find(T.Cell).find(T.ActionButton).first().prop('disabled'),
    ).toBeFalsy();
    // delete button
    expect(
      firstRow.find(T.Cell).find(T.ActionButton).at(1).prop('disabled'),
    ).toBeTruthy();
  });
});