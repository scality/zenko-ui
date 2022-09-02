import {
  Checkbox,
  CheckboxContainer,
  WarningInput,
  Fieldset,
  Input,
  Label,
} from '../../../ui-elements/FormLayout';
import type { LocationDetails } from '../../../../types/config';
import React from 'react';
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
      <div>
        <Fieldset>
          <Label htmlFor="accessKey" required>
            Wasabi Access Key
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
            Wasabi Secret Key
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
            Wasabi Target Bucket Name
          </Label>
          <Input
            name="bucketName"
            id="bucketName"
            type="text"
            placeholder="Wasabi Target Bucket Name"
            value={this.state.bucketName}
            onChange={this.onChange}
            autoComplete="off"
          />
          <small>
            Your Wasabi target bucket can be in any available Wasabi region.
          </small>
        </Fieldset>
        <Fieldset
          style={{
            display: 'none',
          }}
        >
          <Label htmlFor="endpoint" required>
            Wasabi Endpoint
          </Label>
          <Input
            name="endpoint"
            type="text"
            disabled="disabled"
            value="https://s3.wasabisys.com"
            autoComplete="off"
          />
        </Fieldset>
        <Fieldset>
          <CheckboxContainer>
            <Checkbox
              name="bucketMatch"
              type="checkbox"
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
              this.state.bucketMatch
                ? 'Storing multiple buckets in a location with this option enabled\ncan lead to data loss.'
                : undefined
            }
          />
        </Fieldset>
      </div>
    );
  }
}
