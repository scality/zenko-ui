export type LabelFunction = (arg0: string) => string;
export type StorageOptionSelect = {
  value: string;
  label: string;
  disabled: boolean;
  category?: 'crr' | 'scality' | 'public-cloud' | 'cold' | 'on-prem';
};
