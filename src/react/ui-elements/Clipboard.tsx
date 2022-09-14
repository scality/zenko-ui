import React from 'react';
import styled from 'styled-components';
import { COPY_STATE_SUCCESS, useClipboard } from '../utils/hooks';
import { Icon } from '@scality/core-ui';
import { IconCopy, IconSuccess } from './Icons';
const Container = styled.span`
  cursor: pointer;
`;

export const Clipboard = ({ text }: { text: string }) => {
  const { copy, copyStatus } = useClipboard();
  const isClipboard = Boolean(navigator?.clipboard);
  return (
    <Container>
      {copyStatus === COPY_STATE_SUCCESS ? (
        <IconSuccess name="Check" />
      ) : (
        isClipboard && <IconCopy name="Copy" onClick={() => copy(text)} />
      )}
    </Container>
  );
};
