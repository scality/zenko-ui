// @flow

import type {
    ManagementClient as ManagementClientInterface,
} from '../../types/managementClient';

export class MockManagementClient implements ManagementClientInterface {
    // getConfigurationOverlayView(): Promise<ApiConfigurationResponse> {
    //     return Promise.resolve({
    //         body: latestOverlay,
    //     });
    // }
}
