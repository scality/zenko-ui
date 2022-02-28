//@flow
import React from 'react';
import styled from 'styled-components';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { COPY_STATE_SUCCESS, useClipboard } from '../utils/hooks';

const InlineButton = styled(Button)`
  height: ${spacing.sp24};
  margin-left: ${spacing.sp16};
  // To prevent the change of the width when the label change
  width: 110px;
`;
const IconSuccess = styled.i`
  color: ${props => props.theme.brand.statusHealthy};
`;

const CopyARNButton = ({ text }: { text: string }) => {
  const { copy, copyStatus } = useClipboard();

  return (
    <InlineButton
      variant="outline"
      label={copyStatus === COPY_STATE_SUCCESS ? 'Copied !' : 'Copy ARN'}
      icon={
        copyStatus === COPY_STATE_SUCCESS ? (
          <IconSuccess className="fas fa-check" />
        ) : (
          <i className="far fa-clone" />
        )
      }
      onClick={() => {
        copy(text);
      }}
    />
  );
};
export default CopyARNButton;
