import {
  Fieldset,
  Input,
  Label,
  Select,
} from '../../../ui-elements/FormLayout';
import type { LocationDetails } from '../../../../types/config';
import React from 'react';
import urlParse from 'url-parse';
import { LocationDetailsFormProps } from '.';
type State = {
  protocol: 'tcp' | 'udp';
  version: 'v3' | 'v4';
  server: string;
  path: string;
  options: string;
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

  if (!details.endpoint) {
    return retState;
  }

  const {
    protocol: scheme,
    host: server,
    pathname: path,
    query: options,
  } = urlParse(details.endpoint);
  const [protocol, version] = scheme.slice(0, -1).split('+');
  return {
    protocol,
    version,
    server,
    path,
    options: options.slice(1),
  };
}

function _convertToDetails({
  protocol,
  version,
  server,
  path,
  options,
}: State): LocationDetails {
  return {
    endpoint: options
      ? `${protocol}+${version}://${server}${path}?${options}`
      : `${protocol}+${version}://${server}${path}`,
  };
}

type Options = {
  value: string;
  label: string;
};
const NFS_PROTOCOLS: Array<Options> = ['udp', 'tcp'].map((p) => {
  return {
    value: p,
    label: p.toUpperCase(),
  };
});
const NFS_VERSIONS: Array<Options> = ['v3', 'v4'].map((ver) => {
  return {
    value: ver,
    label: ver.toUpperCase(),
  };
});
export default class LocationDetailsNFS extends React.Component<
  LocationDetailsFormProps,
  State
> {
  constructor(props: LocationDetailsFormProps) {
    super(props);
    this.state = Object.assign(
      {},
      INIT_STATE,
      _convertToState(this.props.details),
    );
  }

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };
  onProtocolChange = (p: any) => {
    this.setState({
      protocol: p,
    });
  };
  onVersionChange = (v: any) => {
    this.setState({
      version: v,
    });
  };
  updateForm = () => {
    if (this.props.onChange) {
      this.props.onChange(_convertToDetails(this.state));
    }
  };

  componentDidMount() {
    this.updateForm();
  }

  componentDidUpdate() {
    this.updateForm();
  }

  shouldComponentUpdate(nextProps: LocationDetailsFormProps, nextState: State) {
    return this.state !== nextState;
  }

  render() {
    const { editingExisting } = this.props;
    return (
      <div>
        <Fieldset>
          <Label htmlFor="nfs-protocol" required>
            NFS Protocol
          </Label>
          <Select
            type="select"
            name="protocol"
            id="nfs-protocol"
            isDisabled={editingExisting}
            onChange={this.onProtocolChange}
            value={this.state.protocol}
          >
            {NFS_PROTOCOLS.map((opt, i) => (
              <Select.Option key={i} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Fieldset>
        <Fieldset>
          <Label htmlFor="nfs-version" required>
            NFS Version
          </Label>
          <Select
            type="select"
            name="version"
            id="nfs-version"
            isDisabled={editingExisting}
            onChange={this.onVersionChange}
            value={this.state.version}
          >
            {NFS_VERSIONS.map((opt, i) => (
              <Select.Option key={i} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Fieldset>
        <Fieldset>
          <Label htmlFor="nfs-server" required>
            Server
          </Label>
          <Input
            type="text"
            name="server"
            id="nfs-server"
            disabled={editingExisting}
            placeholder="example: nfsserver.example.com"
            value={this.state.server}
            onChange={this.onChange}
            autoComplete="off"
          />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="nfs-path" required>
            Export Path
          </Label>
          <Input
            type="text"
            name="path"
            id="nfs-path"
            disabled={editingExisting}
            placeholder="example: /path/to/export"
            value={this.state.path}
            onChange={this.onChange}
            autoComplete="off"
          />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="nfs-options" required>
            NFS Options
          </Label>{' '}
          {/*maybe add info*/}
          <Input
            type="text"
            name="options"
            id="nfs-options"
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
