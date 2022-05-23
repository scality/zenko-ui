import {
  Checkbox,
  CheckboxContainer,
  Fieldset,
  Input,
  Label,
} from '../../../ui-elements/FormLayout';
import React from 'react';
import { LocationDetailsFormProps } from '.';
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
      <div>
        <Fieldset>
          <Label htmlFor="accessKey">Spaces Access Key</Label>
          <Input
            name="accessKey"
            id="accessKey"
            type="text"
            placeholder="AKI5HMPCLRB86WCKTN2C"
            value={this.state.accessKey}
            onChange={this.onChange}
            autoComplete="off"
          />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="secretKey">Spaces Secret Key</Label>
          <Input
            name="secretKey"
            id="secretKey"
            type="password"
            placeholder="QFvIo6l76oe9xgCAw1N/zlPFtdTSZXMMUuANeXc6"
            value={this.state.secretKey}
            onChange={this.onChange}
            autoComplete="new-password"
          />
          <small>
            Your credentials are encrypted in transit, then at rest using your
            instance&apos;s RSA key pair so that we&apos;re unable to see them.
          </small>
        </Fieldset>
        <Fieldset>
          <Label htmlFor="bucketName">Target Space Name</Label>
          <Input
            name="bucketName"
            id="bucketName"
            type="text"
            placeholder="space-target"
            value={this.state.bucketName}
            onChange={this.onChange}
            autoComplete="off"
          />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="endpoint">Endpoint</Label>
          <Input
            name="endpoint"
            type="text"
            placeholder="nyc3.digitaloceanspaces.com"
            value={this.state.endpoint}
            onChange={this.onChange}
            autoComplete="off"
          />
          <small>As shown in the Settings page for this space</small>
        </Fieldset>
        <Fieldset
          style={{
            display: 'non',
          }}
        >
          <CheckboxContainer>
            <Checkbox
              name="bucketMatch"
              type="checkbox"
              value={this.state.bucketMatch}
              checked={this.state.bucketMatch}
              onChange={this.onChange}
            />
            <span> Bucket Match </span>
          </CheckboxContainer>
          <small>
            Stores objects in the target container without a source-bucket
            prefix.
          </small>
        </Fieldset>
      </div>
    );
  }
}
