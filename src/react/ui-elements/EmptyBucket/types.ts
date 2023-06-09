import { S3 } from 'aws-sdk';

export enum DeleteStatus {
  DELETED = 'Success',
  ERROR = 'Error',
}

export type DeleteResult = S3.DeletedObject | S3.Error;
export type DeleteSummary = {
  attempts: number;
  deleted: number;
  errors: {
    nbErrors: number;
    messages?: string[];
  };
};
export type DeleteResultData = DeleteResult & { status: DeleteStatus | string };
export type TableDeleteResultData = DeleteResultData & { [x: string]: number };
export type TableDeleteSummaryData = DeleteSummary & { [x: string]: number };

export type DelimiterType = Pick<
  S3.ListObjectVersionsRequest,
  'KeyMarker' | 'VersionIdMarker'
>;

export type ErrorsList = {
  message: string;
  errorNumbers: number;
};

export type ErrorsListData = ErrorsList & { [x: string]: number };
