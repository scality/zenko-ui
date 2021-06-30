// @flow
import type { Node } from 'react';

export type LabelFunction = (string) => Node;

export type StorageOptionSelect = {|
    value: string,
    label: Node,
    disabled: boolean,
|};
