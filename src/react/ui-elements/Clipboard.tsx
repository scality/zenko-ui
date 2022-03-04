import React from 'react';
import styled from 'styled-components';
import { COPY_STATE_SUCCESS, useClipboard } from '../utils/hooks';
const Container = styled.div`
  cursor: pointer;
`;
export const IconSuccess = styled.i`
  color: ${(props) => props.theme.brand.success};
`;
export const IconCopy = styled.i`
  color: ${(props) => props.theme.brand.textSecondary};
  display: ${(props) => (props.hidden ? 'none' : 'block')};
`;
export const Clipboard = ({ text }: { text: string }) => {
  const { copy, copyStatus } = useClipboard();
  return (
    <Container>
      {copyStatus === COPY_STATE_SUCCESS ? (
        <IconSuccess className="fas fa-check"></IconSuccess>
      ) : (
        <IconCopy
          hidden={!navigator || !navigator.clipboard}
          className="far fa-clone"
          onClick={() => copy(text)}
        ></IconCopy>
      )}
    </Container>
  );
};