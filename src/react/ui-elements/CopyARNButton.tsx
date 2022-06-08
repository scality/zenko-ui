import styled from 'styled-components';
import { COPY_STATE_SUCCESS, useClipboard } from '../utils/hooks';
import { InlineButton } from './Table';
const InlineButtonFixedWidth = styled(InlineButton)`
  width: 7.5rem;
`;
const IconSuccess = styled.i`
  color: ${(props) => props.theme.brand.statusHealthy};
`;

const CopyARNButton = ({ text, ...rest }: { text: string }) => {
  const { copy, copyStatus } = useClipboard();
  return (
    <InlineButtonFixedWidth
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
      {...rest}
    />
  );
};

export default CopyARNButton;
