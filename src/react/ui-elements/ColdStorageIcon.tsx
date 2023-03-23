import { Icon, IconHelp, Stack, Text } from '@scality/core-ui';

const ColdStorageTemperatureToolTip = () => {
  return (
    <IconHelp
      placement="top"
      overlayStyle={{ width: '24rem' }}
      tooltipMessage={
        <>
          The Temperature of this Location is Cold.
          <br /> <br />
          You can move your data in this Location through a Transition Workflow.
          <br /> <br />
          Once your data are in this Location, you can only trigger a request
          for restoration to get a temporary access to the object.
        </>
      }
    />
  );
};

export const ColdStorageIconLabel = ({ label = 'Cold' }) => {
  return (
    <Stack>
      <Icon name="Snowflake" />
      <Text color="textSecondary" isEmphazed>
        {label}
      </Text>
      <ColdStorageTemperatureToolTip />
    </Stack>
  );
};

export const ColdStorageIcon = () => {
  return (
    <Stack>
      <Icon name="Snowflake" />
      <ColdStorageTemperatureToolTip />
    </Stack>
  );
};
