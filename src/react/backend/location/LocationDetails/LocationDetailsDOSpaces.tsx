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
export default class LocationDetailsDOSpaces extends React.Component<
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
      <FormSection>
        <FormGroup
          id="accessKey"
          label="Spaces Access Key"
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
          label="Spaces Secret Key"
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
          label="Target Space Name"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="bucketName"
              id="bucketName"
              type="text"
              placeholder="space-target"
              value={this.state.bucketName}
              onChange={this.onChange}
              autoComplete="off"
            />
          }
        />

        <FormGroup
          id="endpoint"
          label="Endpoint"
          required
          helpErrorPosition="bottom"
          help="As shown in the Settings page for this space"
          content={
            <Input
              id="endpoint"
              name="endpoint"
              type="text"
              placeholder="example: nyc3.digitaloceanspaces.com"
              value={this.state.endpoint}
              onChange={this.onChange}
              autoComplete="off"
            />
          }
        />
      </FormSection>
    );
  }
}
