// @flow

export type ExpirationBucketOption = {|
    +label: string,
    +value: string,
    +location: string,
    +disabled: boolean,
|};

export type ExpirationForm = {|
    +workflowId: string;
    +workflowName: string;
    +sourceBucket: {
        label?: string,
        value?: string,
        // todo: to be removed?
        location?: string,
        disabled?: boolean,
    },
    +enabled: boolean;
    +objectKeyPrefix?: string;
    +objectKeyTag?: string;
    +expireCurrentVersionState: boolean;
    +expirePreviousVersionState: boolean;
    +expireOrphanDeleteMarkerState: boolean;
    +expireOrphanMPUState: boolean;
    +expireCurrentVersionDays: number;
    +expirePreviousVersionDays: number;
|};
