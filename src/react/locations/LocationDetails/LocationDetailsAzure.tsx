import React from 'react';
import { LocationDetailsFormProps } from '.';
import { FormGroup, FormSection } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import {
  LocationAzureAuth,
  LocationAzureClientSecret,
  LocationAzureSharedAccessSignature,
  LocationAzureSharedKey,
} from '../../../js/managementClient/api';
type State = {
  bucketMatch: boolean;
  accessKey?: string;
  secretKey?: string;
  bucketName: string;
  endpoint: string;
  auth:
    | LocationAzureClientSecret
    | LocationAzureSharedAccessSignature
    | LocationAzureSharedKey;
};
const INIT_STATE: Omit<State, 'auth'> = {
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
    const auth:
      | LocationAzureClientSecret
      | LocationAzureSharedAccessSignature
      | LocationAzureSharedKey = this.props.details.auth || {
      type: LocationAzureAuth.TypeEnum['SharedKey'],
      accountKey: '',
      accountName: this.props.details.accessKey || '',
    };

    this.state = { ...INIT_STATE, ...this.props.details, secretKey: '', auth };

    if ('accountKey' in this.state.auth && this.state.auth?.accountKey) {
      this.state.auth.accountKey = '';
    }

    if ('clientKey' in this.state.auth && this.state.auth.clientKey) {
      this.state.auth.clientKey = '';
    }

    if (
      'storageSasToken' in this.state.auth &&
      this.state.auth.storageSasToken
    ) {
      this.state.auth.storageSasToken = '';
    }
  }

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    //@ts-expect-error -- we control the keyname/value and check them in unit tests
    this.setState({
      [target.name]: value,
    });
  };

  onAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.setState({
      auth: {
        ...this.state.auth,
        [target.name]: value,
      },
    });
  };

  onAuthTypeChange = (newType: string) => {
    switch (newType) {
      case 'location-azure-shared-key':
        this.setState({
          auth: {
            type: LocationAzureAuth.TypeEnum['SharedKey'],
            accountName: '',
            accountKey: '',
          },
        });
        return;
      case 'location-azure-client-secret':
        this.setState({
          auth: {
            type: LocationAzureAuth.TypeEnum['ClientSecret'],
            clientId: '',
            clientKey: '',
          },
        });
        return;
      case 'location-azure-shared-access-signature':
        this.setState({
          auth: {
            type: LocationAzureAuth.TypeEnum['SharedAccessSignature'],
            storageSasToken: '',
          },
        });
        return;
    }
  };

  updateForm = () => {
    if (this.props.onChange) {
      if (this.state.auth) {
        const payload = { ...this.state };
        delete payload.accessKey;
        delete payload.secretKey;
        this.props.onChange(payload);
        return;
      }
      this.props.onChange(this.state);
    }
  };

  componentDidMount() {
    this.updateForm();
  }

  shouldComponentUpdate(_: LocationDetailsFormProps, nextState: State) {
    return this.state !== nextState;
  }

  componentDidUpdate() {
    this.updateForm();
  }

  render() {
    return (
      <FormSection forceLabelWidth={220}>
        <FormGroup
          label="Blob endpoint"
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
          id="bucketName"
          label="Target Container Name"
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

        <FormGroup
          id="auth"
          label="Authentication type"
          helpErrorPosition="bottom"
          content={
            <Select
              id="locationType"
              placeholder="Select an option..."
              onChange={this.onAuthTypeChange}
              value={this.state.auth.type.toString()}
            >
              <Select.Option value={'location-azure-shared-key'}>
                Azure Shared Key
              </Select.Option>
              <Select.Option value={'location-azure-client-secret'}>
                Azure Client Secret
              </Select.Option>
              <Select.Option value={'location-azure-shared-access-signature'}>
                Azure Shared Access Signature
              </Select.Option>
            </Select>
          }
        />

        {'accountName' in this.state.auth &&
        this.state.auth.type === LocationAzureAuth.TypeEnum['SharedKey'] ? (
          <>
            <FormGroup
              label="Storage Account Name"
              id="accountName"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="accountName"
                  id="accountName"
                  type="text"
                  placeholder="account-name"
                  value={this.state.auth.accountName}
                  autoComplete="off"
                  onChange={this.onAuthChange}
                />
              }
            />
            <FormGroup
              id="accountKey"
              label="Storage Account Key"
              labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your
            instance's RSA key pair so that we're unable to see them."
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="accountKey"
                  id="accountKey"
                  type="password"
                  placeholder="accountKey"
                  value={this.state.auth.accountKey}
                  autoComplete="new-password"
                  onChange={this.onAuthChange}
                />
              }
            />
          </>
        ) : (
          <></>
        )}

        {'clientId' in this.state.auth &&
        this.state.auth.type === LocationAzureAuth.TypeEnum['ClientSecret'] ? (
          <>
            <FormGroup
              label="Tenant ID"
              id="tenantId"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="tenantId"
                  id="tenantId"
                  type="text"
                  placeholder="tenant-id"
                  value={this.state.auth.tenantId}
                  autoComplete="off"
                  onChange={this.onAuthChange}
                />
              }
            />
            <FormGroup
              label="Client ID"
              id="clientId"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="clientId"
                  id="clientId"
                  type="text"
                  placeholder="client-id"
                  value={this.state.auth.clientId}
                  autoComplete="off"
                  onChange={this.onAuthChange}
                />
              }
            />
            <FormGroup
              id="clientKey"
              label="Client Secret"
              labelHelpTooltip="A secret string that the application uses to prove its identity when requesting a token. 
              Also can be referred to as application password."
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="clientKey"
                  id="clientKey"
                  type="password"
                  placeholder="clientKey"
                  value={this.state.auth.clientKey}
                  autoComplete="new-password"
                  onChange={this.onAuthChange}
                />
              }
            />
          </>
        ) : (
          <></>
        )}

        {'storageSasToken' in this.state.auth &&
        this.state.auth.type ===
          LocationAzureAuth.TypeEnum['SharedAccessSignature'] ? (
          <>
            <FormGroup
              label="SAS Token"
              labelHelpTooltip="The query string that includes all of the information required to authenticate the SAS, 
              as well as to specify the service, resource, and permissions available for access, and the time interval over which the signature is valid."
              id="storageSasToken"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="storageSasToken"
                  id="storageSasToken"
                  type="text"
                  placeholder="storage-sas-token"
                  value={this.state.auth.storageSasToken}
                  autoComplete="off"
                  onChange={this.onAuthChange}
                />
              }
            />
          </>
        ) : (
          <></>
        )}
      </FormSection>
    );
  }
}
