export class ApiErrorObject extends Error {
  code: number | string;
  status: number | string;
  message: string;
  response: Record<string, any>;

  constructor(message: string, status: string | number) {
    super(message);
    this.response = {
      body: {
        message,
      },
    };
    this.status = status === undefined ? 500 : status;
  }
}

export type MockAWSError = {
  code: string;
  message: string;
};

export function awsErrorObject(message: string, code: string): MockAWSError {
  return {
    code,
    message,
  };
}
