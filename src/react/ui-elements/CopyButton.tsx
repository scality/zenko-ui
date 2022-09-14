import { Icon } from '@scality/core-ui';
import styled from 'styled-components';
import { COPY_STATE_SUCCESS, useClipboard } from '../utils/hooks';
import { IconSuccess } from './Icons';
import { InlineButton } from './Table';
const InlineButtonFixedWidth = styled(InlineButton)`
  width: 7.5rem;
`;

type Props = {
  text: string;
  labelName?: string;
};

const CopyButton = ({ text, labelName, ...rest }: Props) => {
  const { copy, copyStatus } = useClipboard();
  return (
    <InlineButtonFixedWidth
      variant="outline"
      label={
        copyStatus === COPY_STATE_SUCCESS ? 'Copied !' : `Copy ${labelName}`
      }
      icon={
        copyStatus === COPY_STATE_SUCCESS ? (
          <IconSuccess name="Check" />
        ) : (
          <Icon name="Copy" />
        )
      }
      onClick={(e) => {
        if (e) {
          e.preventDefault();
        }
        copy(text);
      }}
      {...rest}
    />
  );
};

export default CopyButton;
