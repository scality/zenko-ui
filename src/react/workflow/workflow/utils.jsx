//@flow
import Joi from '@hapi/joi';
import type { Node } from 'react';
import React from 'react';
import type { WorkflowType } from '../../../types/workflow';

export type WorkflowSelectOption = {|
    value: WorkflowType;
    label: string;
    icon: Node;
|};

export const renderWorkflowSelectOption = (option: WorkflowSelectOption) => (
    <div>
        { option.icon }
        { option.label }
    </div>
);

export const workflowSelectOptions: Array<WorkflowSelectOption> = [
    { value: 'replication', label: 'Replication', icon: <i className="fas fa-coins"/> },
];

export const defaultSelectedOption = null; // no option

export const workflowSchemas = {
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
