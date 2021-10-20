// @flow

import { LoaderContainer } from './Container';
import { Loader as LoaderCoreUI } from '@scality/core-ui';
import type { Node } from 'react';
import React from 'react';

const Loader = ({ children }: { children: Node }) => (
  <LoaderContainer>
    <LoaderCoreUI size="massive">{children}</LoaderCoreUI>
  </LoaderContainer>
);

export default Loader;
