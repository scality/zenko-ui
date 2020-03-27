import { mount, shallow } from 'enzyme';
import LocationDetailsNFS from '../LocationDetailsNFS';
import React from 'react';
import { updateInputText } from '../../../../utils/test';

const props = {
    details: {},
    onChange: () => {},
};

describe('class <LocationDetailsNFS />', () => {
    it('should correctly translate location details to state values', () => {
        const component = shallow(
            <LocationDetailsNFS {...props}
                details={{
                    endpoint: 'tcp+v3://ep/export/path?hard&async',
                }}
            />
        );
        expect(component.state()).toEqual({
            protocol: 'tcp',
            version: 'v3',
            server: 'ep',
            path: '/export/path',
            options: 'hard&async',
        });
    });

    it('should correctly translate state values to location details', done => {
        const onChangeFn = jest.fn();
        const component = shallow(
            <LocationDetailsNFS {...props}
                onChange={onChangeFn}
            />
        );
        component.setState({
            protocol: 'udp',
            version: 'v4',
            server: 'ep',
            path: '/export/test/path',
            options: 'soft&sync',
        }, () => {
            expect(onChangeFn).toHaveBeenCalledWith({
                endpoint: 'udp+v4://ep/export/test/path?soft&sync',
            });
            done();
        });
    });

    it('should call onChange on mount', () => {
        const onChangeFn = jest.fn();
        mount(
            <LocationDetailsNFS {...props} onChange={onChangeFn} />
        );
        expect(onChangeFn).toHaveBeenCalledWith({
            endpoint: 'tcp+v3://',
        });
    });

    it('should call onChange on state update', () => {
        const refLocation = {
            endpoint: 'tcp+v3://ep/export/path?hard&async',
        };
        const refState = {
            protocol: 'tcp',
            version: 'v3',
            server: 'ep',
            path: '/export/path',
            options: 'hard&async',
        };
        const onChangeFn = jest.fn();
        const component = mount(
            <LocationDetailsNFS {...props} onChange={onChangeFn} />
        );
        component.setState({...refState}, () => {
            expect(onChangeFn).toHaveBeenCalledWith(refLocation);
        });
    });

    it('should show NFS details for empty details', () => {
        const component = mount(
            <LocationDetailsNFS {...props} />
        );
        expect(component.find('Input[name="protocol"]')).not.toBeEmpty();
        expect(component.find('Input[name="protocol"]').props().value).toEqual('tcp');
        expect(component.find('Input[name="protocol"]').props().disabled).toBeFalsy();

        expect(component.find('Input[name="version"]')).not.toBeEmpty();
        expect(component.find('Input[name="version"]').props().value).toEqual('v3');
        expect(component.find('Input[name="protocol"]').props().disabled).toBeFalsy();

        expect(component.find('Input[name="server"]')).not.toBeEmpty();
        expect(component.find('Input[name="server"]').props().value).toEqual('');
        expect(component.find('Input[name="protocol"]').props().disabled).toBeFalsy();

        expect(component.find('Input[name="path"]')).not.toBeEmpty();
        expect(component.find('Input[name="path"]').props().value).toEqual('');
        expect(component.find('Input[name="protocol"]').props().disabled).toBeFalsy();

        expect(component.find('Input[name="options"]')).not.toBeEmpty();
        expect(component.find('Input[name="options"]').props().value).toEqual('');
        expect(component.find('Input[name="protocol"]').props().disabled).toBeFalsy();
    });

    it('should show NFS details when editing an existing location', () => {
        const locationDetails = {
            endpoint: 'tcp+v3://ep/export/path?hard&async',
        };

        const component = mount(
            <LocationDetailsNFS {...props} editingExisting={true} details={locationDetails} />
        );
        expect(component.find('Input[name="protocol"]')).not.toBeEmpty();
        expect(component.find('Input[name="protocol"]').props().value).toEqual('tcp');
        expect(component.find('Input[name="protocol"]').props().disabled).toBe(true);

        expect(component.find('Input[name="version"]')).not.toBeEmpty();
        expect(component.find('Input[name="version"]').props().value).toEqual('v3');
        expect(component.find('Input[name="version"]').props().disabled).toBe(true);

        expect(component.find('Input[name="server"]')).not.toBeEmpty();
        expect(component.find('Input[name="server"]').props().value).toEqual('ep');
        expect(component.find('Input[name="server"]').props().disabled).toBe(true);

        expect(component.find('Input[name="path"]')).not.toBeEmpty();
        expect(component.find('Input[name="path"]').props().value).toEqual('/export/path');
        expect(component.find('Input[name="path"]').props().disabled).toBe(true);

        expect(component.find('Input[name="options"]')).not.toBeEmpty();
        expect(component.find('Input[name="options"]').props().value).toEqual('hard&async');
        expect(component.find('Input[name="options"]').props().disabled).toBe(true);
    });

    it('should call onChange on location details updates', () => {
        const refLocation = {
            endpoint: 'udp+v4://ep/export/path?hard&async',
        };
        let location = {};
        const component = mount(
            <LocationDetailsNFS {...props} onChange={l => location = l} />
        );
        component.find('select[name="version"]').simulate('change', { target: {
            name: 'protocol',
            value: 'udp',
            type: 'select',
        } });
        component.find('select[name="version"]').simulate('change', { target: {
            name: 'version',
            value: 'v4',
            type: 'select',
        } });
        updateInputText(component, 'server', 'ep');
        updateInputText(component, 'path', '/export/path');
        updateInputText(component, 'options', 'hard&async');

        expect(location).toEqual(refLocation);
    });
});
