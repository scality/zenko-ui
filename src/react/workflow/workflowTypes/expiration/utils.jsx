// @flow
import type { Expiration, Expirations, Locations } from '../../../../types/config';
import type { ExpirationBucketOption, ExpirationForm } from '../../../../types/expiration';
import React from 'react';
import type { S3BucketList } from '../../../../types/s3';
import { getLocationTypeShort } from '../../../utils/storageOptions';

export const sourceBucketOptions = (expirations: Expirations, bucketList: S3BucketList): Array<ExpirationBucketOption> => {
    const buckets = bucketList.map(b => {
        const constraint = b.LocationConstraint || 'us-east-1'; // defaults to empty
        return {
            label: b.Name,
            value: b.Name,
            location: constraint,
            disabled: false,
        };
    });
    return buckets.toArray();
};

export const renderSource = (locations: Locations) => {
    return (function does(option: ExpirationBucketOption){
        return <div>
            <span> {option.label} </span>
            <small> ({option.location} / {getLocationTypeShort(option.location, locations)}) </small>
        </div>;
    });
};

export function newExpirationForm(): ExpirationForm {
    return {
        workflowId: '',
        workflowName: '',
        sourceBucket: {},
        enabled: true,
        objectKeyPrefix: '',
        objectKeyTag: '',
        expireCurrentVersionState: false,
        expirePreviousVersionState: false,
        expireOrphanDeleteMarkerState: false,
        expireOrphanMPUState: false,
        expireCurrentVersionDays: 1,
        expirePreviousVersionDays: 1,
    };
}

export function newExpiration(): Expiration {
    return {
        workflowId: '',
        name: '',
        enabled: true,
        bucketName: '',
        filter: {
            objectKeyPrefix: '',
            objectKeyTag: '',
        },
        currentVersionTriggerDelayDays: 1,
        previousVersionTriggerDelayDays: 1,
        expireMPU: false,
        expireOrphans: false,
    };
}

export function convertToExpirationForm(r: ?Expiration): ExpirationForm {
    if (!r) {
        return newExpirationForm();
    }

    return {
        workflowId: r.workflowId || '',
        workflowName: r.name || '',
        sourceBucket: {
            value: r.bucketName,
            label: r.bucketName,
        },
        enabled: true,
        objectKeyPrefix: r.filter.objectKeyPrefix || '',
        objectKeyTag: r.filter.objectKeyTag || '',
        expireCurrentVersionState: true,
        expirePreviousVersionState: true,
        expireOrphanDeleteMarkerState: true,
        expireOrphanMPUState: true,
        expireCurrentVersionDays: r.currentVersionTriggerDelayDays || 1,
        expirePreviousVersionDays: r.previousVersionTriggerDelayDays || 1,
    };
}

export function convertToExpiration(r: ExpirationForm): Expiration {
    if (!r) {
        return newExpiration();
    }
    return {
        workflowId: r.workflowId || '',
        bucketName: r.sourceBucket.value || '',
        name: r.workflowName,
        enabled: r.enabled,
        filter: {
            objectKeyPrefix: r.objectKeyPrefix || '',
            objectKeyTag: r.objectKeyTag || '',
        },
        currentVersionTriggerDelayDays: r.expireCurrentVersionDays || undefined,
        previousVersionTriggerDelayDays: r.expirePreviousVersionDays || undefined,
        expireMPU: r.expireOrphanMPUState,
        expireOrphans: r.expireOrphanDeleteMarkerState,
    };
}
