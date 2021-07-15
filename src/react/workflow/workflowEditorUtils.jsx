//@flow
import type { Element } from 'react';
import { Icon } from '@scality/core-ui';
import Joi from '@hapi/joi';
import React from 'react';
import type { WorkflowType } from '../../types/workflow';
import { newExpirationForm } from './workflowTypes/expiration/utils';
import { newReplicationForm } from './workflowTypes/replication/utils';

export type WorkflowSelectOption = {|
    value: WorkflowType;
    label: string;
    icon: Element<typeof Icon>;
|};

export const workflowSelectOptions: Array<WorkflowSelectOption> = [
    { value: 'replication', label: 'Replication', icon: <Icon name="Replication"/> },
    { value: 'expiration', label: 'Expiration', icon: <Icon name="Expiration"/> },
];

export const workflowDefaultValues: { [type: WorkflowType]: any } = {
    replication: newReplicationForm(),
    expiration: newExpirationForm(),
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
    expiration: Joi.object({
        workflowName: Joi.string().label('Name').min(4).required(),
        objectKeyPrefix: Joi.string().label('Prefix').allow(''),
        objectKeyTag: Joi.string().label('Tag').allow(''),
        expireCurrentVersionState: Joi.boolean().when('expirePreviousVersionState', {
            is: false,
            then: Joi.disallow(false),
        }),
        expirePreviousVersionState: Joi.boolean(),
        expireOrphanDeleteMarkerState: Joi.boolean().when('expireCurrentVersionState', {
            is: true,
            then: Joi.valid(false).disallow(true),
        }),
        expireOrphanMPUState: Joi.boolean(),
        expireCurrentVersionDays: Joi.number().min(1).when('expireCurrentVersionState', {
            is: true,
            then: Joi.optional(),
            otherwise: Joi.required(),
        }),
        expirePreviousVersionDays: Joi.number().min(1).when('expirePreviousVersionState', {
            is: true,
            then: Joi.optional(),
            otherwise: Joi.required(),
        }),
        sourceBucket: Joi.object({
            value: Joi.string().label('Bucket Name').required(),
            label: Joi.string(),
            disabled: Joi.boolean(),
            location: Joi.string(),
        }),
    }),
    transition: null,
};
