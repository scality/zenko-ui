import {
  Checkbox,
  CheckboxContainer,
  WarningInput,
  Fieldset,
  Input,
  Label,
} from '../../../ui-elements/FormLayout';
import React from 'react';
import { LocationDetailsFormProps } from '.';

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
      <div>
        <Fieldset>
          <Label htmlFor="accessKey" required>
            AWS Access Key
          </Label>
          <Input
            name="accessKey"
            id="accessKey"
            type="text"
            placeholder="example: AKI5HMPCLRB86WCKTN2C"
            value={this.state.accessKey}
            onChange={this.onChange}
            autoComplete="off"
          />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="secretKey" required>
            AWS Secret Key
          </Label>
          <Input
            name="secretKey"
            id="secretKey"
            type="password"
            placeholder="example: QFvIo6l76oe9xgCAw1N/zlPFtdTSZXMMUuANeXc6"
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
          <Label htmlFor="bucketName" required>
            Target Bucket Name
          </Label>
          <Input
            name="bucketName"
            id="bucketName"
            type="text"
            placeholder="Bucket Name"
            value={this.state.bucketName}
            onChange={this.onChange}
            autoComplete="off"
          />
        </Fieldset>
        <Fieldset>
          <CheckboxContainer>
            <Checkbox
              name="bucketMatch"
              value={this.state.bucketMatch}
              checked={this.state.bucketMatch}
              disabled={this.props.editingExisting}
              onChange={this.onChange}
            />
            <span> Write objects without prefix </span>
          </CheckboxContainer>
          <small>
            Store objects in the target bucket without a source-bucket prefix.
          </small>
          <WarningInput
            error={
              this.state.bucketMatch &&
              'Storing multiple buckets in a location with this option enabled can lead to data loss.'
            }
          />
        </Fieldset>
        <Fieldset
          style={{
            marginTop: '0px',
          }}
        >
          <CheckboxContainer>
            <Checkbox
              name="serverSideEncryption"
              value={this.state.serverSideEncryption}
              checked={this.state.serverSideEncryption}
              onChange={this.onChange}
            />
            <span> Server-Side Encryption </span>
          </CheckboxContainer>
        </Fieldset>
      </div>
    );
  }
}
