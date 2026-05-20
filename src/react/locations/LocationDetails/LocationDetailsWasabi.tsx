import { Checkbox } from '@scality/core-ui';
import { FormGroup, FormSection } from '@scality/core-ui/dist/components/form/Form.component';
import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
import React from 'react';
import type { LocationDetails } from '../../../types/config';
import { ACCESS_KEY_PLACEHOLDER, LOCATION_EDITOR_FORCED_LABEL_WIDTH, SECRET_KEY_PLACEHOLDER, WRITE_OBJECTS_WITHOUT_PREFIX_HELP, WRITE_OBJECTS_WITHOUT_PREFIX_LABEL } from '../LocationEditor';

type Props = {
  details: LocationDetails;
  onChange: (details: LocationDetails) => void;
  editingExisting: boolean;
};
type State = {
  bucketMatch: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  endpoint: string;
};
const INIT_STATE: State = {
  bucketMatch: false,
  accessKey: '',
  secretKey: '',
  bucketName: '',
  endpoint: '',
};
export default class LocationDetailsWasabi extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = Object.assign({}, INIT_STATE, this.props.details);
    // XXX disable changing it if not provided
    //@ts-expect-error fix this when you are working on it
    this.state.secretKey = '';
    //@ts-expect-error fix this when you are working on it
    this.state.endpoint = 'https://s3.wasabisys.com';
  }

  updateForm = () => {
    if (this.props.onChange) {
      //@ts-expect-error fix this when you are working on it
      this.props.onChange(this.state);
    }
  };
  onChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target;
    //@ts-expect-error fix this when you are working on it
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.setState(
      //@ts-expect-error fix this when you are working on it
      {
        //@ts-expect-error fix this when you are working on it
        [target.name]: value,
      },
    );
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return this.state !== nextState;
  }

  componentDidMount() {
    this.updateForm();
  }

  componentDidUpdate() {
    this.updateForm();
  }

  render() {
    return (
      <>
        <FormSection forceLabelWidth={LOCATION_EDITOR_FORCED_LABEL_WIDTH}>
          <FormGroup
            id="accessKey"
            label="Wasabi Access Key"
            required
            helpErrorPosition="bottom"
            content={
              <Input
                name="accessKey"
                id="accessKey"
                type="text"
                placeholder={ACCESS_KEY_PLACEHOLDER}
                value={this.state.accessKey}
                onChange={this.onChange}
                autoComplete="off"
              />
            }
          />

          <FormGroup
            id="secretKey"
            label="Wasabi Secret Key"
            required
            helpErrorPosition="bottom"
            labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your
            instance's RSA key pair so that we're unable to see them."
            content={
              <Input
                name="secretKey"
                id="secretKey"
                type="password"
                placeholder={SECRET_KEY_PLACEHOLDER}
                value={this.state.secretKey}
                onChange={this.onChange}
                autoComplete="new-password"
              />
            }
          />

          <FormGroup
            id="bucketName"
            label="Wasabi Target Bucket Name"
            required
            helpErrorPosition="bottom"
            labelHelpTooltip="Your Wasabi target bucket can be in any available Wasabi region."
            content={
              <Input
                name="bucketName"
                id="bucketName"
                type="text"
                placeholder="Bucket Name"
                value={this.state.bucketName}
                onChange={this.onChange}
                autoComplete="off"
              />
            }
          />
        </FormSection>
        <FormSection forceLabelWidth={LOCATION_EDITOR_FORCED_LABEL_WIDTH}>
          <FormGroup
            id="bucketMatch"
            label="Write objects without prefix"
            direction="vertical"
            helpErrorPosition="bottom"
            error={
              this.state.bucketMatch
                ? 'Storing multiple buckets in a location with this option enabled can lead to data loss.'
                : undefined
            }
            help={WRITE_OBJECTS_WITHOUT_PREFIX_HELP}
            content={
              <Checkbox
                name="bucketMatch"
                type="checkbox"
                checked={this.state.bucketMatch}
                disabled={this.props.editingExisting}
                onChange={this.onChange}
                label={WRITE_OBJECTS_WITHOUT_PREFIX_LABEL}
              />
            }
          />
        </FormSection>
      </>
    );
  }
}
