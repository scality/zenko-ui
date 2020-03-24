// @flow

// import { FormGroup, Input, Label } from 'reactstrap';
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

function _convertToDetails({ protocol, version, server, path, options}: State): LocationDetails {
    return {
        endpoint: options ?
            `${protocol}+${version}://${server}${path}?${options}`
            :
            `${protocol}+${version}://${server}${path}`,
    };
}

const NFS_PROTOCOLS: Array<Node> = ['udp', 'tcp'].map(p =>
    <option key={p} value={p}>{p.toUpperCase()}</option>);
const NFS_VERSIONS: Array<Node> = ['v3', 'v4'].map(ver =>
    <option key={ver} value={ver}>{ver.toUpperCase()}</option>);

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
                REPLACE IT
            </div>
        );
    }
}



// <div>
//     <FormGroup>
//         <Label for="nfs-protocol">NFS Protocol</Label>
//         <Input type="select" name="protocol" id="nfs-protocol"
//             disabled={editingExisting}
//             value={this.state.protocol} onChange={this.onChange}>
//             {NFS_PROTOCOLS}
//         </Input>
//     </FormGroup>
//     <FormGroup>
//         <Label for="nfs-version">NFS Version</Label>
//         <Input type="select" name="version" id="nfs-version"
//             disabled={editingExisting}
//             value={this.state.version} onChange={this.onChange}>
//             {NFS_VERSIONS}
//         </Input>
//     </FormGroup>
//     <FormGroup>
//         <Label for="nfs-server">Server</Label>
//         <Input type="text" name="server" id="nfs-server"
//             disabled={editingExisting}
//             placeholder="nfsserver.example.com"
//             value={this.state.server}
//             onChange={this.onChange}
//             autoComplete="off"
//         />
//     </FormGroup>
//     <FormGroup>
//         <Label for="nfs-path">Export Path</Label>
//         <Input type="text" name="path" id="nfs-path"
//             disabled={editingExisting}
//             placeholder="/path/to/export"
//             value={this.state.path}
//             onChange={this.onChange}
//             autoComplete="off"
//         />
//     </FormGroup>
//     <FormGroup>
//         <Label for="nfs-options">NFS Options</Label>  {/*maybe add info*/}
//         <Input type="text" name="options" id="nfs-options"
//             disabled={editingExisting}
//             placeholder="rw,async"
//             value={this.state.options}
//             onChange={this.onChange}
//             autoComplete="off"
//         />
//     </FormGroup>
// </div>
