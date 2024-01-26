/* eslint-disable */
import {
  addListEntry,
  delListEntry,
  editListEntry,
  themeMount as mount,
} from '../../../utils/testUtil';
import LocationDetailsHyperdriveV2 from '../LocationDetailsHyperdriveV2';
import React from 'react';
const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsHyperdriveV2 />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    //@ts-expect-error fix this when you are working on it
    mount(<LocationDetailsHyperdriveV2 {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      bootstrapList: [''],
    });
  });
  it('should call onChange on state update', () => {
    const refLocation = {
      bootstrapList: ['localhost:83'],
    };
    const onChangeFn = jest.fn();
    const component = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsHyperdriveV2 {...props} onChange={onChangeFn} />,
    );
    component
      .find(LocationDetailsHyperdriveV2)
      .setState({ ...refLocation }, () => {
        expect(onChangeFn).toHaveBeenCalledWith(refLocation);
      });
  });
  it('should show empty bootstrap list', () => {
    //@ts-expect-error fix this when you are working on it
    const component = mount(<LocationDetailsHyperdriveV2 {...props} />);
    expect(component.find('InputList').props().values).toEqual(['']);
  });
  it('should show three items in the bootstrap list', () => {
    const locationDetails = {
      bootstrapList: ['localhost:83', 'localhost:84', 'localhost:85'],
    };
    const component = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsHyperdriveV2 {...props} details={locationDetails} />,
    );
    expect(component.find('InputList').props().values).toEqual([
      'localhost:83',
      'localhost:84',
      'localhost:85',
    ]);
  });
  it('should disable add button if ten items in the bootstrap list', () => {
    const bootstrapList = [
      'localhost:80',
      'localhost:81',
      'localhost:82',
      'localhost:83',
      'localhost:84',
      'localhost:85',
      'localhost:86',
      'localhost:87',
      'localhost:88',
      'localhost:89',
    ];
    const locationDetails = {
      bootstrapList,
    };
    const component = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsHyperdriveV2 {...props} details={locationDetails} />,
    );
    expect(component.find('button[name="addbtn1"]').props().disabled).toEqual(
      true,
    );
  });
  it('should add entry and save hyperdrive location details', () => {
    const refLocation = {
      bootstrapList: ['localhost:83', ''],
    };
    let location = {
      bootstrapList: ['localhost:83'],
    };
    const component = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsHyperdriveV2
        {...props}
        details={location}
        //@ts-expect-error fix this when you are working on it
        onChange={(l) => (location = l)}
      />,
    );
    addListEntry(component);
    expect(location).toEqual(refLocation);
  });
  it('should edit entry and save hyperdrive location details', () => {
    const refLocation = {
      bootstrapList: ['localhost:83'],
    };
    let location = {
      bootstrapList: [''],
    };
    const component = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsHyperdriveV2
        {...props}
        details={location}
        //@ts-expect-error fix this when you are working on it
        onChange={(l) => (location = l)}
      />,
    );
    editListEntry(component, 'localhost:83', 0);
    expect(location).toEqual(refLocation);
  });
  it('should delete entry and save hyperdrive location details', () => {
    const refLocation = {
      bootstrapList: ['localhost:84'],
    };
    let location = {
      bootstrapList: ['locahost:83', 'localhost:84'],
    };
    const component = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsHyperdriveV2
        {...props}
        details={location}
        //@ts-expect-error fix this when you are working on it
        onChange={(l) => (location = l)}
      />,
    );
    delListEntry(component, 0);
    expect(location).toEqual(refLocation);
  });
});
