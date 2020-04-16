import { addListEntry, delListEntry, editListEntry, updateInputText } from '../../../../utils/test';
import LocationDetailsSproxyd from '../LocationDetailsSproxyd';
import React from 'react';
import { mount } from 'enzyme';

const props = {
    details: {},
    onChange: () => {},
};

describe('class <LocationDetailsSproxyd />', () => {
    it('should call onChange on mount', () => {
        const onChangeFn = jest.fn();
        mount(
            <LocationDetailsSproxyd {...props} onChange={onChangeFn} />
        );
        expect(onChangeFn).toHaveBeenCalledWith({
            bootstrapList: [''],
            proxyPath: '',
            chordCos: 0,
        });
    });

    it('should call onChange on state update', () => {
        const refLocation = {
            bootstrapList: ['localhost:42'],
            proxyPath: '/proxy/path/',
            chordCos: 3,
        };
        const onChangeFn = jest.fn();
        const component = mount(
            <LocationDetailsSproxyd {...props} onChange={onChangeFn} />
        );
        component.setState({...refLocation}, () => {
            expect(onChangeFn).toHaveBeenCalledWith(refLocation);
        });
    });

    it('should show sproxyd details for empty details', () => {
        const component = mount(
            <LocationDetailsSproxyd {...props} />
        );
        expect(component.find('input[name="proxyPath"]')).toHaveLength(1);
        expect(component.find('input[name="proxyPath"]').props().value).toEqual('');

        expect(component.find('input[name="chordCos"]')).toHaveLength(1);
        expect(component.find('input[name="chordCos"]').props().value).toEqual(0);

        expect(component.find('InputList').props().entries).toEqual(['']);
    });

    it('should show sproxyd details when editing an existing location', () => {
        const locationDetails = {
            bootstrapList: ['localhost:42', 'localhost:43', 'localhost:44'],
            proxyPath: '/proxy/path/',
            chordCos: 3,
        };
        const component = mount(
            <LocationDetailsSproxyd {...props} details={locationDetails} />
        );
        expect(component.find('input[name="proxyPath"]')).toHaveLength(1);
        expect(component.find('input[name="proxyPath"]').props().value).toEqual('/proxy/path/');

        expect(component.find('input[name="chordCos"]')).toHaveLength(1);
        expect(component.find('input[name="chordCos"]').props().value).toEqual(3);

        expect(component.find('InputList').props().entries).toEqual(['localhost:42', 'localhost:43', 'localhost:44']);
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
        const component = mount(
            <LocationDetailsSproxyd {...props} details={location} onChange={l => location = l} />
        );
        updateInputText(component, 'proxyPath', '/proxy/path/');
        updateInputText(component, 'chordCos', 3);

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
        const component = mount(
            <LocationDetailsSproxyd {...props} details={location} onChange={l => location = l} />
        );
        addListEntry(component);
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
        const component = mount(
            <LocationDetailsSproxyd {...props} details={location} onChange={l => location = l} />
        );
        editListEntry(component, 'localhost:42', 0);
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
        const component = mount(
            <LocationDetailsSproxyd {...props} details={location} onChange={l => location = l} />
        );
        delListEntry(component, 0);
        expect(location).toEqual(refLocation);
    });
});
