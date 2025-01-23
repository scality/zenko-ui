/* eslint-disable */
import {
  addListEntry,
  delListEntry,
  editListEntry,
  themeMount as mount,
} from '../../../utils/testUtil';
import LocationDetailsHyperdriveV2 from '../LocationDetailsHyperdriveV2';
import React from 'react';
import userEvent from '@testing-library/user-event';

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

  it('should call onChange on state update', async () => {
    const refLocation = {
      bootstrapList: ['localhost:83'],
    };
    const onChangeFn = jest.fn();
    const component = mount(
      // @ts-expect-error
      <LocationDetailsHyperdriveV2 {...props} onChange={onChangeFn} />,
    );

    const input = component.getByRole('textbox', { name: /bootstrap list/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'localhost:83');

    expect(onChangeFn).toHaveBeenCalledWith(refLocation);
  });

  it('should show empty bootstrap list', () => {
    //@ts-expect-error fix this when you are working on it
    const component = mount(<LocationDetailsHyperdriveV2 {...props} />);
    const input = component.getByRole('textbox', { name: /bootstrap list/i });
    expect(input).toHaveValue('');
  });

  it('should show three items in the bootstrap list', () => {
    const locationDetails = {
      bootstrapList: ['localhost:83', 'localhost:84', 'localhost:85'],
    };
    const component = mount(
      // @ts-expect-error
      <LocationDetailsHyperdriveV2 {...props} details={locationDetails} />,
    );

    const inputs = component.getAllByRole('textbox', {
      name: /bootstrap list/i,
    });
    expect(inputs[0]).toHaveValue('localhost:85');
  });

  it('should disable add button if ten items in the bootstrap list', () => {
    const bootstrapList = Array.from(
      { length: 10 },
      (_, i) => `localhost:8${i}`,
    );
    const locationDetails = { bootstrapList };
    const component = mount(
      // @ts-expect-error
      <LocationDetailsHyperdriveV2 {...props} details={locationDetails} />,
    );

    const addButton = component.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
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
    addListEntry(component.container);
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
    editListEntry(component.container, 'localhost:83', 0);
    expect(location).toEqual(refLocation);
  });

  it('should delete entry and save hyperdrive location details', () => {
    const refLocation = {
      bootstrapList: ['localhost:84'],
    };
    let location = {
      bootstrapList: ['locahost:83', 'localhost:84'],
    };
    const { container } = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsHyperdriveV2
        {...props}
        details={location}
        //@ts-expect-error fix this when you are working on it
        onChange={(l) => (location = l)}
      />,
    );
    delListEntry(container, 0);
    expect(location).toEqual(refLocation);
  });
});
