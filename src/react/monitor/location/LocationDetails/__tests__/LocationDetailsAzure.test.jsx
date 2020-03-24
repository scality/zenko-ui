import { checkBox, updateInputText } from '../../../../utils/test';
import LocationDetailsAzure from '../LocationDetailsAzure';
import React from 'react';
import { mount } from 'enzyme';

const props = {
    details: {},
    onChange: () => {},
};

describe('class <LocationDetailsAzure />', () => {
    it('should call onChange on mount', () => {
        const onChangeFn = jest.fn();
        mount(
            <LocationDetailsAzure {...props} onChange={onChangeFn} />
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
            bucketMatch: false,
            accessKey: 'ak',
            secretKey: 'sk',
            bucketName: 'bn',
            endpoint: 'https://ep',
        };
        const onChangeFn = jest.fn();
        const component = mount(
            <LocationDetailsAzure {...props} onChange={onChangeFn} />
        );
        component.setState({...refLocation}, () => {
            expect(onChangeFn).toHaveBeenCalledWith(refLocation);
        });
    });

    it('should show azure details for empty details', () => {
        const component = mount(
            <LocationDetailsAzure {...props} />
        );
        expect(component.find('input[name="accessKey"]')).not.toBeEmpty();
        expect(component.find('input[name="accessKey"]').props().value).toEqual('');

        expect(component.find('input[name="secretKey"]')).not.toBeEmpty();
        expect(component.find('input[name="secretKey"]').props().value).toEqual('');

        expect(component.find('input[name="bucketName"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketName"]').props().value).toEqual('');

        expect(component.find('input[name="bucketMatch"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketMatch"]').props().value).toEqual(false);

        expect(component.find('input[name="endpoint"]')).not.toBeEmpty();
        expect(component.find('input[name="endpoint"]').props().value).toEqual('');
    });

    it('should show azure details when editing an existing location', () => {
        const locationDetails = {
            secretKey: 'sk',
            accessKey: 'ak',
            bucketName: 'bn',
            bucketMatch: true,
            endpoint: 'https://ep',
        };
        const component = mount(
            <LocationDetailsAzure {...props} details={locationDetails} />
        );
        expect(component.find('input[name="accessKey"]')).not.toBeEmpty();
        expect(component.find('input[name="accessKey"]').props().value).toEqual('ak');

        expect(component.find('input[name="endpoint"]')).not.toBeEmpty();
        expect(component.find('input[name="endpoint"]').props().value).toEqual('https://ep');

        expect(component.find('input[name="secretKey"]')).not.toBeEmpty();
        // for now we just set it as empty since it's encrypted
        expect(component.find('input[name="secretKey"]').props().value).toEqual('');

        expect(component.find('input[name="bucketName"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketName"]').props().value).toEqual('bn');

        expect(component.find('input[name="bucketMatch"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketMatch"]').props().value).toEqual(true);
    });

    it('should call onChange on location details updates', () => {
        const refLocation = {
            secretKey: 'sk',
            accessKey: 'ak',
            bucketName: 'bn',
            bucketMatch: true,
            endpoint: 'https://ep',
        };
        let location = {};
        const component = mount(
            <LocationDetailsAzure {...props} onChange={l => location = l} />
        );
        checkBox(component, 'bucketMatch', true);
        updateInputText(component, 'accessKey', 'ak');
        updateInputText(component, 'secretKey', 'sk');
        updateInputText(component, 'bucketName', 'bn');
        updateInputText(component, 'endpoint', 'https://ep');

        expect(location).toEqual(refLocation);
    });
});
