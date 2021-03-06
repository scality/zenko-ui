// @flow
import { Fieldset, Input, Label, Select } from '../../../ui-elements/FormLayout';
import type { LocationDetails } from '../../../../types/config';
import type { Node } from 'react';
import React from 'react';
import urlParse from 'url-parse';

type Props = {
    editingExisting: boolean,
    details: LocationDetails,
    onChange: (details: LocationDetails) => void,
};

type State = {
    protocol: 'tcp' | 'udp',
    version: 'v3' | 'v4',
    server: string,
    path: string,
    options: string,
};

const INIT_STATE = {
    protocol: 'tcp',
    version: 'v3',
    server: '',
    path: '',
    options: '',
};

function _convertToState(details: LocationDetails): State {
    const retState = {
        protocol: 'tcp',
        version: 'v3',
        server: '',
        path: '',
        options: '',
    };

    // todo: add strictuer details ($FlowFixMe)
    if (!details.endpoint) {
        return retState;
    }

    const {
        protocol: scheme,
        host: server,
        pathname: path,
        query: options,
    } = urlParse(details.endpoint);

    const [protocol, version] = (scheme.slice(0, -1)).split('+');

    return {
        protocol,
        version,
        server,
        path,
        options: options.slice(1),
    };
}

function _convertToDetails({ protocol, version, server, path, options }: State): LocationDetails {
    return {
        endpoint: options ?
            `${protocol}+${version}://${server}${path}?${options}`
            :
            `${protocol}+${version}://${server}${path}`,
    };
}

type Options = {
    value: string,
    label: Node,
};

const NFS_PROTOCOLS: Array<Options> = ['udp', 'tcp'].map(p => {
    return {
        value: p,
        label: <option key={p} value={p}>{p.toUpperCase()}</option>,
    };
});
const NFS_VERSIONS: Array<Options> = ['v3', 'v4'].map(ver => {
    return {
        value: ver,
        label: <option key={ver} value={ver}>{ver.toUpperCase()}</option>,
    };
});

export default class LocationDetailsNFS extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = Object.assign({}, INIT_STATE,
            _convertToState(this.props.details));
    }

    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        const target = e.target;
        let value;
        switch (target.name) {
        case 'server':
            value = target.value.split('/')[0];
            value = value.split('?')[0];
            break;
        case 'path':
            value = target.value.split('?')[0];
            value = !value.startsWith('/') && value ? `/${value}` : value;
            break;
        default:
            value = target.value;
            break;
        }
        this.setState({
            [target.name]: value,
        });
    }

    onProtocolChange = (p: any) => {
        this.setState({
            protocol: p.value,
        });
    };

    onVersionChange = (v: any) => {
        this.setState({
            version: v.value,
        });
    }

    updateForm = () => {
        if (this.props.onChange) {
            this.props.onChange(_convertToDetails(this.state));
        }
    }

    componentDidMount() {
        this.updateForm();
    }

    componentDidUpdate() {
        this.updateForm();
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return this.state !== nextState;
    }

    render() {
        const { editingExisting } = this.props;
        return (
            <div>
                <Fieldset>
                    <Label htmlFor="nfs-protocol">NFS Protocol</Label>
                    <Select type="select" name="protocol" id="nfs-protocol"
                        isDisabled={editingExisting}
                        onChange={this.onProtocolChange}
                        options={NFS_PROTOCOLS}
                        value = {NFS_PROTOCOLS.find(v => v.value === this.state.protocol)}
                    />
                </Fieldset>
                <Fieldset>
                    <Label htmlFor="nfs-version">NFS Version</Label>
                    <Select type="select" name="version" id="nfs-version"
                        isDisabled={editingExisting}
                        onChange={this.onVersionChange}
                        options={NFS_VERSIONS}
                        value = {NFS_VERSIONS.find(v => v.value === this.state.version)}
                    />
                </Fieldset>
                <Fieldset>
                    <Label htmlFor="nfs-server">Server</Label>
                    <Input type="text" name="server" id="nfs-server"
                        disabled={editingExisting}
                        placeholder="nfsserver.example.com"
                        value={this.state.server}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </Fieldset>
                <Fieldset>
                    <Label htmlFor="nfs-path">Export Path</Label>
                    <Input type="text" name="path" id="nfs-path"
                        disabled={editingExisting}
                        placeholder="/path/to/export"
                        value={this.state.path}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </Fieldset>
                <Fieldset>
                    <Label htmlFor="nfs-options">NFS Options</Label>  {/*maybe add info*/}
                    <Input type="text" name="options" id="nfs-options"
                        disabled={editingExisting}
                        placeholder="rw,async"
                        value={this.state.options}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </Fieldset>
            </div>
        );
    }
}
