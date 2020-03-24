// @noflow
import { storageOptions } from '../settings/location/LocationDetails';

export function selectStorageOptions(
    assetRoot: string,
    capabilities: $PropertyType<InstanceStateSnapshot, 'capabilities'>,
    labelFn?: LabelFunction,
): Array<StorageOptionSelect> {
    console.log('capabilities!!!', capabilities);
    return Object.keys(storageOptions).filter(o => {
        const isOldVersion = !!storageOptions[o].isOldVersion;
        if (isOldVersion) {
            return;
        }
        return o;
    }).map(o => {
        const check = storageOptions[o].checkCapability;
        console.log('disabled!!!', !!check && !!capabilities && !capabilities[check]);
        return {
            value: o,
            label: labelFn ? labelFn(o, assetRoot) : o,
            disabled: !!check && !!capabilities && !capabilities[check],
        };
    });
}
