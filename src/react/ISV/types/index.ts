import React from 'react';
import type { DisabledMessageComponent, ISVId } from '../engine/types';

// Re-export ISVId for convenience
export type { ISVId } from '../engine/types';

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
};
