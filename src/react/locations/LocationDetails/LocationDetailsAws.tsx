import React from 'react';
import { LocationDetailsFormProps } from '.';
import { Checkbox, FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';

type State = {
  serverSideEncryption: boolean;
  bucketMatch: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
};
const INIT_STATE: State = {
  serverSideEncryption: false,
  bucketMatch: false,
  accessKey: '',
  secretKey: '',
  bucketName: '',
};
export default class LocationDetailsAws extends React.Component<
  LocationDetailsFormProps,
  State
> {
  constructor(props: LocationDetailsFormProps) {
    super(props);
    this.state = Object.assign({}, INIT_STATE, this.props.details);
    // XXX disable changing it if not provided
    this.state.secretKey = '';
  }

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.setState({
      [target.name]: value,
    });
  };
  updateForm = () => {
    if (this.props.onChange) {
      this.props.onChange(this.state);
    }
  };

  componentDidMount() {
    this.updateForm();
  }

  shouldComponentUpdate(nextProps: LocationDetailsFormProps, nextState: State) {
    return this.state !== nextState;
  }

  componentDidUpdate() {
    this.updateForm();
  }

  render() {
    return (
      <>
        <FormSection>
          <FormGroup
            label="AWS Access Key"
            id="accessKey"
            required
            helpErrorPosition="bottom"
            content={
              <Input
                name="accessKey"
                id="accessKey"
                type="text"
                placeholder="AKI5HMPCLRB86WCKTN2C"
                value={this.state.accessKey}
                onChange={this.onChange}
                autoComplete="off"
              />
            }
          />

          <FormGroup
            label="AWS Secret Key"
            id="secretKey"
            required
            helpErrorPosition="bottom"
            labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your
            instance's RSA key pair so that we're unable to see them."
            content={
              <Input
                name="secretKey"
                id="secretKey"
                type="password"
                placeholder="QFvIo6l76oe9xgCAw1N/zlPFtdTSZXMMUuANeXc6"
                value={this.state.secretKey}
                onChange={this.onChange}
                autoComplete="new-password"
              />
            }
          />

          <FormGroup
            label="Target Bucket Name"
            id="bucketName"
            required
            helpErrorPosition="bottom"
            help="The Target Bucket on your location needs to have Versioning enabled."
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
        <FormSection>
          <FormGroup
            label=""
            id="bucketMatch"
            direction="vertical"
            helpErrorPosition="bottom"
            error={
              this.state.bucketMatch
                ? 'Storing multiple buckets in a location with this option enabled can lead to data loss.'
                : undefined
            }
            content={
              <Checkbox
                name="bucketMatch"
                id="bucketMatch"
                checked={this.state.bucketMatch}
                disabled={this.props.editingExisting}
                onChange={this.onChange}
                label="Write objects without prefix"
              />
            }
            help="Store objects in the target bucket without a source-bucket prefix."
          />

          <FormGroup
            label=""
            direction="vertical"
            id="serverSideEncryption"
            helpErrorPosition="bottom"
            content={
              <Checkbox
                name="serverSideEncryption"
                value={this.state.serverSideEncryption}
                checked={this.state.serverSideEncryption}
                onChange={this.onChange}
                label="Server-Side Encryption"
              />
            }
          />
        </FormSection>
      </>
    );
  }
}
