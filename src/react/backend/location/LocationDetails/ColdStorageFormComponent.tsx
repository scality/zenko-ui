import { Stack, Text } from '@scality/core-ui';
import ColdStorageIcon from '../../../ui-elements/ColdStorageIcon';

export const ColdLocationTemperatureTooltip = () => {
  return (
    <>
      The Temperature of this Location is Cold.
      <br /> <br /> You can move your data in this Location through a Transition
      Workflow.
      <br /> <br />
      Once your data are in this Location, you can only trigger a request for
      restoration to get a temporary access to the object.
    </>
  );
};

export const ColdLocationIcon = () => {
  return (
    <Stack>
      <ColdStorageIcon />{' '}
      <Text color="textSecondary" isEmphazed>
        Cold
      </Text>
    </Stack>
  );
};
