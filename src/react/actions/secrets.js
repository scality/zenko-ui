export function addSecret(keys) {
    return {
        type: 'ADD_SECRET',
        keys,
    };
}

export function deleteSecret(accessKey) {
    return {
        type: 'DELETE_SECRET',
        accessKey,
    };
}
