import * as s3objects from '../../../../actions/s3object';
import { Item } from '../../../../ui-elements/EditableKeyValue';
import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import React from 'react';
import Tags from '../Tags';
import { reduxMount } from '../../../../utils/test';

describe('Tags', () => {
    const putObjectTaggingMock = jest.spyOn(s3objects, 'putObjectTagging').mockReturnValue({ type: '' });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Tags should render', async () => {
        const { component } = reduxMount(<Tags objectMetadata={OBJECT_METADATA}/>);

        expect(component.find(Tags).isEmptyRender()).toBe(false);
    });

    it('should render by default an Item with empty values in each input when there are no key/value present', () => {
        const { component } = reduxMount(<Tags objectMetadata={OBJECT_METADATA}/>);

        // check if only one item row is rendered
        const items = component.find(Item);
        expect(items).toHaveLength(1);

        // check if item row values are rendered
        const firstItem = items.first();
        expect(firstItem.find('input.tags-input-key').prop('value')).toBe('');
        expect(firstItem.find('input.tags-input-value').prop('value')).toBe('');
    });

    it('should add new key/value tag and should trigger function if save button is pressed', () => {
        const { component } = reduxMount(<Tags objectMetadata={OBJECT_METADATA}/>);

        // check if only one item row is rendered
        let items = component.find(Item);
        expect(items).toHaveLength(1);

        // fill input key and input value
        const firstItem = items.first();
        firstItem.find('input.tags-input-key').simulate('change', { target: { name: 'key', value: 'key1' } });
        firstItem.find('input.tags-input-value').simulate('change', {
            target: {
                name: 'value',
                value: 'value1',
            },
        });

        // click on add button
        firstItem.find('button#addbtn0').simulate('click');

        // check if new item row added
        items = component.find(Item);
        expect(items).toHaveLength(2);

        // check if function when pressing save button is triggered
        expect(putObjectTaggingMock).toHaveBeenCalledTimes(0);
        component.find('button#tags-button-save').simulate('click');
        expect(putObjectTaggingMock).toHaveBeenCalledTimes(1);
    });

    it('remove button and add button should be disabled', () => {
        const { component } = reduxMount(<Tags objectMetadata={OBJECT_METADATA}/>);

        // check if only one item row is rendered
        const items = component.find(Item);
        expect(items).toHaveLength(1);

        // check if item row values are rendered
        const firstItem = items.first();
        expect(firstItem.find('button#addbtn0').prop('disabled')).toBe(true);
        expect(firstItem.find('button#delbtn0').prop('disabled')).toBe(true);
    });

    it('should render an Item with key/value pass in props', () => {
        const { component } = reduxMount(<Tags
            objectMetadata={{ ...OBJECT_METADATA, tags: [{ key: 'key1', value: 'value1' }] }}/>);

        // check if only one item row is rendered
        const items = component.find(Item);
        expect(items).toHaveLength(1);

        // check if item row values are rendered
        const firstItem = items.first();
        expect(firstItem.find('input.tags-input-key').prop('value')).toBe('key1');
        expect(firstItem.find('input.tags-input-value').prop('value')).toBe('value1');
    });

    it('should delete key/value if remove button is pressed', () => {
        const { component } = reduxMount(<Tags objectMetadata={{
            ...OBJECT_METADATA,
            tags: [{ key: 'key1', value: 'value1' }, { key: 'key2', value: 'value2' }],
        }}/>);

        // check if two item rows are rendered
        let items = component.find(Item);
        expect(items).toHaveLength(2);

        // check if first item row values are rendered
        let firstItem = items.first();
        expect(firstItem.find('input.tags-input-key').prop('value')).toBe('key1');
        expect(firstItem.find('input.tags-input-value').prop('value')).toBe('value1');

        // check if second item row values are rendered
        let secondItem = items.at(1);
        expect(secondItem.find('input.tags-input-key').prop('value')).toBe('key2');
        expect(secondItem.find('input.tags-input-value').prop('value')).toBe('value2');

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
        expect(firstItem.find('input.tags-input-key').prop('value')).toBe('key2');
        expect(firstItem.find('input.tags-input-value').prop('value')).toBe('value2');
    });
});
