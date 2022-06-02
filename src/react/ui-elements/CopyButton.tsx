import styled from 'styled-components';
import { COPY_STATE_SUCCESS, useClipboard } from '../utils/hooks';
import { InlineButton } from './Table';
const InlineButtonFixedWidth = styled(InlineButton)`
  width: 7.5rem;
`;
const IconSuccess = styled.i`
  color: ${(props) => props.theme.brand.statusHealthy};
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
          <IconSuccess className="fas fa-check" />
        ) : (
          <i className="far fa-clone" />
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
