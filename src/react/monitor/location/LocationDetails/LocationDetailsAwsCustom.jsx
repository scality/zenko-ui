// @flow
import { Banner, Checkbox } from '@scality/core-ui';
import Input from '../../../ui-elements/Input';
import type { InstanceStateSnapshot } from '../../../../types/stats';
import type { LocationDetails } from '../../../../types/config';
import React from 'react';
import { isIngestSource } from '../../../utils/storageOptions';
import { storageOptions } from './storageOptions';

type Props = {
    editingExisting: boolean,
    details: LocationDetails,
    onChange: (details: LocationDetails) => void,
    locationType: string,
    capabilities: $PropertyType<InstanceStateSnapshot, 'capabilities'>,
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

export default class LocationDetailsAwsCustom extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = Object.assign({}, INIT_STATE, this.props.details);
        // XXX disable changing it if not provided
        this.state.secretKey = '';
    }

    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.setState({
            [target.name]: value,
        });
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
        const isIngest = isIngestSource(storageOptions, this.props.locationType, this.props.capabilities);
        return (
            <div>
                <fieldset className="form-group">
                    <label htmlFor="accessKey">Access Key</label>
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
                    <label htmlFor="secretKey">Secret Key</label>
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
                        placeholder="Target Bucket Name"
                        value={this.state.bucketName}
                        onChange={this.onChange}
                        autoComplete="off"
                        disabled={this.props.editingExisting}
                    />
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="endpoint">Endpoint</label>
                    <Input
                        name="endpoint"
                        className="form-control"
                        type="text"
                        value={this.state.endpoint}
                        onChange={this.onChange}
                        autoComplete="off"
                        placeholder="https://hosted-s3-server.internal.example.com:4443"
                    />
                    <small>Endpoint to reach the S3 server, including scheme and port.
                        Zenko will use path-style access to buckets.
                    </small>
                </fieldset>
                <fieldset className="form-group">
                    <label className="form-check-label">
                        <Checkbox
                            name="bucketMatch"
                            disabled={this.props.editingExisting}
                            className="form-check-input"
                            value={this.state.bucketMatch}
                            checked={this.state.bucketMatch}
                            onChange={this.onChange}
                            label="Write objects without prefix"
                        />
                        <br />
                        { isIngest && <small> Use this option for mirroring. <br /> </small> }
                        <small>Store objects in the target bucket without a source-bucket prefix.</small>
                        {
                            this.state.bucketMatch &&
                            <div style={{'marginTop': '10px'}}>
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
