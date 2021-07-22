//@flow
import Joi from '@hapi/joi';
import type { Node } from 'react';
import React from 'react';
import type { ReplicationForm } from '../../types/replication';
import type { WorkflowType } from '../../types/workflow';
import { newReplicationForm } from './workflowTypes/replication/utils';

export type WorkflowSelectOption = {|
    value: WorkflowType;
    label: string;
    icon: Node;
|};

export const renderWorkflowSelectOption = (option: WorkflowSelectOption): Node => (
    <div>
        { option.icon }
        { option.label }
    </div>
);

export const workflowSelectOptions: Array<WorkflowSelectOption> = [
    { value: 'replication', label: 'Replication', icon: <i className="fas fa-coins"/> },
];

export const workflowDefaultValues: { [type: WorkflowType]: ReplicationForm | null } = {
    replication: newReplicationForm(),
    expiration: null,
    transition: null,
};

export const defaultSelectedOption: WorkflowType | null = null; // no option

export const workflowSchemas: { [type: WorkflowType]: any } = {
    replication: Joi.object({
        sourceBucket: Joi.object({
            value: Joi.string().label('Bucket Name').required(),
            label: Joi.string(),
            disabled: Joi.boolean(),
            location: Joi.string(),
        }),
        sourcePrefix: Joi.string().label('Prefix').allow(''),
        destinationLocation: Joi.object({
            value: Joi.string().label('Destination Location Name').required(),
            label: Joi.string(),
        }),
    }),
    expiration: null,
    transition: null,
};
