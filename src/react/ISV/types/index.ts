import type React from 'react';
import type { DisabledMessageComponent, ISVCategory, ISVId } from '../engine/types';

// Re-export for convenience
export type { ISVCategory, ISVId } from '../engine/types';

export const ISV_CATEGORIES: { id: ISVCategory; label: string }[] = [
  { id: 'backup-and-archive', label: 'Backup and Archive Solutions' },
  { id: 'big-data-storage', label: 'Big Data Storage Solutions' },
  { id: 'cloud-and-edge-storage', label: 'Cloud and Edge Storage Solutions' },
];

/**
 * Base information for an ISV card display
 */
export type ISVInfo = {
  id: ISVId;
  name: string;
  logo: React.JSX.Element;
  disabledMessage?: DisabledMessageComponent;
};

/**
 * Configuration for ISV selection cards in the modal
 */
export type ISVCardConfig = ISVInfo & {
  application?: string;
  documentationLink: string;
  assistant?: boolean;
  category: ISVCategory;
};
