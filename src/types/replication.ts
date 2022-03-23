export type ReplicationBucketOption = {
  readonly label: string;
  readonly value: string;
  readonly location: string;
  readonly disabled: boolean;
};
export type ReplicationForm = {
  readonly streamVersion: number;
  readonly streamId: string;
  readonly enabled: boolean;
  readonly sourceBucket: {
    label?: string;
    value?: string;
    // todo: to be removed?
    location?: string;
    disabled?: boolean;
  };
  readonly sourcePrefix: string;
  // todo: allow multiple locations?
  readonly destinationLocation: {
    label?: string;
    value?: string;
  };
}
