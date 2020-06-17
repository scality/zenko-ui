// @flow

export class ApiErrorObject extends Error {
    code: number | string;
    status: number | string;
    message: string;

    constructor(message: string, status: string | number) {
        super(message);
        this.message = message;
        this.status = status === undefined ? 500 : status;
        this.code = this.status;
    }
}
