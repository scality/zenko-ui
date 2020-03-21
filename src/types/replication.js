// @flow

export type TargetLocationObject = {|
    name: string,
    storageClass: string,
|};

export type ReplicationSource = {|
    +prefix: string | null,
    +bucketName: string,
    +location?: string,
|};

export type Replication = {|
    +streamId: string,
    +name: string,
    +version: number,
    +enabled: boolean,
    +source: ReplicationSource,
    +destination: {|
        +bucketName?: string,
        +locations: Array<TargetLocationObject>,
        +preferredReadLocation?: string | null,
    |},
|};
