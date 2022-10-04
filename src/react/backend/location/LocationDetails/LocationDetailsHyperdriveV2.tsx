import React from 'react';
import { LocationDetailsFormProps } from '.';
import InputList from '../../../ui-elements/InputList';
import { FormSection } from '@scality/core-ui';

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

  updateForm = () => {
    if (this.props.onChange) {
      this.props.onChange(this.state);
    }
  };
  componentDidMount() {
    this.updateForm();
  }

  componentDidUpdate(prevProps: LocationDetailsFormProps, prevState: State) {
    if (this.state !== prevState) {
      this.props.onChange(this.state);
    }
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
            placeholder: 'example: localhost:8181',
          })}
          values={this.state.bootstrapList}
          onChange={this.onListChange}
          maxItems={MAX_HYPERDRIVE}
        />
      </FormSection>
    );
  }
}
