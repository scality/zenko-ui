import BucketList from '../BucketList';
import { List } from 'immutable';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { Row } from '../../../ui-elements/Table';
import { formatShortDate } from '../../../utils';
import { reduxMount } from '../../../utils/test';

describe('BucketList', () => {
    const buckets = List([{
        CreationDate: '2020-04-19T16:15:29+00:00',
        LocationConstraint: 'us-east-1',
        Name: 'bucket1',
    }, {
        CreationDate: '2020-04-19T16:15:29+00:00',
        LocationConstraint: 'us-east-1',
        Name: 'bucket2',
    }]);
    const selectedBucketName = 'bucket2';

    it('should list buckets with the data associated with', () => {
        const { component } = reduxMount(
            <MemoryRouter>
                <BucketList buckets={buckets} locations={{
                    'us-east-1': {
                        isBuiltin: true,
                        locationType: 'location-file-v1',
                        name: 'us-east-1',
                        objectId: '',
                    },
                }} selectedBucketName=""/>
            </MemoryRouter>,
        );
        const rows = component.find(Row);
        const firstRow = rows.first();
        const firstBucketCellLink = firstRow.find('Cell').at(0);
        const firstBucketCellLocation = firstRow.find('Cell').at(1);
        const firstBucketCellDate = firstRow.find('Cell').at(2);
        expect(firstBucketCellLink.text()).toContain('bucket1');
        expect(firstBucketCellLocation.text()).toBe('us-east-1 / Local Filesystem');
        expect(firstBucketCellDate.text()).toBe(formatShortDate(new Date(buckets.get(0).CreationDate)));

        const secondRow = rows.at(1);
        const secondBucketCellLink = secondRow.find('Cell').at(0);
        const secondBucketCellLocation = component.find('Cell').at(1);
        const secondBucketCellDate = component.find('Cell').at(2);
        expect(secondBucketCellLink.text()).toContain('bucket2');
        expect(secondBucketCellLocation.text()).toBe('us-east-1 / Local Filesystem');
        expect(secondBucketCellDate.text()).toBe(formatShortDate(new Date(buckets.get(1).CreationDate)));
    });

    it('should select row if the bucket name specified in the parameter matches one of the bucket names listed', () => {
        const { component } = reduxMount(
            <MemoryRouter>
                <BucketList buckets={buckets} locations={{}} selectedBucketName={selectedBucketName}/>
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
                <BucketList buckets={buckets} locations={{}} selectedBucketName=""/>
            </MemoryRouter>,
        );

        const rows = component.find(Row);
        const firstRow = rows.first();
        expect(firstRow.prop('isSelected')).toBe(false);

        const secondRow = rows.at(1);
        expect(secondRow.prop('isSelected')).toBe(false);
    });
});
