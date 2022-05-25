import { Tooltip } from '@scality/core-ui';

const ColdStorageIcon = () => {
  const coldStorageExp = (
    <>
      The Temperature of this location is Cold. <br />
      Cold storage cost usually less money. <br />
      You can put your data in this Location through a "Transition" Workflow.
      <br />
      Once your data are in this Location, you can only trigger a request for
      restoration to get a temporary access to the object. This restoration can
      be costly.
    </>
  );

  return (
    <Tooltip
      overlay={coldStorageExp}
      overlayStyle={{
        width: '20rem',
      }}
    >
      <i className="fas fa-snowflake" />
    </Tooltip>
  );
};

export default ColdStorageIcon;
