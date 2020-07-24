const regexpEmailAddress = /^\S+@\S+.\S+$/;
const regexpName = /^[\w+=,.@ -]+$/;

export function accountNameValidation(name) {
    if (name === '') {
        return { hasError: true, message: 'Field cannot be left blank.' };
    }
    if (name.length < 2) {
        return { hasError: true, message: 'Account name should be at least 2 characters long.' };
    }
    if (name.length > 64) {
        return { hasError: true, message: 'The length of the property is too long. The maximum length is 64.' };
    }
    if (!regexpName.test(name)) {
        return { hasError: true, message: 'Invalid account name.' };
    }
    return { hasError: false };
}

export function accountEmailValidation(email) {
    if (email === '') {
        return { hasError: true, message: 'Field cannot be left blank.' };
    }
    if (email.length > 256) {
        return { hasError: true, message: 'The length of the property is too long. The maximum length is 256.' };
    }
    if (!regexpEmailAddress.test(email)) {
        return { hasError: true, message: 'Invalid email address.' };
    }
    return { hasError: false };
}

export function accountQuotaValidation(quota) {
    if (quota === '') {
        return { hasError: false };
    }
    const quotaInt = parseInt(quota, 10);
    if (isNaN(quotaInt) || quotaInt < 0) {
        return { hasError: true, message: 'Quota has to be a positive number. 0 means no quota.' };
    }
    return { hasError: false };
}
