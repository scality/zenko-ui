import {
    addTrailingSlash,
    errorParser,
    formatBytes,
    formatDate,
    maybePluralize,
    stripQuotes,
    stripTrailingSlash,
} from '../index';

describe('functions utils', () => {
    const errorMessages = [
        'This is an error message #1',
        'The request is missing valid authentication credentials.',
        'Access to the requested item was denied.',
        'The requested item does not exist.',
        'An item with the same identifier already exists.',
        'The server is temporarily unavailable.',
        'This is an error message #2',
    ];

    const tests = [
        {
            it: 'should return the error message contains in error.response.body.message if exists',
            error: {
                response: {
                    body: {
                        message: errorMessages[0],
                    },
                },
            },
            expectedErrorMessage: errorMessages[0],
        },
        {
            it: `should return the error message: "${errorMessages[1]}" if status code is 401`,
            error: {
                status: 401,
            },
            expectedErrorMessage: errorMessages[1],
        },
        {
            it: `should return the error message: "${errorMessages[2]}" if status code is 403`,
            error: {
                status: 403,
            },
            expectedErrorMessage: errorMessages[2],
        },
        {
            it: `should return the error message: "${errorMessages[3]}" if status code is 404`,
            error: {
                status: 404,
            },
            expectedErrorMessage: errorMessages[3],
        },
        {
            it: `should return the error message: "${errorMessages[4]}" if status code is 409`,
            error: {
                status: 409,
            },
            expectedErrorMessage: errorMessages[4],
        },
        {
            it: `should return the error message: "${errorMessages[5]}" if status code is 500`,
            error: {
                status: 500,
            },
            expectedErrorMessage: errorMessages[5],
        },
        {
            it: `should return the error message: "${errorMessages[5]}" if status code is 503`,
            error: {
                status: 503,
            },
            expectedErrorMessage: errorMessages[5],
        },
        {
            it: 'should return the error message contains in error.message if exists',
            error: {
                message: errorMessages[6],
            },
            expectedErrorMessage: errorMessages[6],
        },
        {
            it: 'should return the status code if no message exists in the error object and status code is not handled',
            error: {
                status: 501,
            },
            expectedErrorMessage: 'Failed with error status: 501',
        },
    ];

    tests.forEach(t => {
        it(`${t.it}`, () => {
            expect(errorParser(t.error).message).toBe(t.expectedErrorMessage);
        });
    });

    it('should return a formatted date', () => {
        const date = 'Mon Oct 12 2020 17:28:03';

        expect(formatDate(new Date(date))).toBe(date);
    });

    it('should return a string formatted which reflect the size', () => {
        expect(formatBytes(0)).toBe('0 Bytes');
        expect(formatBytes(1)).toBe('1 Bytes');
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(10240000)).toBe('9.77 MB');
        expect(formatBytes(10240000000)).toBe('9.54 GB');
        expect(formatBytes(10240000000000)).toBe('9.31 TB');
        expect(formatBytes(10240000000000000)).toBe('9.09 PB');
        expect(formatBytes(10240000000000000000)).toBe('8.88 EB');
        expect(formatBytes(10240000000000000000000)).toBe('8.67 ZB');
        expect(formatBytes(10240000000000000000000000)).toBe('8.47 YB');
        expect(formatBytes(10240000000000000000000000, 1)).toBe('8.5 YB');
    });

    const urls = ['', '/buckets/', '/buckets', '/buckets/bucket1', '/buckets/bucket1/test/'];

    it('should return a string with a trailing slash removed at the end if exists', () => {
        urls.forEach(url => {
            expect(stripTrailingSlash(url).slice(-1)).not.toBe('/');
        });
    });

    it('should return a string with a trailing slash added at the end if no exists', () => {
        urls.forEach(url => {
            expect(addTrailingSlash(url).slice(-1)).toBe(url === '' ? '' : '/');
        });
    });

    it('should return a string which pluralize the noun taken in params in count > 1', () => {
        const nounFile = 'file';
        const nounBox = 'box';

        expect(maybePluralize(1, nounFile)).toBe(`1 ${nounFile}`);
        expect(maybePluralize(2, nounFile)).toBe(`2 ${nounFile}s`);
        expect(maybePluralize(2, nounBox, 'es')).toBe(`2 ${nounBox}es`);
    });

    it('should return a string without quotes if exists at the beginning and the end of the string else return string', () => {
        expect(stripQuotes('"test with quotes"')).toBe('test with quotes');
        expect(stripQuotes('test without quotes')).toBe('test without quotes');
    });
});
