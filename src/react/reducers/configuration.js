// @noflow
export const initialConfiguration = {
    latest: {
        version: 1,
        updatedAt: '2017-09-28T19:39:22.191Z',
        creator: 'initial',
        instanceId: 'demo-instance',
        locations: {},
        replicationStreams: [],
        users: [],
        endpoints: [],
        workflows: {
            lifecycle: {},
            transition: {},
        },
    },
};

export default function configuration(state=initialConfiguration, action) {
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
