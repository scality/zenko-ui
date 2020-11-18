import * as zenkoActions from '../../../actions/zenko';
import { Hint, Hints, HintsTitle } from '../../../ui-elements/Input';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import { METADATA_SEARCH_HINT_ITEMS } from '../../../../consts';
import MetadataSearch from '../MetadataSearch';
import React from 'react';
import { STRING_METADATA_SEARCH_HINT_TITLE } from '../../../../consts/strings';
import { SearchButton } from '../../../ui-elements/Table';
import { reduxMount } from '../../../utils/test';

describe('Metadata Search', () => {
    const newSearchListingMock = jest.spyOn(zenkoActions, 'newSearchListing');

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render MetadataSearch component', () => {
        const { component } = reduxMount(<MetadataSearch isMetadataType={false} bucketName={BUCKET_NAME}
            prefixWithSlash='' errorZenkoMsg={null}/>);

        expect(component.find(MetadataSearch).isEmptyRender()).toBe(false);
    });

    it('should render search button disabled by default', () => {
        const { component } = reduxMount(<MetadataSearch isMetadataType={false} bucketName={BUCKET_NAME}
            prefixWithSlash='' errorZenkoMsg={null}/>);

        const button = component.find(SearchButton);
        expect(button).toHaveLength(1);
        expect(button.prop('disabled')).toBe(true);
    });

    it('should render dropdown menu correctly', () => {
        const { component } = reduxMount(<MetadataSearch isMetadataType={false} bucketName={BUCKET_NAME}
            prefixWithSlash='' errorZenkoMsg={null}/>);

        const input = component.find('input');
        expect(input).toHaveLength(1);

        // check <Hint> are not rendered yet
        expect(component.find(Hints)).toHaveLength(0);

        // open dropdown menu
        input.simulate('click');

        // check <HintTitle> and <Hint> items are now rendered
        expect(component.find(Hints)).toHaveLength(1);
        expect(component.find(HintsTitle)).toHaveLength(1);
        expect(component.find(HintsTitle).text()).toBe(STRING_METADATA_SEARCH_HINT_TITLE);

        // check description of each <Hint> item
        const hintsItems = component.find(Hint);
        expect(hintsItems).toHaveLength(8);
        METADATA_SEARCH_HINT_ITEMS.map((h, index) => expect(hintsItems.at(index).text()).toBe(` ${h.descr} `));
    });

    it('should render the right item and the right text in the input bar; button should also be clickable and call newSearchListing function', () => {
        const { component } = reduxMount(<MetadataSearch isMetadataType={false} bucketName={BUCKET_NAME}
            prefixWithSlash='' errorZenkoMsg={null}/>);

        // open dropdown menu
        let input = component.find('input');
        input.simulate('click');

        // check input value is empty
        expect(input.prop('value')).toBe('');

        // pick first <Hint> item
        const firstItem = component.find(Hint).first();
        firstItem.simulate('click');

        // check dropdown menu disappear
        expect(component.find(Hints)).toHaveLength(0);

        // check input value is the first item we choose
        input = component.find('input');
        expect(input.prop('value')).toBe(METADATA_SEARCH_HINT_ITEMS[0].q);

        // check if button is now clickable
        const button = component.find(SearchButton);
        expect(button).toHaveLength(1);
        expect(button.prop('disabled')).toBe(false);

        // check if newSearchListingMock is called when submitting form
        expect(newSearchListingMock).toHaveBeenCalledTimes(0);
        button.simulate('submit');
        expect(newSearchListingMock).toHaveBeenCalledTimes(1);
    });
});
