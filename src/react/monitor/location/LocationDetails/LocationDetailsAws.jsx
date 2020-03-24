// @flow

import type { LocationDetails } from '../../../../types/config';
import React from 'react';

type Props = {
    details: LocationDetails,
    onChange: (details: LocationDetails) => void,
    editingExisting: boolean,
};

type State = {
    serverSideEncryption: boolean,
    bucketMatch: boolean,
    accessKey: string,
    secretKey: string,
    bucketName: string,
};

const INIT_STATE: State = {
    serverSideEncryption: false,
    bucketMatch: false,
    accessKey: '',
    secretKey: '',
    bucketName: '',
};

export default class LocationDetailsAws extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = Object.assign({}, INIT_STATE, this.props.details);
        // XXX disable changing it if not provided
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
                    <label htmlFor="accessKey">AWS Access Key</label>
                    <input
                        name="accessKey"
                        id="accessKey"
                        className="form-control"
                        type="text"
                        placeholder="AKI5HMPCLRB86WCKTN2C"
                        value={this.state.accessKey}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="secretKey">AWS Secret Key</label>
                    <input
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
                    <input
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
                    <label className="form-check-label">
                        <input
                            name="bucketMatch"
                            className="form-check-input"
                            type="checkbox"
                            value={this.state.bucketMatch}
                            checked={this.state.bucketMatch}
                            disabled={this.props.editingExisting}
                            onChange={this.onChange} />
                        <span>Write objects without prefix</span><br />
                        <small> Use this option for mirroring. <br /> </small>
                        <small>Store objects in the target bucket without a source-bucket prefix.</small>
                        {
                            this.state.bucketMatch &&
                            <div>
                                <small className="text-danger">
                                    <i className="fa fa-exclamation-circle"></i>
                                    &nbsp; Storing multiple buckets in a location with this option enabled can lead to data loss.
                                </small>
                            </div>
                        }
                    </label>
                </fieldset>
                <fieldset className="form-group">
                    <label className="form-check-label">
                        <input
                            name="serverSideEncryption"
                            className="form-check-input"
                            type="checkbox"
                            value={this.state.serverSideEncryption}
                            checked={this.state.serverSideEncryption}
                            onChange={this.onChange} />
                        <span>Server-Side Encryption</span>
                    </label>
                </fieldset>
            </div>
        );
    }
}
