// @flow
import { Checkbox } from '@scality/core-ui';
import Input from '../../../ui-elements/Input';
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
                <fieldset className="form-group">
                    <label htmlFor="accessKey">GCP Access Key</label>
                    <Input
                        name="accessKey"
                        id="accessKey"
                        className="form-control"
                        type="text"
                        placeholder="GOOG1MPCLRB86WCKTN2C"
                        value={this.state.accessKey}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="secretKey">GCP Secret Key</label>
                    <Input
                        name="secretKey"
                        id="secretKey"
                        className="form-control"
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
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="bucketName">Target Bucket Name</label>
                    <Input
                        name="bucketName"
                        id="bucketName"
                        className="form-control"
                        type="text"
                        placeholder="Bucket Name"
                        value={this.state.bucketName}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="mpuBucketName">Target Helper Bucket Name for Multi-part Uploads</label>
                    <Input
                        name="mpuBucketName"
                        id="mpuBucketName"
                        className="form-control"
                        type="text"
                        placeholder="MPU Bucket Name"
                        value={this.state.mpuBucketName}
                        onChange={this.onChange}
                        autoComplete="off" />
                    <small>
                        A secondary Google Cloud Storage bucket required for handling multi-part uploads on
                        GCP using AWS MPU initiate/complete/abort methods.
                    </small>
                </fieldset>
                <fieldset className="form-group" hidden>
                    <label className="form-check-label">
                        <Checkbox
                            name="bucketMatch"
                            className="form-check-input"
                            type="checkbox"
                            value={this.state.bucketMatch}
                            checked={this.state.bucketMatch}
                            onChange={this.onChange}
                            label="Bucket Match"
                        />
                        <br />
                        <small>Stores objects in the target bucket without a source-bucket prefix.</small>
                    </label>
                </fieldset>
            </div>
        );
    }
}
