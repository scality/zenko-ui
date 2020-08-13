// @flow
import { Fieldset, Input, InputList, Label } from '../../../ui-elements/FormLayout';
import type { LocationDetails } from '../../../../types/config';
import React from 'react';

type Props = {
    details: LocationDetails,
    onChange: (details: LocationDetails) => void,
};

type State = {
    bootstrapList: Array<string>,
    proxyPath: string,
    chordCos: number,
};

const INIT_STATE = {
    bootstrapList: [],
    proxyPath: '',
    chordCos: 0,
};

const SPROXYD_LIMIT = 6;

export default class LocationDetailsSproxyd extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = Object.assign({}, INIT_STATE, this.props.details);
    }

    onListChange = (newList: Array<string>) => {
        this.setState({
            bootstrapList: newList,
        });
    }

    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        const target = e.target;
        let value;
        switch (target.name) {
        case 'chordCos':
            value = isNaN(target.value) || target.value === '' ? '' :
                parseInt(target.value, 10);
            break;
        default:
            value = target.value;
        }
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
        return (
            <div>
                <Fieldset>
                    <Label htmlFor="bootstrapList" tooltipMessages={[`max. ${SPROXYD_LIMIT} entries`]}>
                        Bootstrap List
                    </Label>
                    <InputList
                        name="bootstrapList"
                        id="bootstrapList"
                        entries={this.state.bootstrapList}
                        listLimit={SPROXYD_LIMIT}
                        onUpdate={this.onListChange}
                    />
                </Fieldset>
                <Fieldset>
                    <Label htmlFor="">Proxy Path</Label>
                    <Input
                        name="proxyPath"
                        id="proxyPath"
                        type="text"
                        placeholder="/proxy/path"
                        value={this.state.proxyPath}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </Fieldset>
                <Fieldset>
                    <Label htmlFor="chordCos">Replication Factor for Small Objects</Label>
                    <Input
                        name="chordCos"
                        id="chordCos"
                        type="text"
                        placeholder="3"
                        value={this.state.chordCos}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </Fieldset>
            </div>
        );
    }
}
