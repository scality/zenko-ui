import { FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import React from 'react';
import { LocationDetailsFormProps } from '.';

type State = {
  bucketMatch: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  mpuBucketName: string;
};
const INIT_STATE: State = {
  bucketMatch: false,
  accessKey: '',
  secretKey: '',
  bucketName: '',
  mpuBucketName: '',
};
export default class LocationDetailsGcp extends React.Component<
  LocationDetailsFormProps,
  State
> {
  constructor(props: LocationDetailsFormProps) {
    super(props);
    this.state = Object.assign({}, INIT_STATE, this.props.details);
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
      <FormSection>
        <FormGroup
          id="accessKey"
          label="GCP Access Key"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="accessKey"
              id="accessKey"
              type="text"
              placeholder="GOOG1MPCLRB86WCKTN2C"
              value={this.state.accessKey}
              onChange={this.onChange}
              autoComplete="off"
            />
          }
        />

        <FormGroup
          id="secretKey"
          label="GCP Secret Key"
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
          id="bucketName"
          label="Target Bucket Name"
          required
          helpErrorPosition="bottom"
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

        <FormGroup
          id="mpuBucketName"
          label="Target Bucket for Multi-part Uploads"
          required
          labelHelpTooltip="A secondary Google Cloud Storage bucket required for handling
            multi-part uploads on GCP using AWS MPU initiate/complete/abort
            methods."
          content={
            <Input
              name="mpuBucketName"
              id="mpuBucketName"
              type="text"
              placeholder="MPU Bucket Name"
              value={this.state.mpuBucketName}
              onChange={this.onChange}
              autoComplete="off"
            />
          }
        />
      </FormSection>
    );
  }
}
