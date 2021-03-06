// @flow
import { Fieldset, InputList, Label } from '../../../ui-elements/FormLayout';
import type { LocationDetails } from '../../../../types/config';
import React from 'react';

type Props = {
    details: LocationDetails,
    onChange: (details: LocationDetails) => void,
};

type State = {
    bootstrapList: Array<string>,
};

const INIT_STATE = {
    bootstrapList: [],
};

const MAX_HYPERDRIVE = 10;

export default class LocationDetailsHyperdriveV2 extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = Object.assign({}, INIT_STATE, this.props.details);
    }

    onListChange = (newList: Array<string>) => {
        this.setState({
            bootstrapList: newList,
        });
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (this.state !== prevState) {
            this.props.onChange(this.state);
        }
    }

    render() {
        return (
            <div>
                <Fieldset>
                    <Label htmlFor="bootstrapList">Bootstrap List</Label>
                    <InputList
                        name="bootstrapList"
                        id="bootstrapList"
                        entries={this.state.bootstrapList}
                        listLimit={MAX_HYPERDRIVE}
                        onUpdate={this.onListChange}
                    />
                </Fieldset>
            </div>
        );
    }
}
