// @flow

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
    endpoint: string,
};

const INIT_STATE: State = {
    bucketMatch: false,
    accessKey: '',
    secretKey: '',
    bucketName: '',
    endpoint: '',
};

export default class LocationDetailsAzure extends React.Component<Props, State> {
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
                    <label htmlFor="endpoint">Azure Storage Endpoint</label>
                    <input
                        name="endpoint"
                        id="endpoint"
                        className="form-control"
                        type="text"
                        placeholder="https://storagesample.blob.core.windows.net"
                        value={this.state.endpoint}
                        autoComplete="off"
                        onChange={this.onChange} />
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="accessKey">Azure Account Name</label>
                    <input
                        name="accessKey"
                        id="accessKey"
                        className="form-control"
                        type="text"
                        placeholder="account-name"
                        value={this.state.accessKey}
                        autoComplete="off"
                        onChange={this.onChange} />
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="secretKey">Azure Access Key</label>
                    <input
                        name="secretKey"
                        id="secretKey"
                        className="form-control"
                        type="password"
                        placeholder="azureSecretKey"
                        value={this.state.secretKey}
                        autoComplete="new-password"
                        onChange={this.onChange} />
                    <small>
                        Your credentials are encrypted in transit, then at rest using your
                        Zenko instance&apos;s RSA key pair so that we&apos;re unable to see them.
                    </small>
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="bucketName">Target Azure Container Name</label>
                    <input
                        name="bucketName"
                        id="bucketName"
                        className="form-control"
                        type="text"
                        placeholder="Container Name"
                        value={this.state.bucketName}
                        autoComplete="off"
                        onChange={this.onChange} />
                </fieldset>
                <fieldset className="form-group" hidden>
                    <label className="form-check-label">
                        <input
                            name="bucketMatch"
                            className="form-check-input"
                            type="checkbox"
                            value={this.state.bucketMatch}
                            checked={this.state.bucketMatch}
                            onChange={this.onChange} />
                        <span>Bucket Match</span><br />
                        <small>Stores objects in the target container without a source-bucket prefix.</small>
                    </label>
                </fieldset>
            </div>
        );
    }
}
