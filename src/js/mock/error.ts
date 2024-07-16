import { AWSError } from '../../types/aws';
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
export function awsErrorObject(message: string, code: string): AWSError {
  return {
    code,
    message,
  };
}
