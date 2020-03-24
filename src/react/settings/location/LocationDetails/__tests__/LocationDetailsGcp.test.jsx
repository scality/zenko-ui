import { checkBox, updateInputText } from '../../../../utils/test';
import LocationDetailsGcp from '../LocationDetailsGcp';
import React from 'react';
import { mount } from 'enzyme';

const props = {
    details: {},
    onChange: () => {},
};

describe('class <LocationDetailsGcp />', () => {
    it('should call onChange on mount', () => {
        const onChangeFn = jest.fn();
        mount(
            <LocationDetailsGcp {...props} onChange={onChangeFn} />
        );
        expect(onChangeFn).toHaveBeenCalledWith({
            bucketMatch: false,
            accessKey: '',
            secretKey: '',
            bucketName: '',
            mpuBucketName: '',
        });
    });

    it('should call onChange on state update', () => {
        const refLocation = {
            bucketMatch: true,
            secretKey: 'sk',
            accessKey: 'ak',
            bucketName: 'bn',
            mpuBucketName: 'mbn',
        };
        const onChangeFn = jest.fn();
        const component = mount(
            <LocationDetailsGcp {...props} onChange={onChangeFn} />
        );
        component.setState({...refLocation}, () => {
            expect(onChangeFn).toHaveBeenCalledWith(refLocation);
        });
    });

    it('should show gcp details for empty details', () => {
        const component = mount(
            <LocationDetailsGcp {...props} />
        );
        expect(component.find('input[name="accessKey"]')).not.toBeEmpty();
        expect(component.find('input[name="accessKey"]').props().value).toEqual('');

        expect(component.find('input[name="secretKey"]')).not.toBeEmpty();
        expect(component.find('input[name="secretKey"]').props().value).toEqual('');

        expect(component.find('input[name="bucketName"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketName"]').props().value).toEqual('');

        expect(component.find('input[name="mpuBucketName"]')).not.toBeEmpty();
        expect(component.find('input[name="mpuBucketName"]').props().value).toEqual('');

        expect(component.find('input[name="bucketMatch"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketMatch"]').props().value).toEqual(false);
    });

    it('should show gcp details when editing an existing location', () => {
        const locationDetails = {
            secretKey: 'sk',
            accessKey: 'ak',
            bucketName: 'bn',
            mpuBucketName: 'mbn',
            bucketMatch: true,
        };
        const component = mount(
            <LocationDetailsGcp {...props} details={locationDetails} />
        );
        expect(component.find('input[name="accessKey"]')).not.toBeEmpty();
        expect(component.find('input[name="accessKey"]').props().value).toEqual('ak');

        expect(component.find('input[name="secretKey"]')).not.toBeEmpty();
        // for now we just set it as empty since it's encrypted
        expect(component.find('input[name="secretKey"]').props().value).toEqual('');

        expect(component.find('input[name="bucketName"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketName"]').props().value).toEqual('bn');

        expect(component.find('input[name="mpuBucketName"]')).not.toBeEmpty();
        expect(component.find('input[name="mpuBucketName"]').props().value).toEqual('mbn');

        expect(component.find('input[name="bucketMatch"]')).not.toBeEmpty();
        expect(component.find('input[name="bucketMatch"]').props().value).toEqual(true);
    });

    it('should call onChange on location details updates', () => {
        const refLocation = {
            secretKey: 'sk',
            accessKey: 'ak',
            bucketName: 'bn',
            mpuBucketName: 'mbn',
            bucketMatch: true,
        };
        let location = {};
        const component = mount(
            <LocationDetailsGcp {...props} onChange={l => location = l} />
        );
        checkBox(component, 'bucketMatch', true);
        updateInputText(component, 'accessKey', 'ak');
        updateInputText(component, 'secretKey', 'sk');
        updateInputText(component, 'bucketName', 'bn');
        updateInputText(component, 'mpuBucketName', 'mbn');

        expect(location).toEqual(refLocation);
    });
});
