import { Loader } from '@scality/core-ui/dist/components/loader/Loader.component';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useIsFetching } from 'react-query';
import styled from 'styled-components';

// TODO: Re-enable Activity spinner after confirming display conditions.
// Previously used Redux networkActivity.counter to show spinner only for specific operations.
// Current implementation uses useIsFetching() which triggers on ALL React Query fetches.
// Need to determine: which operations should show global spinner vs local loading states.
const ACTIVITY_ENABLED = false;

export const DEFAULT_MESSAGE = 'Loading...';

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
  const isFetching = useIsFetching();

  if (!ACTIVITY_ENABLED || isFetching === 0) {
    return null;
  }

  return (
    <ActivityContainer id="activity-message">
      <Loader size="base" />
      {DEFAULT_MESSAGE}
    </ActivityContainer>
  );
};

export default Activity;
