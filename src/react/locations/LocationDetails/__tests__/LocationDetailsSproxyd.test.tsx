/* eslint-disable */
import {
  addListEntry,
  delListEntry,
  editListEntry,
  themeMount as mount,
  NewWrapper,
  updateInputText,
} from '../../../utils/testUtil';
import LocationDetailsSproxyd from '../LocationDetailsSproxyd';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

const props = {
  details: {
    bootstrapList: [''],
    proxyPath: '',
    chordCos: 0,
  },
  onChange: () => {},
  editingExisting: false,
};

describe('class <LocationDetailsSproxyd />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    mount(<LocationDetailsSproxyd {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      bootstrapList: [''],
      proxyPath: '',
      chordCos: 0,
    });
  });

  it('should call onChange on state update', async () => {
    const refLocation = {
      bootstrapList: ['localhost:42'],
      proxyPath: '/proxy/path/',
      chordCos: 3,
    };
    const onChangeFn = jest.fn();
    render(<LocationDetailsSproxyd {...props} onChange={onChangeFn} />, {
      wrapper: NewWrapper(),
    });

    await userEvent.type(screen.getByLabelText(/proxy path/i), '/proxy/path/');
    await userEvent.type(
      screen.getByRole('textbox', {
        name: /Replication Factor for Small Objects /i,
      }),
      '3',
    );
    await userEvent.type(
      screen.getByLabelText(/bootstrap list/i),
      'localhost:42',
    );

    expect(onChangeFn).toHaveBeenCalledWith(refLocation);
  });

  it('should show sproxyd details for empty details', () => {
    render(<LocationDetailsSproxyd {...props} />, { wrapper: NewWrapper() });

    expect(screen.getByLabelText(/proxy path/i)).toHaveValue('');
    expect(
      screen.getByRole('textbox', {
        name: /Replication Factor for Small Objects /i,
      }),
    ).toHaveValue('0');
    expect(screen.getByLabelText(/bootstrap list/i)).toHaveValue('');
  });

  it('should show sproxyd details when editing an existing location', () => {
    const locationDetails = {
      bootstrapList: ['localhost:42', 'localhost:43', 'localhost:44'],
      proxyPath: '/proxy/path/',
      chordCos: 3,
    };
    render(<LocationDetailsSproxyd {...props} details={locationDetails} />, {
      wrapper: NewWrapper(),
    });

    expect(screen.getByLabelText(/proxy path/i)).toHaveValue('/proxy/path/');
    expect(
      screen.getByRole('textbox', {
        name: /Replication Factor for Small Objects /i,
      }),
    ).toHaveValue('3');

    const bootstrapInputs = screen.getAllByLabelText(/bootstrap list/i);
    expect(bootstrapInputs[0]).toHaveValue('localhost:44');
  });

  it('should call onChange on location details updates', () => {
    const refLocation = {
      bootstrapList: ['localhost:42'],
      proxyPath: '/proxy/path/',
      chordCos: 3,
    };
    let location = {
      bootstrapList: ['localhost:42'],
      proxyPath: '',
      chordCos: 0,
    };
    const { container } = mount(
      <LocationDetailsSproxyd
        {...props}
        details={location}
        //@ts-expect-error fix this when you are working on it
        onChange={(l) => (location = l)}
      />,
    );
    updateInputText(container, 'proxyPath', '/proxy/path/');
    updateInputText(container, 'chordCos', 3);
    expect(location).toEqual(refLocation);
  });

  it('should add entry and save sproxyd location details', () => {
    const refLocation = {
      bootstrapList: ['localhost:42', ''],
      proxyPath: '/proxy/path/',
      chordCos: 3,
    };
    let location = {
      bootstrapList: ['localhost:42'],
      proxyPath: '/proxy/path/',
      chordCos: 3,
    };
    const { container } = mount(
      <LocationDetailsSproxyd
        {...props}
        details={location}
        //@ts-expect-error fix this when you are working on it
        onChange={(l) => (location = l)}
      />,
    );
    addListEntry(container);
    expect(location).toEqual(refLocation);
  });

  it('should edit entry and save sproxyd location details', () => {
    const refLocation = {
      bootstrapList: ['localhost:42'],
      proxyPath: '/proxy/path/',
      chordCos: 3,
    };
    let location = {
      bootstrapList: [''],
      proxyPath: '/proxy/path/',
      chordCos: 3,
    };
    const { container } = mount(
      <LocationDetailsSproxyd
        {...props}
        details={location}
        //@ts-expect-error fix this when you are working on it
        onChange={(l) => (location = l)}
      />,
    );
    editListEntry(container, 'localhost:42', 0);
    expect(location).toEqual(refLocation);
  });

  it('should delete entry and save sproxyd location details', () => {
    const refLocation = {
      bootstrapList: ['localhost:42'],
      proxyPath: '/proxy/path/',
      chordCos: 3,
    };
    let location = {
      bootstrapList: ['locahost:43', 'localhost:42'],
      proxyPath: '/proxy/path/',
      chordCos: 3,
    };
    const { container } = mount(
      <LocationDetailsSproxyd
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
