import Table, * as T from '../../../../ui-elements/TableKeyValue';
import { formatBytes, formatDate } from '../../../../utils';
import { reduxMount, testTableRow } from '../../../../utils/test';
import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import Properties from '../Properties';
import React from 'react';
import TruncatedText from '../../../../ui-elements/TruncatedText';

function testRow(rowWrapper, { key, value, extraCellComponent }) {
    testTableRow(T, rowWrapper, { key, value, extraCellComponent });
}

describe('Properties', () => {

    it('Tags should render', async () => {
        const { component } = reduxMount(<Properties objectMetadata={OBJECT_METADATA}/>);

        expect(component.find(Properties).isEmptyRender()).toBe(false);
    });

    it('should render Properties component', () => {
        const objectMetadata = OBJECT_METADATA;
        const { component } = reduxMount(<Properties objectMetadata={objectMetadata} />);

        expect(component.find(Table)).toHaveLength(1);

        const rows = component.find(T.Row);
        expect(rows).toHaveLength(5);

        const firstRow = rows.first();
        testRow(firstRow, { key: 'Name', value: objectMetadata.objectKey });

        const secondRow = rows.at(1);
        expect(secondRow.prop('hidden')).toBe(false);
        expect(secondRow.find(T.Key).text()).toContain('Version ID');
        expect(secondRow.find(TruncatedText).text()).toContain(objectMetadata.versionId);
        expect(secondRow.find(T.ExtraCell).find('Clipboard')).toHaveLength(1);

        const thirdRow = rows.at(2);
        expect(thirdRow.prop('hidden')).toBe(false);
        testRow(thirdRow, { key: 'Size', value: formatBytes(objectMetadata.contentLength) });

        const fifthRow = rows.at(3);
        testRow(fifthRow, { key: 'Modified On', value: formatDate(new Date(objectMetadata.lastModified)) });

        const sixthRow = rows.at(4);
        testRow(sixthRow, { key: 'ETag', value: objectMetadata.eTag, extraCellComponent: 'Clipboard' });
    });

    it('should render Properties component with hidden version ID and content length', () => {
        const objectMetadata = { ...OBJECT_METADATA, versionId: undefined, contentLength: undefined };
        const { component } = reduxMount(<Properties objectMetadata={objectMetadata} />);

        expect(component.find(Table)).toHaveLength(1);

        const rows = component.find(T.Row);
        expect(rows).toHaveLength(5);

        const firstRow = rows.first();
        testRow(firstRow, { key: 'Name', value: objectMetadata.objectKey });

        const secondRow = rows.at(1);
        expect(secondRow.prop('hidden')).toBe(true);

        const thirdRow = rows.at(2);
        expect(thirdRow.prop('hidden')).toBe(true);

        const fifthRow = rows.at(3);
        testRow(fifthRow, { key: 'Modified On', value: formatDate(new Date(objectMetadata.lastModified)) });

        const sixthRow = rows.at(4);
        testRow(sixthRow, { key: 'ETag', value: objectMetadata.eTag, extraCellComponent: 'Clipboard' });
    });
});
