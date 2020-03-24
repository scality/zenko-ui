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

export default class LocationDetailsDOSpaces extends React.Component<Props, State> {
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
                    <label htmlFor="accessKey">Spaces Access Key</label>
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
                    <label htmlFor="secretKey">Spaces Secret Key</label>
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
                    <label htmlFor="bucketName">Target Space Name</label>
                    <input
                        name="bucketName"
                        id="bucketName"
                        className="form-control"
                        type="text"
                        placeholder="zenko-space-target"
                        value={this.state.bucketName}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="endpoint">Endpoint</label>
                    <input
                        name="endpoint"
                        className="form-control"
                        type="text"
                        placeholder="nyc3.digitaloceanspaces.com"
                        value={this.state.endpoint}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                    <small>As shown in the Settings page for this space</small>
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
                        <small>Stores objects in the target bucket without a source-bucket prefix.</small>
                    </label>
                </fieldset>
            </div>
        );
    }
}
