import React from 'react';
import { LocationDetailsFormProps } from '.';
import { FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
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
export default class LocationDetailsAzure extends React.Component<
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
          label="Azure Storage Endpoint"
          id="endpoint"
          helpErrorPosition="bottom"
          required
          content={
            <Input
              name="endpoint"
              id="endpoint"
              type="text"
              placeholder="https://storagesample.blob.core.windows.net"
              value={this.state.endpoint}
              autoComplete="off"
              onChange={this.onChange}
            />
          }
        />

        <FormGroup
          label="Azure Account Name"
          id="accessKey"
          helpErrorPosition="bottom"
          required
          content={
            <Input
              name="accessKey"
              id="accessKey"
              type="text"
              placeholder="account-name"
              value={this.state.accessKey}
              autoComplete="off"
              onChange={this.onChange}
            />
          }
        />

        <FormGroup
          id="secretKey"
          required
          label="Azure Access Key"
          labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your
            instance's RSA key pair so that we're unable to see them."
          helpErrorPosition="bottom"
          content={
            <Input
              name="secretKey"
              id="secretKey"
              type="password"
              placeholder="azureSecretKey"
              value={this.state.secretKey}
              autoComplete="new-password"
              onChange={this.onChange}
            />
          }
        />

        <FormGroup
          id="bucketName"
          label="Target Azure Container Name"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="bucketName"
              id="bucketName"
              type="text"
              placeholder="Container Name"
              value={this.state.bucketName}
              autoComplete="off"
              onChange={this.onChange}
            />
          }
        />
      </FormSection>
    );
  }
}
