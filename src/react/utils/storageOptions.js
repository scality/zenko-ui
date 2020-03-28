// @noflow
import { storageOptions } from '../monitor/location/LocationDetails';

export function getLocationType(locationType) {
    const locationTypeName = storageOptions[locationType] ? storageOptions[locationType].name : '';
    return locationTypeName;
}

export function getLocationTypeFromName(locationConstraint, configuration) {
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
    return Object.keys(storageOptions).filter(o => {
        const isOldVersion = !!storageOptions[o].isOldVersion;
        if (isOldVersion) {
            return;
        }
        return o;
    }).map(o => {
        const check = storageOptions[o].checkCapability;
        return {
            value: o,
            label: labelFn ? labelFn(o, assetRoot) : o,
            disabled: !!check && !!capabilities && !capabilities[check],
        };
    });
}

export function locationWithIngestion(locations, capabilities) {
    return Object.keys(locations).reduce((r, key) => {
        const locationType = locations[key].locationType;
        r.push({ value: key, locationType, mirrorMode: false });
        const ingestCapability = storageOptions[locationType].ingestCapability;
        if (!!ingestCapability && !!capabilities[ingestCapability]) {
            if (locationType === 'location-nfs-mount-v1' || (locations[key].details && locations[key].details.bucketMatch)) {
                r.push({ value: `${key}:ingest`, locationType, mirrorMode: true });
            }
        }
        return r;
    }, []);
}
