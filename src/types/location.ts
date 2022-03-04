import type { LocationDetails, LocationName, LocationType } from './config';
export type LocationFormOptions = {
  readonly isTransient: boolean;
  readonly isBuiltin: boolean;
  readonly isSizeLimitChecked: boolean;
  readonly sizeLimitGB?: string;
  readonly legacyAwsBehavior?: boolean;
};
export type LocationForm = {
  readonly name: LocationName;
  readonly locationType: LocationType;
  readonly details: LocationDetails;
  readonly objectId: string;
  readonly options: LocationFormOptions;
};