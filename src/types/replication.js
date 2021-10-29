// @flow

export type ReplicationBucketOption = {|
  +label: string,
  +value: string,
  +location: string,
  +disabled: boolean,
|};

export type ReplicationForm = {|
  +streamName: string,
  +streamVersion: number,
  +streamId: string,
  +enabled: boolean,
  +sourceBucket: {
    label?: string,
    value?: string,
    // todo: to be removed?
    location?: string,
    disabled?: boolean,
  },
  +sourcePrefix: string,
  // todo: allow multiple locations?
  +destinationLocation: {
    label?: string,
    value?: string,
  },
  preferredReadLocation: string | null,
|};
