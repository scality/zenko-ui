import LocationEditor from '../LocationEditor';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { reduxMount } from '../../../utils/test';

describe('LocationEditor', () => {
    it('should display storageOptions expect hidden options', () => {
        const { component } = reduxMount(<MemoryRouter><LocationEditor/></MemoryRouter>);

        const selectInput = component.find('input[name="locationType"]');
        // open select
        selectInput.simulate('keyDown', { key: 'ArrowDown', keyCode: 40 });

        const options = component.find('div.sc-select__option');
        expect(options.length).toBe(6);
        expect(options.first().find('span').text()).toBe('Storage Service for ARTESCA');
        expect(options.at(1).find('span').text()).toBe('Scality RING with S3 Connector');
        expect(options.at(2).find('span').text()).toBe('Amazon S3');
        expect(options.at(3).find('span').text()).toBe('Google Cloud Storage');
        expect(options.at(4).find('span').text()).toBe('Microsoft Azure Blob Storage');
        expect(options.at(5).find('span').text()).toBe('Local Filesystem');
    });
});
