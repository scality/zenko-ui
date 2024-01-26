import { Loader } from '@scality/core-ui';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import type { AppState } from '../../types/state';
export const DEFAULT_MESSAGE = 'Working...';
const ActivityContainer = styled.div`
  position: fixed;
  bottom: 0px;
  right: 0px;
  padding: 1em;
  margin: 2em;
  background-color: ${(props) => props.theme.highlight};
  border-radius: ${spacing.sp8};
  vertical-align: 50%;
  z-index: 1100;

  .sc-loader {
    margin-right: 1em;
    float: left;
  }

  svg {
    fill: ${(props) =>
      //@ts-expect-error fix this when you are working on it
      props.theme.text};
  }
`;

const Activity = () => {
  const working = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const message = useSelector((state: AppState) =>
    state.networkActivity.messages.first(),
  );

  if (!working) {
    return null;
  }

  return (
    <ActivityContainer id="activity-message">
      <Loader size="base" />
      {message || DEFAULT_MESSAGE}
    </ActivityContainer>
  );
};

export default Activity;
