// @flow
import { Banner, Checkbox } from '@scality/core-ui';
import Input from '../../../ui-elements/Input';
import type { LocationDetails } from '../../../../types/config';
import React from 'react';

type Props = {
    details: LocationDetails,
    onChange: (details: LocationDetails) => void,
    editingExisting: boolean,
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

export default class LocationDetailsWasabi extends React.Component<Props, State> {
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
    }

    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.setState({
            [target.name]: value,
        });
    }

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
                <fieldset className="form-group">
                    <label htmlFor="accessKey">Wasabi Access Key</label>
                    <Input
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
                    <label htmlFor="secretKey">Wasabi Secret Key</label>
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
                    <label htmlFor="bucketName">Wasabi Target Bucket Name</label>
                    <Input
                        name="bucketName"
                        id="bucketName"
                        className="form-control"
                        type="text"
                        placeholder="Wasabi Target Bucket Name"
                        value={this.state.bucketName}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                    <small>Your Wasabi target bucket can be in any available Wasabi region.</small>
                </fieldset>
                <fieldset className="form-group" hidden>
                    <label htmlFor="endpoint">Wasabi Endpoint</label>
                    <Input
                        name="endpoint"
                        className="form-control"
                        type="text"
                        disabled="disabled"
                        value="https://s3.wasabisys.com"
                        autoComplete="off"
                    />
                </fieldset>
                <fieldset className="form-group">
                    <label className="form-check-label">
                        <Checkbox
                            name="bucketMatch"
                            className="form-check-input"
                            type="checkbox"
                            value={this.state.bucketMatch}
                            checked={this.state.bucketMatch}
                            disabled={this.props.editingExisting}
                            onChange={this.onChange}
                            label="Write objects without prefix"
                        />
                        <br />
                        <small>Store objects in the target bucket without a source-bucket prefix.</small>
                        {
                            this.state.bucketMatch &&
                            <div style={{'margin-top': '10px'}}>
                                <Banner
                                    icon={<i className="fa fa-exclamation-circle" />}
                                    variant="danger"
                                >
                                  Storing multiple buckets in a location with this option enabled can lead to data loss.
                                </Banner>
                            </div>
                        }
                    </label>
                </fieldset>
            </div>
        );
    }
}
