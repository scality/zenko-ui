import { addListEntry, delListEntry, editListEntry, updateInputText } from '../../../../utils/test';
import { mount, shallow } from 'enzyme';
import LocationDetailsHyperdrive from '../LocationDetailsHyperdrive';
import React from 'react';

const props = {
    details: {},
    onChange: () => {},
};

describe('class <LocationDetailsHyperdrive />', () => {
    it('should correctly translate location details to state values', () => {
        const component = shallow(
            <LocationDetailsHyperdrive {...props}
                details={{
                    dataParts: 1,
                    codingParts: 1,
                    bootstrapList: [
                        'test-uuid,localhost:8181,enabled',
                        ',localhost:8182,enabled',
                        'test-uuid,localhost:8183,disabled',
                        ',localhost:8184,enabled',
                        ',localhost:8185,disabled',
                    ],
                }}
            />
        );
        expect(component.state()).toEqual({
            hyperdriveList: [
                ['test-uuid', 'localhost:8181', true],
                ['test-uuid', 'localhost:8183', false],
            ],
            newHyperdrives: [
                'localhost:8182',
                'localhost:8184',
            ],
            dataParts: 1,
            codingParts: 1,
        });
    });

    it('should correctly translate state values to location details', done => {
        const onChangeFn = jest.fn();
        const component = shallow(
            <LocationDetailsHyperdrive {...props}
                onChange={onChangeFn}
            />
        );
        component.setState({
            hyperdriveList: [
                ['test-uuid', 'localhost:8181', true],
                ['test-uuid', 'localhost:8183', false],
            ],
            newHyperdrives: [
                'localhost:8182',
                'localhost:8184',
                '',
            ],
            dataParts: 1,
            codingParts: 1,
        }, () => {
            expect(onChangeFn).toHaveBeenCalledWith({
                bootstrapList: [
                    'test-uuid,localhost:8181,enabled',
                    'test-uuid,localhost:8183,disabled',
                    ',localhost:8182,enabled',
                    ',localhost:8184,enabled',
                ],
                codingParts: 1,
                dataParts: 1,
            });
            done();
        });
    });

    it('should call onChange on mount', () => {
        const onChangeFn = jest.fn();
        mount(
            <LocationDetailsHyperdrive {...props} onChange={onChangeFn} />
        );
        expect(onChangeFn).toHaveBeenCalledWith({
            bootstrapList: [],
            codingParts: 0,
            dataParts: 0,
        });
    });

    it('should call onChange on state update', () => {
        const refLocation = {
            bootstrapList: [
                'test-uuid,localhost:8181,enabled',
                'test-uuid,localhost:8183,disabled',
                ',localhost:8182,enabled',
                ',localhost:8184,enabled',
            ],
            codingParts: 1,
            dataParts: 1,
        };
        const refState = {
            hyperdriveList: [
                ['test-uuid', 'localhost:8181', true],
                ['test-uuid', 'localhost:8183', false],
            ],
            newHyperdrives: [
                'localhost:8182',
                'localhost:8184',
                '',
            ],
            dataParts: 1,
            codingParts: 1,
        };
        const onChangeFn = jest.fn();
        const component = mount(
            <LocationDetailsHyperdrive {...props} onChange={onChangeFn} />
        );
        component.setState({...refState}, () => {
            expect(onChangeFn).toHaveBeenCalledWith(refLocation);
        });
    });

    it('should show hyperdrive details for empty details', () => {
        const component = mount(
            <LocationDetailsHyperdrive {...props} />
        );
        expect(component.find('InputGroup#hyperdrive-group')).toHaveLength(0);
        expect(component.find('InputList').props().entries).toEqual(['']);

        expect(component.find('input[name="dataParts"]')).not.toBeEmpty();
        expect(component.find('input[name="dataParts"]').props().value).toEqual(0);

        expect(component.find('input[name="codingParts"]')).not.toBeEmpty();
        expect(component.find('input[name="codingParts"]').props().value).toEqual(0);
    });

    it('should show hyperdrive details when editing an existing location', () => {
        const locationDetails = {
            bootstrapList: [
                'test-uuid,localhost:8181,enabled',
                'test-uuid,localhost:8183,disabled',
                ',localhost:8182,enabled',
                ',localhost:8184,enabled',
            ],
            codingParts: 1,
            dataParts: 1,
        };
        const component = mount(
            <LocationDetailsHyperdrive {...props} details={locationDetails} />
        );
        const entries = component.find('InputGroup#hyperdrive-group');
        expect(entries.at(0).find('Input').props().value).toEqual('localhost:8181');
        expect(entries.at(0).find('ActionToggleButton').props().enabled).toEqual(true);
        expect(entries.at(1).find('Input').props().value).toEqual('localhost:8183');
        expect(entries.at(1).find('ActionToggleButton').props().enabled).toEqual(false);

        expect(component.find('InputList').props().entries).toEqual(['localhost:8182','localhost:8184']);

        expect(component.find('input[name="dataParts"]')).not.toBeEmpty();
        expect(component.find('input[name="dataParts"]').props().value).toEqual(1);

        expect(component.find('input[name="codingParts"]')).not.toBeEmpty();
        expect(component.find('input[name="codingParts"]').props().value).toEqual(1);
    });

    it('should call onChange on location details updates', () => {
        const refLocation = {
            bootstrapList: [
                'test-uuid,localhost:8181,enabled',
                'test-uuid,localhost:8183,disabled',
                ',localhost:8182,enabled',
                ',localhost:8184,enabled',
            ],
            codingParts: 1,
            dataParts: 1,
        };
        let location = {
            bootstrapList: [
                'test-uuid,localhost:8181,enabled',
                'test-uuid,localhost:8183,disabled',
                ',localhost:8182,enabled',
                ',localhost:8184,enabled',
            ],
            codingParts: 0,
            dataParts: 0,
        };
        const component = mount(
            <LocationDetailsHyperdrive {...props} details={location} onChange={l => location = l} />
        );
        updateInputText(component, 'codingParts', 1);
        updateInputText(component, 'dataParts', 1);

        expect(location).toEqual(refLocation);
    });

    it('should edit and save hyperdrive location details', () => {
        const refLocation = {
            bootstrapList: [
                'test-uuid,localhost:8181,enabled',
                ',localhost:42,enabled',
                ',localhost:43,enabled',
            ],
            codingParts: 1,
            dataParts: 1,
        };
        let location = {
            bootstrapList: [
                'test-uuid,localhost:8181,disabled',
                ',localhost:42,enabled',
                ',localhost:43,enabled',
            ],
            codingParts: 1,
            dataParts: 1,
        };
        const component = mount(
            <LocationDetailsHyperdrive {...props} details={location} onChange={l => location = l} />
        );

        const entries = component.find('InputGroup#hyperdrive-group');
        entries.at(0).find('ActionToggleOption#read-only')
            .find('button#action-toggle-option').simulate('click');
        expect(location).toEqual(refLocation);
    });

    it('should add/edit and save new hyperdrive location details', () => {
        const refLocation = {
            bootstrapList: [
                ',localhost:42,enabled',
                ',localhost:43,enabled',
            ],
            codingParts: 1,
            dataParts: 1,
        };
        let location = {
            bootstrapList: [',localhost:42,enabled'],
            codingParts: 1,
            dataParts: 1,
        };
        const component = mount(
            <LocationDetailsHyperdrive {...props} details={location} onChange={l => location = l} />
        );
        addListEntry(component);
        editListEntry(component, 'localhost:43', 1);
        expect(location).toEqual(refLocation);
    });

    it('should delete and save new hyperdrive location details', () => {
        const refLocation = {
            bootstrapList: [',localhost:43,enabled'],
            codingParts: 1,
            dataParts: 1,
        };
        let location = {
            bootstrapList: [
                ',localhost:42,enabled',
                ',localhost:43,enabled',
            ],
            codingParts: 1,
            dataParts: 1,
        };
        const component = mount(
            <LocationDetailsHyperdrive {...props} details={location} onChange={l => location = l} />
        );
        delListEntry(component, 0);
        expect(location).toEqual(refLocation);
    });
});
