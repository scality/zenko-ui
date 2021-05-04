// @flow

export type AWSError = {
  +code: string, // a unique short code representing the error that was emitted.
  +message: string, // a longer human readable error message
  +retryable?: boolean, // whether the error message is retryable.
  +statusCode?: number, // in the case of a request that reached the service, this value contains the response status code.
  +hostname?: string, // set when a networking error occurs to easily identify the endpoint of the request.
  +region?: string, // set when a networking error occurs to easily identify the region of the request.
};
