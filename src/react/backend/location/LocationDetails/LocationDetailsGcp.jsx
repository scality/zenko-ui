// @flow
import { Checkbox, CheckboxContainer, Fieldset, Input, Label } from '../../../ui-elements/FormLayout';
import type { LocationDetails } from '../../../../types/config';
import React from 'react';

type Props = {
    details: LocationDetails,
    onChange: (details: LocationDetails) => void,
};

type State = {
    bucketMatch: boolean,
    accessKey: string,
    secretKey: string,
    bucketName: string,
    mpuBucketName: string,
};

const INIT_STATE: State = {
    bucketMatch: false,
    accessKey: '',
    secretKey: '',
    bucketName: '',
    mpuBucketName: '',
};

export default class LocationDetailsGcp extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = Object.assign({}, INIT_STATE, this.props.details);
        this.state.secretKey = '';
    }

    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.setState({ [target.name]: value });
    }

    updateForm = () => {
        if (this.props.onChange) {
            this.props.onChange(this.state);
        }
    }

    componentDidMount() {
        this.updateForm();
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return this.state !== nextState;
    }

    componentDidUpdate() {
        this.updateForm();
    }

    render() {
        return (
            <div>
                <Fieldset>
                    <Label htmlFor="accessKey">GCP Access Key</Label>
                    <Input
                        name="accessKey"
                        id="accessKey"
                        type="text"
                        placeholder="GOOG1MPCLRB86WCKTN2C"
                        value={this.state.accessKey}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </Fieldset>
                <Fieldset>
                    <Label htmlFor="secretKey">GCP Secret Key</Label>
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
                        Zenko instance&apos;s RSA key pair so that we&apos;re unable to see them.
                    </small>
                </Fieldset>
                <Fieldset>
                    <Label htmlFor="bucketName">Target Bucket Name</Label>
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
                    <Label htmlFor="mpuBucketName">Target Helper Bucket Name for Multi-part Uploads</Label>
                    <Input
                        name="mpuBucketName"
                        id="mpuBucketName"
                        type="text"
                        placeholder="MPU Bucket Name"
                        value={this.state.mpuBucketName}
                        onChange={this.onChange}
                        autoComplete="off" />
                    <small>
                        A secondary Google Cloud Storage bucket required for handling multi-part uploads on
                        GCP using AWS MPU initiate/complete/abort methods.
                    </small>
                </Fieldset>
                <Fieldset style={{ display: 'none' }}>
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
                    <small>Stores objects in the target container without a source-bucket prefix.</small>
                </Fieldset>
            </div>
        );
    }
}
