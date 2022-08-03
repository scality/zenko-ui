import { Tooltip } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';

const ColdStorageIcon = () => {
  const tooltipMessages = [
    'The Temperature of this location is Cold.',
    'You can put your data in this Location through a "Transition" Workflow',
    'Once your data are in this Location, you can only trigger a request for restoration to get a temporary access to the object.',
  ];
  return (
    <Tooltip
      overlay={
        tooltipMessages.length > 1 ? (
          <Box pl={12}>
            {tooltipMessages.map((message, i) => (
              <li key={i}> {message} </li>
            ))}
          </Box>
        ) : (
          tooltipMessages[0]
        )
      }
      overlayStyle={{
        width: '30rem',
      }}
    >
      <i className="fas fa-snowflake" />
    </Tooltip>
  );
};

export default ColdStorageIcon;
