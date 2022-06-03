import {
  Fieldset,
  Input,
  InputList,
  Label,
} from '../../../ui-elements/FormLayout';
import type { LocationDetails } from '../../../../types/config';
import React from 'react';
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

    switch (target.name) {
      case 'chordCos':
        value =
          isNaN(target.value) || target.value === ''
            ? ''
            : parseInt(target.value, 10);
        break;

      default:
        value = target.value;
    }

    this.setState({
      [target.name]: value,
    });
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
      <div>
        <Fieldset>
          <InputList
            id="bootstrapList"
            required
            label="Bootstrap List"
            getInputProps={() => ({
              autoComplete: 'off',
              type: 'text',
              placeholder: 'example: localhost:8181',
            })}
            values={this.state.bootstrapList}
            onChange={this.onListChange}
            maxItems={SPROXYD_LIMIT}
          />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="proxyPath" required>
            Proxy Path
          </Label>
          <Input
            name="proxyPath"
            id="proxyPath"
            type="text"
            placeholder="example: /proxy/path"
            value={this.state.proxyPath}
            onChange={this.onChange}
            autoComplete="off"
          />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="chordCos" required>
            Replication Factor for Small Objects
          </Label>
          <Input
            name="chordCos"
            id="chordCos"
            type="text"
            placeholder="example: 3"
            value={this.state.chordCos}
            onChange={this.onChange}
            autoComplete="off"
          />
        </Fieldset>
      </div>
    );
  }
}
