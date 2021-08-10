import * as s3objects from '../../../../actions/s3object';
import { METADATA_SYSTEM_TYPE, METADATA_USER_TYPE } from '../../../../utils';
import { Item } from '../../../../ui-elements/EditableKeyValue';
import { LIST_OBJECT_VERSIONS_S3_TYPE } from '../../../../utils/s3';
import Metadata from '../Metadata';
import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import React from 'react';
import { reduxMount } from '../../../../utils/test';

describe('Metadata', () => {
    const putObjectMetadataMock = jest.spyOn(s3objects, 'putObjectMetadata').mockReturnValue({ type: '' });
    const optionLabels = ['cache-control', 'content-disposition', 'content-encoding', 'content-type', 'website-redirect-location', 'x-amz-meta', 'content-language', 'expires'];

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Metadata should render', () => {
        const { component } = reduxMount(<Metadata objectMetadata={OBJECT_METADATA}/>);

        expect(component.find(Metadata).isEmptyRender()).toBe(false);
    });

    it('should render by default a SelectBox with empty values in each input when there are no key/value present', () => {
        const { component } = reduxMount(<Metadata objectMetadata={OBJECT_METADATA}/>);

        // check if only one item row is rendered
        const items = component.find(Item);
        expect(items).toHaveLength(1);

        // check if item row values are rendered
        const firstItem = items.first();
        expect(firstItem.find('input[name="mdKeyType"]').prop('value')).toBe('');
        expect(firstItem.find('input.metadata-input-value').prop('value')).toBe('');
    });

    it('should add new key/value metadata and should trigger function if save button is pressed', () => {
        const { component } = reduxMount(<Metadata objectMetadata={OBJECT_METADATA}/>);

        // check if only one item row is rendered
        let items = component.find(Item);
        expect(items).toHaveLength(1);

        // open dropdown menu
        let firstItem = items.first();
        const inputComponent = firstItem.find('input').first();
        inputComponent.simulate('keyDown', { key: 'ArrowDown', keyCode: 40 });

        // check all options are present
        items = component.find(Item);
        firstItem = items.first();
        const optionsComponents = firstItem.find('Option');
        optionsComponents.forEach((optionComponent, index) => {
            expect(optionComponent.find('.sc-select__option').first().text()).toBe(optionLabels[index]);
        });

        // select a key
        const firstOption = optionsComponents.first();
        firstOption.simulate('click');

        // check dropdown menu disappear
        items = component.find(Item);
        firstItem = items.first();
        expect(firstItem.find('Option')).toHaveLength(0);

        // add a value to the key
        firstItem.find('input.metadata-input-value').simulate('change', { target: { value: 'value1' } });

        // click on add button
        firstItem.find('button#addbtn0').simulate('click');

        // check if new item row added
        expect(component.find(Item)).toHaveLength(2);

        // check if function when pressing save button is triggered
        expect(putObjectMetadataMock).toHaveBeenCalledTimes(0);
        component.find('button#metadata-button-save').simulate('click');
        expect(putObjectMetadataMock).toHaveBeenCalledTimes(1);
    });

    it('remove button and add button should be disabled', () => {
        const { component } = reduxMount(<Metadata objectMetadata={OBJECT_METADATA}/>);

        // check if only one item row is rendered
        const items = component.find(Item);
        expect(items).toHaveLength(1);

        // check if item row values are rendered
        const firstItem = items.first();
        expect(firstItem.find('Button#addbtn0').prop('disabled')).toBe(true);
        expect(firstItem.find('Button#delbtn0').prop('disabled')).toBe(true);
    });

    it('should render SelectBox with key/value pass in props', () => {
        const { component } = reduxMount(<Metadata
            objectMetadata={{
                ...OBJECT_METADATA,
                metadata: [{ key: 'CacheControl', value: 'no-cache', type: METADATA_SYSTEM_TYPE }],
            }}/>);

        // check if only one item row is rendered
        const items = component.find(Item);
        expect(items).toHaveLength(1);

        // check if item row values are rendered
        const firstItem = items.first();
        expect(firstItem.find('SelectBox[name="mdKeyType"]').prop('value')).toBe('CacheControl');
        expect(firstItem.find('SelectBox[name="mdKeyType"]').prop('isDisabled')).toBe(false);

        expect(firstItem.find('input.metadata-input-value').prop('value')).toBe('no-cache');
        expect(firstItem.find('input.metadata-input-value').prop('disabled')).toBe(false);

        expect(firstItem.find('Button#addbtn0').prop('disabled')).toBe(false);
        expect(firstItem.find('Button#delbtn0').prop('disabled')).toBe(false);

        expect(component.find('Button#metadata-button-save').prop('disabled')).toBe(false);
    });

    it('should disable inputs and buttons if versioning mode', () => {
        const { component } = reduxMount(<Metadata
            listType={LIST_OBJECT_VERSIONS_S3_TYPE}
            objectMetadata={{
                ...OBJECT_METADATA,
                metadata: [{ key: 'CacheControl', value: 'no-cache', type: METADATA_SYSTEM_TYPE }],
            }}/>);

        // check if only one item row is rendered
        const items = component.find(Item);
        expect(items).toHaveLength(1);

        // check if item row values are rendered
        const firstItem = items.first();
        expect(firstItem.find('SelectBox[name="mdKeyType"]').prop('value')).toBe('CacheControl');
        expect(firstItem.find('SelectBox[name="mdKeyType"]').prop('isDisabled')).toBe(true);

        expect(firstItem.find('input.metadata-input-value').prop('value')).toBe('no-cache');
        expect(firstItem.find('input.metadata-input-value').prop('disabled')).toBe(true);

        expect(firstItem.find('Button#addbtn0').prop('disabled')).toBe(true);
        expect(firstItem.find('Button#delbtn0').prop('disabled')).toBe(true);

        expect(component.find('Button#metadata-button-save').prop('disabled')).toBe(true);
    });

    it('should delete key/value if remove button is pressed', () => {
        const { component } = reduxMount(<Metadata objectMetadata={{
            ...OBJECT_METADATA,
            metadata: [{ key: 'CacheControl', value: 'no-cache', type: METADATA_SYSTEM_TYPE }, {
                key: 'cache-type',
                value: '1',
                type: METADATA_USER_TYPE,
            }],
        }}/>);

        // check if two item rows are rendered
        let items = component.find(Item);
        expect(items).toHaveLength(2);

        // check if first item row values are rendered
        let firstItem = items.first();
        expect(firstItem.find('SelectBox[name="mdKeyType"]').prop('value')).toBe('CacheControl');
        expect(firstItem.find('input.metadata-input-value').prop('value')).toBe('no-cache');

        // check if second item row values are rendered
        let secondItem = items.at(1);
        expect(secondItem.find('SelectBox[name="mdKeyType"]').prop('value')).toBe('x-amz-meta');
        expect(secondItem.find('input.metadata-input-extra-key').prop('value')).toBe('cache-type');
        expect(secondItem.find('input.metadata-input-value').prop('value')).toBe('1');

        // check if first AddButton is hidden and second one is visible
        expect(firstItem.find('Button#addbtn0').prop('isVisible')).toBe(false);
        expect(secondItem.find('Button#addbtn1').prop('isVisible')).toBe(true);

        // check if there is only one key/value left after triggered remove button
        firstItem.find('button#delbtn0').simulate('click');

        // check if only one item row is rendered
        items = component.find(Item);
        expect(items).toHaveLength(1);

        // check if item row values are rendered
        firstItem = items.first();
        expect(firstItem.find('SelectBox[name="mdKeyType"]').prop('value')).toBe('x-amz-meta');
        expect(firstItem.find('input.metadata-input-extra-key').prop('value')).toBe('cache-type');
        expect(firstItem.find('input.metadata-input-value').prop('value')).toBe('1');
    });
});
