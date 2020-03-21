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
    case 'INSTANCE_STATUS': {
        const configurationOverlay = action.status && action.status.state &&
            action.status.state.latestConfigurationOverlay || initialConfiguration.latest;
        return {
            ...state,
            latest: configurationOverlay,
        };
    }
    case 'CONFIGURATION_VERSION':
        return {
            ...state,
            latest: action.configuration,
        };
    default:
        return state;
    }
}
