import { SpacedBox, Tooltip } from '@scality/core-ui';

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
          <SpacedBox pl={12}>
            {tooltipMessages.map((message, i) => (
              <li key={i}> {message} </li>
            ))}
          </SpacedBox>
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
