import * as s3object from '../../../actions/s3object';
import { FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT } from './utils/testUtil';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import { List } from 'immutable';
import ObjectList from '../ObjectList';
import React from 'react';
import { reduxMount } from '../../../utils/test';

describe('ObjectList', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render ObjectList with no object', () => {
        const { component } = reduxMount(<ObjectList objects={List()} bucketName={BUCKET_NAME} prefixWithSlash=''
            toggled={List()}/>,
        );

        expect(component.find('Row')).toHaveLength(0);
    });

    it('should render ObjectList with objects', () => {
        const { component } = reduxMount(<ObjectList objects={List([FIRST_FORMATTED_OBJECT])} bucketName={BUCKET_NAME}
            prefixWithSlash='' toggled={List()}/>,
        );

        const rows = component.find('Row');
        expect(rows).toHaveLength(1);
        const cells = rows.find('td').children();
        expect(cells.at(0).find('input').prop('checked')).toBe(false);
        expect(cells.at(1).prop('value')).toBe('object1');
        expect(cells.at(2).prop('value')).toBe('Wed Oct 17 2020 10:35:57');
        expect(cells.at(3).prop('value')).toBe('213 Bytes');
    });

    it('should call openObjectUploadModal by clicking on upload button', () => {
        const openObjectUploadModalSpy = jest.spyOn(s3object, 'openObjectUploadModal');

        const { component } = reduxMount(<ObjectList objects={List([FIRST_FORMATTED_OBJECT])} bucketName={BUCKET_NAME}
            prefixWithSlash='' toggled={List()}/>,
        );

        component.find('Button#object-list-upload-button').simulate('click');
        expect(openObjectUploadModalSpy).toHaveBeenCalledTimes(1);
    });

    it('should call openFolderCreateModal by clicking on createFolder button', () => {
        const openFolderCreateModalSpy = jest.spyOn(s3object, 'openFolderCreateModal');

        const { component } = reduxMount(<ObjectList objects={List([FIRST_FORMATTED_OBJECT])} bucketName={BUCKET_NAME}
            prefixWithSlash='' toggled={List()}/>,
        );

        component.find('Button#object-list-create-folder-button').simulate('click');
        expect(openFolderCreateModalSpy).toHaveBeenCalledTimes(1);
    });

    it('Delete button should be disable if no object has been toggled', () => {
        const { component } = reduxMount(<ObjectList objects={List([FIRST_FORMATTED_OBJECT])} bucketName={BUCKET_NAME}
            prefixWithSlash='' toggled={List()}/>,
        );

        expect(component.find('Button#object-list-delete-button').prop('disabled')).toBe(true);
    });

    it('Delete button should be enable and should call openObjectDeleteModal when is pressed', () => {
        const openObjectDeleteModalSpy = jest.spyOn(s3object, 'openObjectDeleteModal');

        const { component } = reduxMount(<ObjectList objects={List([FIRST_FORMATTED_OBJECT])} bucketName={BUCKET_NAME}
            prefixWithSlash='' toggled={List([FIRST_FORMATTED_OBJECT])}/>,
        );

        const deleteButton = component.find('Button#object-list-delete-button');
        expect(deleteButton.prop('disabled')).toBe(false);
        deleteButton.simulate('click');
        expect(openObjectDeleteModalSpy).toHaveBeenCalledTimes(1);
    });

    it('should select all objects when ticking checkbox square', () => {
        const toggleAllObjectsSpy = jest.spyOn(s3object, 'toggleAllObjects');

        const { component } = reduxMount(<ObjectList objects={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}
            bucketName={BUCKET_NAME} prefixWithSlash='' toggled={List()}/>,
        );

        const toggleAllObjectsButton = component.find('th#object-list-table-head-checkbox > input');
        toggleAllObjectsButton.simulate('change');
        expect(toggleAllObjectsSpy).toHaveBeenCalledTimes(1);
    });

    it('one object should be selected and the other one not and should render all the details of each objects', () => {
        const { component } = reduxMount(<ObjectList objects={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}
            bucketName={BUCKET_NAME} prefixWithSlash='' toggled={List()}/>,
        );

        const rows = component.find('Row');
        expect(rows).toHaveLength(2);
        rows.forEach((row, index) => {
            const cells = row.find('td').children();
            expect(cells.at(0).find('input').prop('checked')).toBe(index !== 0);
            expect(cells.at(1).prop('value')).toBe(index === 0 ? 'object1': 'object2');
            expect(cells.at(2).prop('value')).toBe(index === 0 ? 'Wed Oct 17 2020 10:35:57': 'Wed Oct 17 2020 16:35:57');
            expect(cells.at(3).prop('value')).toBe(index === 0 ? '213 Bytes' : '120.33 KB');
        });
    });
});
