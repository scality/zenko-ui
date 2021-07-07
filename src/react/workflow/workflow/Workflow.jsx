//@flow
import * as T from '../../ui-elements/TableKeyValue2';
import { Button, Select } from '@scality/core-ui';
import React, { useEffect, useState } from 'react';
import type { Workflow as WorkflowRule, WorkflowType } from '../../../types/workflow';
import { convertToReplicationStream, generateStreamName, newReplicationForm } from '../replication/utils';
import { defaultSelectedOption, renderWorkflowSelectOption, workflowSchemas, workflowSelectOptions } from './utils';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import Joi from '@hapi/joi';
import type { Locations } from '../../../types/config';
import { NoLocationWarning } from '../../ui-elements/Warning';
import Replication from '../replication/Replication';
import type { WorkflowSelectOption } from './utils';
import { checkIfExternalLocation } from '../../utils/storageOptions';
import { joiResolver } from '@hookform/resolvers';
import { push } from 'connected-react-router';
import { saveReplication } from '../../actions';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';

const WorkflowContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    ${ T.Row } {
      height: 42px;
      min-height: 42px;
    }
`;

const baseSchema = Joi.object({
    workflowId: Joi.string().label('Id').allow(''),
    workflowVersion: Joi.number().label('Version').optional(),
    enabled: Joi.boolean().label('State').required(),
});

type Props = {
    locations: Locations,
    workflow: ?WorkflowRule,
    createMode: boolean,
    loading: boolean,
};
const Workflow = (props: Props) => {
    const dispatch = useDispatch();
    const { showEditWorkflowNotification } = useSelector((state: AppState) => state.uiWorkflows);
    const [ruleType, setRuleType] = useState<WorkflowType | null>(props.workflow ? props.workflow.type : defaultSelectedOption);
    const workflowSelectedOption: (WorkflowSelectOption | void) = workflowSelectOptions.find((opt) => opt.value === ruleType);

    const formProps = useForm({
        resolver: joiResolver(ruleType ? baseSchema.concat(workflowSchemas[ruleType]) : baseSchema),
        defaultValues: newReplicationForm(),
    });

    useEffect(() => {
        setRuleType(props.workflow ? props.workflow.type : null);
    }, [dispatch, props.workflow]);

    const onSubmit = (values) => {
        if (ruleType === 'replication') {
            let stream = values;
            let s = convertToReplicationStream(stream);
            if (!s.name) {
                s = { ...s, name: generateStreamName(s) };
            }
            dispatch(saveReplication(s));
        }
    };

    const handleCancel = () => {
        dispatch(push('/workflows'));
    };

    const ruleForm = () => {
        let form;
        switch (ruleType) {
        case 'replication':
            form = <Replication formProps={formProps} locations={ props.locations } wfSelected={ props.workflow } createMode={ props.createMode } loading={ props.loading }/>;
            break;
        default:
            return null;
        }
        if (form) {
            return <div className="workflow-form">
                { form }
            </div>;
        }
        return null;
    };

    if (!checkIfExternalLocation(props.locations)) {
        return <NoLocationWarning/>;
    }

    return (
        <WorkflowContainer>
            <T.Groups>
                <T.Group>
                    <T.GroupContent>
                        <T.Row>
                            <T.Key principal={ true }> Rule Type </T.Key>
                            <T.Value>
                                { !props.createMode && workflowSelectedOption ? (
                                    <div className='rule-type'>
                                        {workflowSelectedOption.icon}
                                        {workflowSelectedOption.label}
                                    </div>) : (
                                    <Select
                                        id='rule-type-select'
                                        name='ruleType'
                                        value={ workflowSelectedOption }
                                        onChange={ (option) => setRuleType(option.value) }
                                        options={ workflowSelectOptions }
                                        formatOptionLabel={ renderWorkflowSelectOption }
                                        isDisabled={ !props.createMode }
                                    />
                                ) }
                            </T.Value>
                        </T.Row>
                    </T.GroupContent>
                </T.Group>
                { ruleForm() }
            </T.Groups>
            <T.Footer>
                <Button disabled={ props.loading || !props.createMode && !showEditWorkflowNotification } id="cancel-workflow-btn" style={ { marginRight: '24px' } } outlined onClick={ handleCancel } text="Cancel"/>
                <Button disabled={ props.loading || !props.createMode && !showEditWorkflowNotification } icon={ <i className="fas fa-save"/> } id="create-workflow-btn" variant="buttonPrimary" onClick={ formProps.handleSubmit(onSubmit) } text={ props.createMode ? 'Create' : 'Save Changes' }/>
            </T.Footer>
        </WorkflowContainer>
    );
};

export default Workflow;
