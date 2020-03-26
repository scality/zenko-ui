// @noflow
import { storageOptions } from '../settings/location/LocationDetails';

export function getLocationName(locationConstraint, configuration) {
    const constraint = locationConstraint || 'us-east-1'; // defaults to empty
    const locationType = configuration && configuration.locations[constraint] ? configuration.locations[constraint].locationType : '';
    const locationTypeName = storageOptions[locationType] ? storageOptions[locationType].name : '';
    return locationTypeName;
}

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
