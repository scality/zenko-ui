import type { EnabledState, InstanceStateSnapshot } from '../../../types/stats';
import type {
  LocationDetails as LocationFormDetails,
  LocationTypeKey,
} from '../../../types/config';
import React from 'react';
import { Tooltip } from '@scality/core-ui';
import { storageOptions } from './storageOptions';

type Props = {
  edit: boolean;
  locationType: LocationTypeKey;
  details: LocationFormDetails;
  editingExisting: boolean;
  repStatus?: EnabledState;
  repSchedule?: string;
  capabilities?: Pick<InstanceStateSnapshot, 'capabilities'>;
  onChange: (v: LocationFormDetails) => void;
};
export default class LocationDetails extends React.Component<Props> {
  render() {
    if (this.props.edit) {
      const loc = storageOptions[this.props.locationType];

      if (loc) {
        const Details = loc.formDetails;

        if (Details) {
          return (
            Details && (
              <Details
                onChange={this.props.onChange}
                edit={this.props.edit}
                editingExisting={this.props.editingExisting}
                details={this.props.details}
                locationType={this.props.locationType}
                key={this.props.locationType}
                capabilities={this.props.capabilities}
              />
            )
          );
        }
      }

      return null;
    }

    let msg: JSX.Element | string =
      'Replication to this location is paused. All changes queued ' +
      'for replication to this location will be processed on resume.';

    if (this.props.repSchedule) {
      const diff = 'TODO';

      if (diff && this.props.repSchedule) {
        const overlay = new Date(this.props.repSchedule).toString();
        msg = (
          <div>
            <span>
              Replication to this location is paused. All changes queued for
              replication to this location will be processed in&nbsp;
            </span>
            <Tooltip overlay={overlay}>{diff} hours.</Tooltip>
          </div>
        );
      } else if (this.props.repStatus === 'disabled') {
        msg = (
          <div>
            <span className="mr-2 fa fa-exclamation-circle" />
            <span>
              Your instance failed to automatically resume this location. Please
              resume manually.
            </span>
          </div>
        );
      }
    }

    return (
      <div className="p-2">
        <div>
          Location Type:&nbsp;
          <span className="px-2">
            {storageOptions[this.props.locationType].name}
          </span>
          <br />
        </div>
        {this.props.repStatus === 'disabled' ? (
          <div
            id="crr-status-info-text"
            className="self-align-center multiple-select-extra-info text-muted"
          >
            {msg}
          </div>
        ) : null}
      </div>
    );
  }
}
