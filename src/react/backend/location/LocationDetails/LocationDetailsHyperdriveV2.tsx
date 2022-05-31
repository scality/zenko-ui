import { Fieldset, InputList } from '../../../ui-elements/FormLayout';
import React from 'react';
import { LocationDetailsFormProps } from '.';

type State = {
  bootstrapList: Array<string>;
};
const INIT_STATE = {
  bootstrapList: [''],
};
const MAX_HYPERDRIVE = 10;
export default class LocationDetailsHyperdriveV2 extends React.Component<
  LocationDetailsFormProps,
  State
> {
  constructor(props: LocationDetailsFormProps) {
    super(props);
    this.state = Object.assign({}, INIT_STATE, this.props.details);
  }

  onListChange = (newList: Array<string>) => {
    this.setState({
      bootstrapList: newList,
    });
  };

  componentDidUpdate(prevProps: LocationDetailsFormProps, prevState: State) {
    if (this.state !== prevState) {
      this.props.onChange(this.state);
    }
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
              placeholder: 'example:localhost:8181',
            })}
            values={this.state.bootstrapList}
            onChange={this.onListChange}
            maxItems={MAX_HYPERDRIVE}
          />
        </Fieldset>
      </div>
    );
  }
}
