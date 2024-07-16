import { Location } from './config';

export type LocationFormOptions = {
  readonly isTransient: boolean;
  readonly isBuiltin: boolean;
  readonly isSizeLimitChecked: boolean;
  readonly sizeLimitGB?: string;
  readonly legacyAwsBehavior?: boolean;
};

export type LocationForm = Location & {
  readonly objectId: string;
  readonly options: LocationFormOptions;
};
