import type { LocationDetails } from '../../../types/config';
import React from 'react';
import { LocationDetailsFormProps } from '.';
import { FormGroup, FormSection } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
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

  //@ts-expect-error fix this when you are working on it
  if (!details.endpoint) {
    //@ts-expect-error fix this when you are working on it
    return retState;
  }

  const {
    protocol: scheme,
    host: server,
    pathname: path,
    search: options,
    //@ts-expect-error fix this when you are working on it
  } = new URL(details.endpoint);
  const [protocol, version] = scheme.slice(0, -1).split('+');
  return {
    //@ts-expect-error fix this when you are working on it
    protocol,
    //@ts-expect-error fix this when you are working on it
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
  //@ts-expect-error fix this when you are working on it
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
      //@ts-expect-error fix this when you are working on it
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

    this.setState(
      //@ts-expect-error fix this when you are working on it
      {
        [target.name]: value,
      },
    );
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
      <FormSection>
        <FormGroup
          id="nfs-protocol"
          label="NFS Protocol"
          required
          helpErrorPosition="bottom"
          content={
            <Select
              //@ts-expect-error fix this when you are working on it
              name="protocol"
              className="nfs-protocol"
              id="nfs-protocol"
              disabled={editingExisting}
              onChange={this.onProtocolChange}
              value={this.state.protocol}
            >
              {NFS_PROTOCOLS.map((opt, i) => (
                <Select.Option key={i} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          }
        />

        <FormGroup
          id="nfs-version"
          label="NFS Version"
          required
          helpErrorPosition="bottom"
          content={
            <Select
              className="nfs-version"
              id="nfs-version"
              disabled={editingExisting}
              onChange={this.onVersionChange}
              value={this.state.version}
            >
              {NFS_VERSIONS.map((opt, i) => (
                <Select.Option key={i} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          }
        />

        <FormGroup
          id="nfs-server"
          label="Server"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              type="text"
              name="server"
              id="nfs-server"
              disabled={editingExisting}
              placeholder="nfsserver.example.com"
              value={this.state.server}
              onChange={this.onChange}
              autoComplete="off"
            />
          }
        />

        <FormGroup
          id="nfs-path"
          label="Export Path"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              type="text"
              name="path"
              id="nfs-path"
              disabled={editingExisting}
              placeholder="/path/to/export"
              value={this.state.path}
              onChange={this.onChange}
              autoComplete="off"
            />
          }
        />

        <FormGroup
          id="nfs-options"
          label="NFS Options"
          required
          helpErrorPosition="bottom"
          content={
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
          }
        />

        {/*maybe add info*/}
      </FormSection>
    );
  }
}
