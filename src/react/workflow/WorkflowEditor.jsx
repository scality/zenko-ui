//@flow
import { Button, Select } from '@scality/core-ui/dist/next';
import React, { useEffect, useState } from 'react';
import Table, * as T from '../ui-elements/TableKeyValue2';
import type { Workflow as WorkflowRule, WorkflowType } from '../../types/workflow';
import {
    closeWorkflowDeleteModal,
    deleteWorkflow,
    openWorkflowDeleteModal,
    openWorkflowEditNotification,
    saveExpiration,
    saveReplication,
} from '../actions';
import { convertToReplicationStream, generateStreamName } from './workflowTypes/replication/utils';
import {
    defaultSelectedOption,
    workflowDefaultValues,
    workflowSchemas,
    workflowSelectOptions,
} from './workflowEditorUtils';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Banner } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import Expiration from './workflowTypes/expiration/Expiration';
import Input from '../ui-elements/Input';
import Joi from '@hapi/joi';
import type { Locations } from '../../types/config';
import { NoLocationWarning } from '../ui-elements/Warning';
import Replication from './workflowTypes/replication/Replication';
import type { WorkflowSelectOption } from './workflowEditorUtils';
import { checkIfExternalLocation } from '../utils/storageOptions';
import { compareObjectKeys } from '../utils';
import { convertToExpiration } from './workflowTypes/expiration/utils';
import { joiResolver } from '@hookform/resolvers';
import { push } from 'connected-react-router';
import { spacing } from '@scality/core-ui/dist/style/theme';
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
    padding-top: ${spacing.sp16};
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
    wfSelected: ?WorkflowRule,
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
        } else if (ruleType === 'expiration') {
            const expiration = values;
            let s = convertToExpiration(expiration);
            dispatch(saveExpiration(s));
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
        case 'expiration':
            form = <Expiration { ...ruleProps }/>;
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

    if (!checkIfExternalLocation(props.locations)) {
        return <NoLocationWarning/>;
    }

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
                            <Button icon={ <i className="fas fa-trash"/> } label="Delete Rule" variant="danger" onClick={ handleOpenDeleteModal }/>
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
                                                    value={ workflowSelectedOption ? workflowSelectedOption.value : null }
                                                    onChange={ (value) => {
                                                        setHasFormDefaultValues(false);
                                                        setRuleType(value);
                                                    } }
                                                    isDisabled={ !props.createMode }
                                                >
                                                    {workflowSelectOptions.map((opt, i) => <Select.Option key={i} value={opt.value} icon={opt.icon}>{opt.label}</Select.Option>)}
                                                </Select>
                                            ) }
                                        </T.Value>
                                    </T.Row>
                                </T.GroupContent>
                            </T.Group>
                            { ruleForm() }
                        </T.Groups>
                        <T.Footer>
                            <Button disabled={ props.loading || !props.createMode && !showEditWorkflowNotification } id="cancel-workflow-btn" style={ { marginRight: spacing.sp24 } } variant="outline" onClick={ handleCancel } label="Cancel"/>
                            <Button disabled={ props.loading || (!props.createMode && !showEditWorkflowNotification) || !isValid } icon={<i className="fas fa-save" />} id='create-workflow-btn' variant="primary" onClick={formProps.handleSubmit(onSubmit)} label={props.createMode ? 'Create' : 'Save Changes'}/>
                        </T.Footer>
                    </WorkflowEditorContainer>
                </T.Body>
            </Table>
        </TableContainer>
    );
};

export default WorkflowEditor;
