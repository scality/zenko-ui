import type { LocationDetails } from '../../../../types/config';
import React from 'react';
import { Checkbox, FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
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
export default class LocationDetailsWasabi extends React.Component<
  Props,
  State
> {
  constructor(props: Props) {
    super(props);
    this.state = Object.assign({}, INIT_STATE, this.props.details);
    // XXX disable changing it if not provided
    this.state.secretKey = '';
    this.state.endpoint = 'https://s3.wasabisys.com';
  }

  updateForm = () => {
    if (this.props.onChange) {
      this.props.onChange(this.state);
    }
  };
  onChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.setState({
      [target.name]: value,
    });
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
        <FormSection>
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
                placeholder="example: AKI5HMPCLRB86WCKTN2C"
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
                placeholder="example: QFvIo6l76oe9xgCAw1N/zlPFtdTSZXMMUuANeXc6"
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
                placeholder="Wasabi Target Bucket Name"
                value={this.state.bucketName}
                onChange={this.onChange}
                autoComplete="off"
              />
            }
          />
        </FormSection>
        <FormSection>
          <FormGroup
            id="bucketMatch"
            label=""
            helpErrorPosition="bottom"
            error={
              this.state.bucketMatch
                ? 'Storing multiple buckets in a location with this option enabled can lead to data loss.'
                : undefined
            }
            help="Store objects in the target bucket without a source-bucket prefix."
            content={
              <Checkbox
                name="bucketMatch"
                type="checkbox"
                checked={this.state.bucketMatch}
                disabled={this.props.editingExisting}
                onChange={this.onChange}
                label="Write objects without prefix"
              />
            }
          />
        </FormSection>
      </>
    );
  }
}
