import { InputList } from '../../ui-elements/FormLayout';
import { LocationDetails } from '../../../types/config';
import React from 'react';
import { FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
type Props = {
  details: LocationDetails;
  onChange: (details: LocationDetails) => void;
};
type State = {
  bootstrapList: Array<string>;
  proxyPath: string;
  chordCos: number;
};
const INIT_STATE = {
  bootstrapList: [''],
  proxyPath: '',
  chordCos: 0,
};
const SPROXYD_LIMIT = 6;
export default class LocationDetailsSproxyd extends React.Component<
  Props,
  State
> {
  constructor(props: Props) {
    super(props);
    this.state = Object.assign({}, INIT_STATE, this.props.details);
  }

  onListChange = (newList: Array<string>) => {
    this.setState({
      bootstrapList: newList,
    });
  };
  onChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target;
    let value;

    //@ts-expect-error fix this when you are working on it
    switch (target.name) {
      case 'chordCos':
        value =
          //@ts-expect-error fix this when you are working on it
          isNaN(target.value) || target.value === ''
            ? ''
            : //@ts-expect-error fix this when you are working on it
              parseInt(target.value, 10);
        break;

      default:
        //@ts-expect-error fix this when you are working on it
        value = target.value;
    }

    this.setState(
      //@ts-expect-error fix this when you are working on it
      {
        //@ts-expect-error fix this when you are working on it
        [target.name]: value,
      },
    );
  };
  updateForm = () => {
    if (this.props.onChange) {
      this.props.onChange(this.state);
    }
  };

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
      <FormSection>
        <InputList
          id="bootstrapList"
          required
          label="Bootstrap List"
          getInputProps={() => ({
            autoComplete: 'off',
            type: 'text',
            placeholder: 'localhost:8181',
          })}
          values={this.state.bootstrapList}
          onChange={this.onListChange}
          maxItems={SPROXYD_LIMIT}
        />

        <FormGroup
          id="proxyPath"
          label="Proxy Path"
          required
          content={
            <Input
              name="proxyPath"
              id="proxyPath"
              type="text"
              placeholder="/proxy/path"
              value={this.state.proxyPath}
              onChange={this.onChange}
              autoComplete="off"
            />
          }
        />

        <FormGroup
          id="chordCos"
          label="Replication Factor for Small Objects"
          required
          content={
            <Input
              name="chordCos"
              id="chordCos"
              type="text"
              placeholder="3"
              value={this.state.chordCos}
              onChange={this.onChange}
              autoComplete="off"
            />
          }
        />
      </FormSection>
    );
  }
}
