//@flow
import { LOCATION2, WORKFLOWS } from '../../actions/__tests__/utils/testUtil';
import { reduxMount, reduxMountAct } from '../../utils/test';
import DeleteConfirmation from '../../ui-elements/DeleteConfirmation';
import React from 'react';
import Replication from '../workflowTypes/replication/Replication';
import WorkflowEditor from '../WorkflowEditor';

describe('WorkflowEditor', () => {
    it('should not render any form by default', async () => {
        const component = await reduxMountAct(<WorkflowEditor locations={{ 'location-scality-hdclient-v2': LOCATION2 }} wfSelected={null} createMode={true} loading={false}/>);

        expect(component.find('.workflow-form')).toHaveLength(0);
        console.log(component.debug());
        expect(component.find('button#cancel-workflow-btn')).toHaveLength(1);
        expect(component.find('button#create-workflow-btn')).toHaveLength(1);
    });

    it('should render delete Workflow Button only in edition mode', async () => {
        const { component } = reduxMount(<WorkflowEditor locations={{ 'location-scality-hdclient-v2': LOCATION2 }} wfSelected={WORKFLOWS[0]} createMode={false} loading={false}/>);
        expect(component.find(DeleteConfirmation)).toHaveLength(1);

        const component2 = await reduxMountAct(<WorkflowEditor locations={{ 'location-scality-hdclient-v2': LOCATION2 }} wfSelected={null} createMode={true} loading={false}/>);
        expect(component2.find(DeleteConfirmation)).toHaveLength(0);
    });

    it('should render Rule Type without ruleType Select if in edit mode' , () => {
        const { component } = reduxMount(<WorkflowEditor locations={{ 'location-scality-hdclient-v2': LOCATION2 }} wfSelected={WORKFLOWS[0]} createMode={false} loading={false}/>);

        expect(component.find(Replication)).toHaveLength(1);
        expect(component.find('#rule-type-select')).toHaveLength(0);
        expect(component.find('.rule-type').text()).toBe('Replication');
    });

    it('should render Replication Form if selected', async () => {
        const component = await reduxMountAct(<WorkflowEditor locations={{ 'location-scality-hdclient-v2': LOCATION2 }} wfSelected={null} createMode={true} loading={false}/>);

        const ruleTypeSelect = component.find('#rule-type-select');
        const selectInput = ruleTypeSelect.find('input[name="ruleType"]');
        // open select
        selectInput.simulate('keyDown', { key: 'ArrowDown', keyCode: 40 });
        selectInput.simulate('keyDown', { key: 'Enter', keyCode: 13 });
        expect(component.find(Replication)).toHaveLength(1);
    });
});
