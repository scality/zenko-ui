// @flow
import type { ConfigurationOverlay, Rules } from '../../types/config';
import type { ConfigurationAction } from '../../types/actions';
import type { ConfigurationState } from '../../types/state';
import { initialConfiguration } from './initialConstants';

const makeRules = (configuration: ConfigurationOverlay): Rules => {
    const replications = configuration.replicationStreams.map(r => {
        return {
            id: `replication-${r.streamId}`,
            type: 'replication',
            name: r.name,
            state: r.enabled,
            ruleId: r.streamId,
        };
    });
    // TODO: add expiration and transition rules.
    return replications;
};

export default function configuration(state: ConfigurationState = initialConfiguration, action: ConfigurationAction) {
    switch (action.type) {
    // case 'INSTANCE_STATUS': {
    //     const configurationOverlay = action.status && action.status.state &&
    //         action.status.state.latestConfigurationOverlay || initialConfiguration.latest;
    //     return {
    //         ...state,
    //         latest: configurationOverlay,
    //     };
    // }
    case 'CONFIGURATION_VERSION':
        return {
            ...state,
            latest: action.configuration,
            rules: makeRules(action.configuration),
        };
    default:
        return state;
    }
}
