//@flow
import * as defaultTheme from '@scality/core-ui/dist/style/theme';
import { Banner, Button, Select } from '@scality/core-ui';
import React, { useEffect, useState } from 'react';
import Table, * as T from '../ui-elements/TableKeyValue2';
import type { Workflow, WorkflowType } from '../../types/workflow';
import {
    closeWorkflowDeleteModal,
    deleteWorkflow,
    openWorkflowDeleteModal,
    openWorkflowEditNotification,
    saveReplication,
} from '../actions';
import { convertToReplicationStream, generateStreamName } from './workflowTypes/replication/utils';
import {
    defaultSelectedOption,
    renderWorkflowSelectOption, workflowDefaultValues,
    workflowSchemas,
    workflowSelectOptions,
} from './workflowEditorUtils';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import Input from '../ui-elements/Input';
import Joi from '@hapi/joi';
import type { Locations } from '../../types/config';
import Replication from './workflowTypes/replication/Replication';
import type { WorkflowSelectOption } from './workflowEditorUtils';
import { compareObjectKeys } from '../utils';
import { joiResolver } from '@hookform/resolvers';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';

const TableContainer = styled.div`
    display: flex;
    width: 100%;
`;

const WorkflowEditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-top: ${defaultTheme.padding.base};
    ${ T.Row } {
        height: 42px;
        min-height: 42px;
    }
    .sc-select,
    ${ Input } {
        max-width: 220px;
    }
`;

const baseSchema = Joi.object({
    workflowId: Joi.string().label('Id').allow(''),
    workflowVersion: Joi.number().label('Version').optional(),
    enabled: Joi.boolean().label('State').required(),
});

type Props = {
    locations: Locations,
    wfSelected: ?Workflow,
    createMode: boolean,
    loading: boolean,
};
const WorkflowEditor = (props: Props) => {
    const dispatch = useDispatch();
    const { showEditWorkflowNotification } = useSelector((state: AppState) => state.uiWorkflows);
    const [ruleType, setRuleType] = useState<WorkflowType | null>(props.wfSelected ? props.wfSelected.type : defaultSelectedOption);
    const workflowSelectedOption: (WorkflowSelectOption | void) = workflowSelectOptions.find((opt) => opt.value === ruleType);
    const isDeleteModalOpen = useSelector((state: AppState) => state.uiWorkflows.showWorkflowDeleteModal);
    const [hasFormDefaultValues, setHasFormDefaultValues] = useState(false);

    const formProps = useForm({
        mode: 'onChange',
        resolver: joiResolver(ruleType ? baseSchema.concat(workflowSchemas[ruleType]) : baseSchema),
    });
    const { isValid } = formProps.formState;
    const { control, reset } = formProps;

    useEffect(() => {
        if (ruleType) {
            const defaultValues = control.defaultValuesRef.current;
            setHasFormDefaultValues(compareObjectKeys(defaultValues, workflowDefaultValues[ruleType]));
        }
        // If 'control.defaultValuesRef' is set instead of 'control.defaultValuesRef.current'
        // the useEffect will not be triggered
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [control.defaultValuesRef.current, ruleType]);

    useEffect(() => {
        if (ruleType)
            reset(workflowDefaultValues[ruleType]);
    }, [reset, ruleType]);

    useEffect(() => {
        setRuleType(props.wfSelected ? props.wfSelected.type : null);
    }, [dispatch, props.wfSelected]);

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

    const handleChange = (onChange) => (e) => {
        if (!showEditWorkflowNotification) {
            dispatch(openWorkflowEditNotification());
        }
        onChange(e);
    };

    const handleCancel = () => {
        dispatch(push('/workflows'));
    };

    const ruleForm = () => {
        const ruleProps = {
            formProps,
            handleChange,
            locations: props.locations,
            wfSelected: props.wfSelected,
            createMode: props.createMode,
        };
        let form;
        switch (ruleType) {
        case 'replication':
            form = <Replication { ...ruleProps } />;
            break;
        default:
            return null;
        }
        if (form && hasFormDefaultValues) {
            return <div className="workflow-form">
                { form }
            </div>;
        }
        return null;
    };

    const handleOpenDeleteModal = () => {
        dispatch(openWorkflowDeleteModal());
    };

    const handleDeleteWorkflow = () => {
        dispatch(deleteWorkflow(props.wfSelected));
    };

    const handleCloseDeleteModal = () => {
        dispatch(closeWorkflowDeleteModal());
    };

    return (
        <TableContainer>
            { !props.createMode && props.wfSelected &&
            <DeleteConfirmation approve={ handleDeleteWorkflow } cancel={ handleCloseDeleteModal } show={ isDeleteModalOpen } titleText={ `Permanently remove the following Rule: ${ props.wfSelected.name } ?` }/> }
            <Table id="">
                <T.Body autoComplete="off">
                    { props.createMode ?
                        <>
                            <T.Title> Rule Creation </T.Title>
                            <T.Subtitle> All * are mandatory fields </T.Subtitle>
                        </>
                        :
                        <T.Header>
                            <T.BannerContainer isHidden={ !showEditWorkflowNotification }>
                                <Banner
                                    icon={ <i className="fas fa-exclamation-triangle"/> }
                                    variant="warning"
                                >
                                    If you leave this screen without saving, your changes will be lost.
                                </Banner>
                            </T.BannerContainer>
                            <Button icon={ <i className="fas fa-trash"/> } text="Delete Rule" variant="buttonDelete" onClick={ handleOpenDeleteModal }/>
                        </T.Header>
                    }
                    <WorkflowEditorContainer>
                        <T.Groups>
                            <T.Group>
                                <T.GroupName>
                                    General
                                </T.GroupName>
                                <T.GroupContent>
                                    <T.Row>
                                        <T.Key principal={ true }> Rule Type </T.Key>
                                        <T.Value>
                                            { !props.createMode && workflowSelectedOption ? (
                                                <div className="rule-type">
                                                    { workflowSelectedOption.icon }
                                                    { workflowSelectedOption.label }
                                                </div>) : (
                                                <Select
                                                    id="rule-type-select"
                                                    name="ruleType"
                                                    value={ workflowSelectedOption }
                                                    onChange={ (option) => {
                                                        setHasFormDefaultValues(false);
                                                        setRuleType(option.value);
                                                    } }
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
                            <Button disabled={ props.loading || (!props.createMode && !showEditWorkflowNotification) || !isValid } icon={ <i className="fas fa-save"/> } id="create-workflow-btn" variant="buttonPrimary" onClick={ formProps.handleSubmit(onSubmit) } text={ props.createMode ? 'Create' : 'Save Changes' }/>
                        </T.Footer>
                    </WorkflowEditorContainer>
                </T.Body>
            </Table>
        </TableContainer>
    );
};

export default WorkflowEditor;
