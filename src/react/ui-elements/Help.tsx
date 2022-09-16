import { Tooltip } from '@scality/core-ui';
import * as Core from '@scality/core-ui';
import { IconName } from '@scality/core-ui/dist/components/icon/Icon.component';
import React, { CSSProperties } from 'react';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';

export const Icon = ({
  name,
  size,
  style,
}: {
  name: IconName;
  size?: SizeProp;
  style: CSSProperties;
}) => (
  <Core.Icon
    size={size}
    name={name}
    color="buttonSecondary"
    style={{ ...style, marginLeft: spacing.sp8 }}
  />
);

type IconHelpProps = {
  tooltipMessage: React.ReactNode;
  iconClass?: string;
  tooltipWidth?: string;
  placement?: string;
};
export const IconHelp = ({
  tooltipMessage,
  iconClass = 'fas fa-question-circle',
  tooltipWidth,
  placement = 'right',
}: IconHelpProps) => (
  <Tooltip
    overlay={tooltipMessage}
    placement={placement}
    overlayStyle={{
      width: tooltipWidth,
    }}
  >
    <Icon className={iconClass}></Icon>
  </Tooltip>
);
export const HelpAsyncNotification = () => (
  <IconHelp
    placement="top"
    tooltipWidth="16rem"
    tooltipMessage="Pause/resume Async Metadata updates is handled at the location level."
  />
);
export const HelpNonAsyncLocation = () => (
  <IconHelp
    placement="top"
    tooltipWidth="16rem"
    tooltipMessage="Selected Storage Location does not support Async Metadata updates."
  />
);
export const HelpAsyncNotifPending = () => (
  <IconHelp
    placement="top"
    tooltipWidth="16rem"
    tooltipMessage={
      <>
        Enable Async Metadata updates for this location <br />
        by choosing Enable Async Metadata updates while <br />
        creating a bucket for this location.
      </>
    }
  />
);
export const HelpLocationCreationAsyncNotification = () => (
  <IconHelp
    placement="top"
    tooltipWidth="24rem"
    tooltipMessage={
      <>
        Your storage account is informed of updates and changes to the external
        Backend (public cloud, RING or other) through an async metadata updater
        mechanism.
        <br />
        It will be able to view and manage all data on this backend without
        being on the data path. <br />
        This maintains standard access from applications to the external
        Backend. <br />
      </>
    }
  />
);
export const HelpLocationTargetBucket = () => (
  <IconHelp
    placement="bottom"
    tooltipWidth="16rem"
    tooltipMessage="Name of the bucket/container created in the specific location (e.g.
          RING, Azure, AWS S3, GCP...), and where buckets attached to that
          location will store data."
  />
);
export const HelpBucketCreateVersioning = ({
  isObjectLockEnabled,
  isAsyncNotification,
}: {
  isObjectLockEnabled: boolean;
  isAsyncNotification: boolean;
}) => (
  <IconHelp
    placement="top"
    tooltipWidth="24rem"
    tooltipMessage={`Automatically activated when 
    ${isObjectLockEnabled ? 'Object-lock' : ''} 
    ${isObjectLockEnabled && isAsyncNotification ? 'or' : ''} 
    ${isAsyncNotification ? 'Async Metadata updates' : ''} 
    is Enabled`}
  />
);
