import { EXPIRATION_WORKFLOW, LOCATION2, WORKFLOWS } from '../../../../actions/__tests__/utils/testUtil';
import Expiration from '../Expiration';
import React from 'react';
import WorkflowEditor from '../../../WorkflowEditor';
import { reduxMount } from '../../../../utils/test';
import { workflowSchemas } from '../../../workflowEditorUtils';

describe('Expiration', () => {
    const selectExpirationForm = (component) => {
        const ruleTypeSelect = component.find('#rule-type-select');
        const selectInput = ruleTypeSelect.find('input[name="ruleType"]');
        // open select
        selectInput.simulate('keyDown', { key: 'ArrowDown', keyCode: 40 });
        selectInput.simulate('keyDown', { key: 'ArrowDown', keyCode: 40 });
        selectInput.simulate('keyDown', { key: 'Enter', keyCode: 13 });
        expect(component.find(Expiration)).toHaveLength(1);
        return component;
    };

    test('resolver validation should pass', () => {
        const schema = workflowSchemas['expiration'];
        let error;
        // valid data
        let data = {
            workflowName: 'My Workflow',
            objectKeyPrefix: 'myprefix',
            objectKeyTag: 'mytag',
            expireCurrentVersionState: true,
            expirePreviousVersionState: false,
            expireOrphanDeleteMarkerState: false,
            expireOrphanMPUState: true,
            expireCurrentVersionDays: 3,
            expirePreviousVersionDays: 1,
            sourceBucket: {
                value: 'bucketname',
                label: 'label',
                disabled: false,
                location: 'location',
            },
        };
        error = schema.validate(data).error;
        expect(error).toBeUndefined();

        // orphan delete marker cannot be true if expire current version is true
        data.expireOrphanDeleteMarkerState = true;
        error = schema.validate(data).error;
        expect(error).not.toBeUndefined();
        data.expireOrphanDeleteMarkerState = false;

        // days cannot be less than 1
        data.expireCurrentVersionDays = 0;
        data.expirePreviousVersionDays = -1;
        error = schema.validate(data).error;
        expect(error).not.toBeUndefined();
        data.expireCurrentVersionDays = 1;
        data.expirePreviousVersionDays = 1;

        // either expireCurrent or expirePrevious should be true
        data.expireCurrentVersionState = false;
        data.expirePreviousVersionState = false;
        error = schema.validate(data).error;
        expect(error).not.toBeUndefined();
    });

    test('Expiration form should be displayed on edition', () => {
        const { component } = reduxMount(<WorkflowEditor locations={{ 'location-scality-hdclient-v2': LOCATION2 }} wfSelected={WORKFLOWS[1]} createMode={false} loading={false}/>, {
            workflow: {
                expirations: [EXPIRATION_WORKFLOW],
            },
        });

        expect(component.find('#enabled').find('input').prop('checked')).toBe(EXPIRATION_WORKFLOW.enabled);
        expect(component.find('#workflowName').find('input').prop('value')).toBe(EXPIRATION_WORKFLOW.name);
        expect(component.find('#objectKeyTag').find('input').prop('value')).toBe(EXPIRATION_WORKFLOW.filter.objectKeyTag);
        expect(component.find('#objectKeyPrefix').find('input').prop('value')).toBe(EXPIRATION_WORKFLOW.filter.objectKeyPrefix);
        expect(component.find('#expireCurrentVersionState').find('input').prop('checked')).toBe(!!EXPIRATION_WORKFLOW.currentVersionTriggerDelayDays);
        expect(component.find('#expireCurrentVersionDays').find('input').prop('value')).toBe(EXPIRATION_WORKFLOW.currentVersionTriggerDelayDays);
        expect(component.find('#expirePreviousVersionState').find('input').prop('checked')).toBe(!!EXPIRATION_WORKFLOW.previousVersionTriggerDelayDays);
        expect(component.find('#expirePreviousVersionDays').find('input').prop('value')).toBe(EXPIRATION_WORKFLOW.previousVersionTriggerDelayDays);
        expect(component.find('#expireOrphanDeleteMarkerState').find('input').prop('checked')).toBe(EXPIRATION_WORKFLOW.expireOrphans);
        expect(component.find('#expireOrphanMPUState').find('input').prop('checked')).toBe(EXPIRATION_WORKFLOW.expireMPU);
    });

    test('Expire Markers should be disabled if Expire current is active', () => {
        const { component } = reduxMount(<WorkflowEditor locations={{ 'location-scality-hdclient-v2': LOCATION2 }} wfSelected={null} createMode={true} loading={false}/>);
        const form = selectExpirationForm(component);
        expect(form.find('#expireOrphanDeleteMarkerState').find('input').prop('checked')).toBeFalsy();
        expect(form.find('#expireCurrentVersionState').find('input').prop('checked')).toBeFalsy();
        form.find('#expireOrphanDeleteMarkerState').find('input').simulate('change', {
            target: {
                checked: true,
                type: 'checkbox',
            },
        });
        expect(form.find('#expireOrphanDeleteMarkerState').find('input').prop('checked')).toBeTruthy();
        expect(form.find('#expireCurrentVersionState').find('input').prop('checked')).toBeFalsy();
        form.find('#expireCurrentVersionState').find('input').simulate('change', {
            target: {
                checked: true,
                type: 'checkbox',
            },
        });
        expect(form.find('#expireOrphanDeleteMarkerState').find('input').prop('checked')).toBeFalsy();
        expect(form.find('#expireCurrentVersionState').find('input').prop('checked')).toBeTruthy();
    });
});
