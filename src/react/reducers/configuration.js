// @noflow

export default function configuration(state={}, action) {
    switch (action.type) {
    case  'CONFIGURATION_VERSION':
        return {
            ...state,
            latest: action.configuration,
        };
    default:
        return state;
    }
}
