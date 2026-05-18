export const COLD_LOCATION_TYPES = [
  'location-aws-glacier-v1',
  'location-scaleway-glacier-v1',
] as const;

export type ColdLocationType = (typeof COLD_LOCATION_TYPES)[number];

export const isColdLocationType = (type: string): type is ColdLocationType =>
  (COLD_LOCATION_TYPES as readonly string[]).includes(type);
