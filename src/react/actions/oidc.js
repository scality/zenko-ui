export function userFound(user) {
    return {
        type: 'USER_FOUND',
        payload: user,
    };
}
