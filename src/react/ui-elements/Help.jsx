// @flow
import { Tooltip } from '@scality/core-ui';
import React from 'react';
import type { Node } from 'react';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

const Icon = styled.i`
  margin-left: ${spacing.sp8};
  color: ${props => props.theme.brand.buttonSecondary};
`;

type IconHelpProps = {
  tooltipMessage: string | Node,
  iconClass?: string,
  tooltipWidth?: string,
  placement?: string,
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
    overlayStyle={{ width: tooltipWidth }}
  >
    <Icon className={iconClass}></Icon>
  </Tooltip>
);

export const HelpIngestion = () => (
  <IconHelp
    placement="top"
    tooltipWidth="16rem"
    tooltipMessage="To pause/resume Async Notification, go to Accounts > Locations."
  />
);

export const HelpNonAsyncLocation = () => (
  <IconHelp
    placement="top"
    tooltipWidth="16rem"
    tooltipMessage="Selected Storage Location does not support Async Notification or its 'Write objects without prefix' option is disabled."
  />
);

export const HelpBucketCreationAsyncNotif = () => (
  <IconHelp
    placement="top"
    tooltipWidth="16rem"
    iconClass="fas fa-exclamation-triangle"
    tooltipMessage="Go to Accounts > Locations to pause/resume Async Notification from this bucket."
  />
);

export const HelpAsyncNotifPending = () => (
  <IconHelp
    placement="top"
    tooltipWidth="16rem"
    tooltipMessage={
      <>
        Enable Async Notifications for this location <br/>
        by choosing Enable Async Notification while <br/>
        creating an Artesca bucket for this location.
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
