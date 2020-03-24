// @flow

// import InputList from '../../../ui-elements/InputList';
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

    // <InputList
    //     name="bootstrapList"
    //     id="bootstrapList"
    //     className="form-control"
    //     entries={this.state.bootstrapList}
    //     listLimit={SPROXYD_LIMIT}
    //     onUpdate={this.onListChange}
    // />

    render() {
        return (
            <div>
                <fieldset className="form-group">
                    <label htmlFor="bootstrapList">Bootstrap List <small>(max. 6 entries)</small></label>
                    <div> InputList </div>
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="">Proxy Path</label>
                    <input
                        name="proxyPath"
                        id="proxyPath"
                        className="form-control"
                        type="text"
                        placeholder="/proxy/path"
                        value={this.state.proxyPath}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </fieldset>
                <fieldset className="form-group">
                    <label htmlFor="chordCos">Replication Factor for Small Objects</label>
                    <input
                        name="chordCos"
                        id="chordCos"
                        className="form-control"
                        type="text"
                        placeholder="3"
                        value={this.state.chordCos}
                        onChange={this.onChange}
                        autoComplete="off"
                    />
                </fieldset>
            </div>
        );
    }
}
