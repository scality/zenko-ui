export type AWSError = {
  readonly code: string;
  // a unique short code representing the error that was emitted.
  readonly message: string;
  // a longer human readable error message
  readonly retryable?: boolean;
  // whether the error message is retryable.
  readonly statusCode?: number;
  // in the case of a request that reached the service, this value contains the response status code.
  readonly hostname?: string;
  // set when a networking error occurs to easily identify the endpoint of the request.
  readonly region?: string; // set when a networking error occurs to easily identify the region of the request.
};