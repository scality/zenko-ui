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
  readonly sourceBucket: string;
  readonly sourcePrefix: string;
  // todo: allow multiple locations?
  readonly destinationLocation: string[];
};
