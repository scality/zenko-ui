export type LabelFunction = (arg0: string) => string;
export type LocationCategory = 'crr' | 'scality' | 'public-cloud' | 'cold' | 'on-prem';
export type StorageOptionSelect = {
  value: string;
  label: string;
  disabled: boolean;
  category?: LocationCategory;
};
