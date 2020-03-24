import { checkBox, updateInputText } from '../../../../utils/test';
import LocationDetailsDOSpaces from '../LocationDetailsDOSpaces';
import React from 'react';
import { mount } from 'enzyme';

const props = {
    details: {},
    onChange: () => {},
};

describe('class <LocationDetailsDOSpaces />', () => {
    it('should call onChange on mount', () => {
        const onChangeFn = jest.fn();
        mount(
            <LocationDetailsDOSpaces {...props} onChange={onChangeFn} />
        );
        expect(onChangeFn).toHaveBeenCalledWith({
            bucketMatch: false,
            accessKey: '',
            secretKey: '',
            bucketName: '',
            endpoint: '',
        });
    });

    it('should call onChange on state update', () => {
        const refLocation = {
            endpoint: 'https://ep',
            secretKey: 'sk',
            accessKey: 'ak',
            bucketName: 'bn',
            bucketMatch: true,
        };
        const onChangeFn = jest.fn();
        const component = mount(
            <LocationDetailsDOSpaces {...props} onChange={onChangeFn} />
        );
        component.setState({...refLocation}, () => {
            expect(onChangeFn).toHaveBeenCalledWith(refLocation);
        });
    });

    it('should show spaces details for empty details', () => {
        const component = mount(
            <LocationDetailsDOSpaces {...props} />
        );
        expect(component.find('input[name="accessKey"]')).not.toBeEmpty();
        expect(component.find('input[name="accessKey"]').props().value).toEqual('');

        expect(component.find('input[name="secretKey"]')).not.toBeEmpty();
        expect(component.find('input[name="secretKey"]').props().value).toEqual('');

        expect(component.find('input[name="bucketName"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketName"]').props().value).toEqual('');

        expect(component.find('input[name="endpoint"]')).not.toBeEmpty();
        expect(component.find('input[name="endpoint"]').props().value).toEqual('');

        expect(component.find('input[name="bucketMatch"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketMatch"]').props().value).toEqual(false);
    });

    it('should show spaces details when editing an existing location', () => {
        const locationDetails = {
            endpoint: 'https://ep',
            secretKey: 'sk',
            accessKey: 'ak',
            bucketName: 'bn',
            bucketMatch: true,
        };
        const component = mount(
            <LocationDetailsDOSpaces {...props} details={locationDetails} />
        );
        expect(component.find('input[name="accessKey"]')).not.toBeEmpty();
        expect(component.find('input[name="accessKey"]').props().value).toEqual('ak');

        expect(component.find('input[name="secretKey"]')).not.toBeEmpty();
        // for now we just set it as empty since it's encrypted
        expect(component.find('input[name="secretKey"]').props().value).toEqual('');

        expect(component.find('input[name="bucketName"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketName"]').props().value).toEqual('bn');

        expect(component.find('input[name="endpoint"]')).not.toBeEmpty();
        expect(component.find('input[name="endpoint"]').props().value).toEqual('https://ep');

        expect(component.find('input[name="bucketMatch"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketMatch"]').props().value).toEqual(true);
    });

    it('should call onChange on location details updates', () => {
        const refLocation = {
            endpoint: 'https://ep',
            secretKey: 'sk',
            accessKey: 'ak',
            bucketName: 'bn',
            bucketMatch: true,
        };
        let location = {};
        const component = mount(
            <LocationDetailsDOSpaces {...props} onChange={l => location = l} />
        );
        checkBox(component, 'bucketMatch', true);
        updateInputText(component, 'accessKey', 'ak');
        updateInputText(component, 'secretKey', 'sk');
        updateInputText(component, 'bucketName', 'bn');
        updateInputText(component, 'endpoint', 'https://ep');

        expect(location).toEqual(refLocation);
    });
});
