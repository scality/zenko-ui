// @flow
import type { Locations, Replication as ReplicationStream, ReplicationStreams } from '../../../types/config';
import type { ReplicationBucketOption, ReplicationForm } from '../../../types/replication';
import type { BucketList } from '../../../types/stats';
import React from 'react';
import type { SelectOption } from '../../../types/ui';
import { getLocationTypeShort } from '../../utils/storageOptions';
import { storageOptions } from '../../backend/location/LocationDetails';

export const sourceBucketOptions = (streams: ReplicationStreams, bucketList: BucketList, locations: Locations): Array<ReplicationBucketOption> => {
    const bucketsUsedForReplication = streams.map(
        stream => stream.source.bucketName);
    const buckets = bucketList.map(b => {
        const locationType = locations[b.location]
            .locationType;
        const { supportsReplicationSource } =
            storageOptions[locationType];
        return {
            label: b.name,
            value: b.name,
            location: b.location,
            disabled: bucketsUsedForReplication.indexOf(b.name) > -1 ||
                !supportsReplicationSource,
        };
    });
    return buckets;
};

export const destinationOptions = (locations: Locations): Array<SelectOption> => {
    return Object.keys(locations)
        .filter(n => {
            const locationType = locations[n].locationType;
            return storageOptions[locationType].supportsReplicationTarget;
            // && destinationLocations.every((location => location.name !== n));
        }).map(n => {
            return {
                value: n,
                label: n,
            };
        });
};

export const renderSource = (locations: Locations) => {
    return (function does(option: ReplicationBucketOption){
        return <div>
            <span> {option.label} </span>
            <small> ({option.location} / {getLocationTypeShort(option.location, locations)}) </small>
        </div>;
    });
};

export const renderDestination = (locations: Locations) => {
    return (function does(option: SelectOption){
        return <div>
            <span> {option.label} </span>
            <small> ({getLocationTypeShort(option.value, locations)}) </small>
        </div>;
    });
};

export function newReplicationForm(): ReplicationForm {
    return {
        streamName: '',
        streamVersion: 1,
        streamId: '',
        enabled: true,
        sourceBucket: {},
        sourcePrefix: '',
        destinationLocation: {},
        preferredReadLocation: null,
    };
}

export function newReplicationStream(): ReplicationStream {
    return {
        streamId: '',
        name: '',
        version: 1,
        enabled: true,
        source: {
            prefix: null,
            bucketName: '',
        },
        destination: {
            locations: [],
            preferredReadLocation: null,
        },
    };
}

export function convertToReplicationForm(r: ReplicationStream): ReplicationForm {
    if (!r) {
        return newReplicationForm();
    }
    return {
        streamName: r.name || '',
        streamVersion: r.version || 1,
        streamId: r.streamId || '',
        enabled: r.enabled,
        sourceBucket: {
            value: r.source.bucketName,
            label: r.source.bucketName,
        },
        sourcePrefix: r.source.prefix || '',
        destinationLocation: {
            label: r.destination.locations[0].name,
            value: r.destination.locations[0].name,
        },
        preferredReadLocation: null,
    };
}

export function convertToReplicationStream(r: ReplicationForm): ReplicationStream {
    if (!r) {
        return newReplicationStream();
    }
    return {
        streamId: r.streamId || '',
        name: r.streamName || '',
        version: r.streamVersion || 1,
        enabled: !!r.enabled,
        source: {
            prefix: r.sourcePrefix || '',
            bucketName: r.sourceBucket.value || '',
        },
        destination: {
            locations: [{ name: r.destinationLocation.value || '', storageClass: 'standard' }] || [],
            preferredReadLocation: r.preferredReadLocation,
        },
    };
}

export function generateStreamName(bucketName: string, destinationName: string): string {
    return `${bucketName} ➜ ${destinationName}`;
}
