import { Hint, Hints, HintsTitle } from '../../../ui-elements/Input';
import MetadataSearch, { METADATA_SEARCH_HINT_ITEMS } from '../MetadataSearch';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import React from 'react';
import { SearchButton } from '../../../ui-elements/Table';
import { reduxMount } from '../../../utils/testUtil';
import router from 'react-router';
import * as redux from 'react-redux';
describe('Metadata Search', () => {
  const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
  const mockDispatchFn = jest.fn();
  useDispatchSpy.mockReturnValue(mockDispatchFn);
  beforeAll(() => {
    jest.spyOn(router, 'useLocation').mockReturnValue({
      pathname: `/buckets/${BUCKET_NAME}/objects`,
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should render MetadataSearch component', () => {
    const { component } = reduxMount(
      <MetadataSearch isMetadataType={false} errorZenkoMsg={null} />,
    );
    expect(component.find(MetadataSearch).isEmptyRender()).toBe(false);
  });
  it('should render search button disabled by default', () => {
    const { component } = reduxMount(
      <MetadataSearch isMetadataType={false} errorZenkoMsg={null} />,
    );
    const button = component.find(SearchButton);
    expect(button).toHaveLength(1);
    expect(button.prop('disabled')).toBe(true);
  });
  it('should render dropdown menu correctly', () => {
    const { component } = reduxMount(
      <MetadataSearch isMetadataType={false} errorZenkoMsg={null} />,
    );
    const input = component.find('input');
    expect(input).toHaveLength(1);
    // check <Hint> are not rendered yet
    expect(component.find(Hints)).toHaveLength(0);
    // open dropdown menu
    input.simulate('click');
    // check <HintTitle> and <Hint> items are now rendered
    expect(component.find(Hints)).toHaveLength(1);
    expect(component.find(HintsTitle)).toHaveLength(1);
    expect(component.find(HintsTitle).text()).toContain('Suggestions');
    // check description of each <Hint> item
    const hintsItems = component.find(Hint);
    expect(hintsItems).toHaveLength(8);
    METADATA_SEARCH_HINT_ITEMS.map((h, index) =>
      expect(hintsItems.at(index).text()).toContain(h.descr),
    );
  });
  it('should render the right item and the right text in the input bar; button should also be clickable and call newSearchListing function', () => {
    const { component } = reduxMount(
      <MetadataSearch isMetadataType={false} errorZenkoMsg={null} />,
    );
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
    // check the dispatch action is with the correct URL
    button.simulate('submit');
    const expectedAction = {
      payload: {
        args: [
          `/buckets/${BUCKET_NAME}/objects?metadatasearch=key+like+%2Fpdf%24%2F`,
        ],
        method: 'push',
      },
      type: '@@router/CALL_HISTORY_METHOD',
    };
    expect(mockDispatchFn).toHaveBeenCalledWith(expectedAction);
  });
});
