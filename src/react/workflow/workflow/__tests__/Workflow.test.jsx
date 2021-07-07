//@flow
import { LOCATION, LOCATION2, WORKFLOWS } from '../../../actions/__tests__/utils/testUtil';
import { NoLocationWarning } from '../../../ui-elements/Warning';
import React from 'react';
import Replication from '../../replication/Replication';
import Workflow from '../Workflow';
import { reduxMount } from '../../../utils/test';

describe('Workflow', () => {
    it('should render NoLocationWarning if all locations are location-file-v1', () => {
        const { component } = reduxMount(<Workflow locations={{ 'location-file-v1': LOCATION }} workflow={null} createMode={false} loading={false}/>);

        expect(component.find(NoLocationWarning)).toHaveLength(1);
    });

    it('should not render any form by default', () => {
        const { component } = reduxMount(<Workflow locations={{ 'location-scality-hdclient-v2': LOCATION2 }} workflow={null} createMode={true} loading={false}/>);

        expect(component.find('.workflow-form')).toHaveLength(0);
    });

    it('should render Replication Form if selected', () => {
        const { component } = reduxMount(<Workflow locations={{ 'location-scality-hdclient-v2': LOCATION2 }} workflow={null} createMode={true} loading={false}/>);

        const ruleTypeSelect = component.find('#rule-type-select');
        const selectInput = ruleTypeSelect.find('input[name="ruleType"]');
        // open select
        selectInput.simulate('keyDown', { key: 'ArrowDown', keyCode: 40 });
        selectInput.simulate('keyDown', { key: 'Enter', keyCode: 13 });
        expect(component.find(Replication)).toHaveLength(1);
    });

    it('should render Rule Type without ruleType Select if in edit mode' , () => {
        const { component } = reduxMount(<Workflow locations={{ 'location-scality-hdclient-v2': LOCATION2 }} workflow={WORKFLOWS[0]} createMode={false} loading={false}/>);

        expect(component.find(Replication)).toHaveLength(1);
        expect(component.find('#rule-type-select')).toHaveLength(0);
        expect(component.find('.rule-type').text()).toBe('Replication');
    });
});
