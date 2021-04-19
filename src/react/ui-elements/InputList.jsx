// @flow
import { Button as BasicButton } from '@scality/core-ui';
import { default as BasicInput } from './Input';
import React from 'react';
import styled from 'styled-components';

type Props = {
    className: string,
    entries: Array<string>,
    listLimit: number,
    onUpdate: (entries: Array<string>) => void,
};

type State = {
    entries: Array<string>,
};

const InputGroups = styled.div`
    display: flex;
    flex-direction: column;
`;

const InputGroup = styled.div`
    display: flex;
`;

const Input = styled(BasicInput)`
    margin-bottom: 5px;
`;

const Button = styled(BasicButton)`
    margin-left: 5px;
    &.invisible {
        visibility:hidden;
    }
`;

export default class InputList extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            entries: [
                ...this.props.entries,
            ],
        };
    }

    insertEntry = () => {
        const updatedList = [...this.state.entries];
        updatedList.push('');
        this.setState({ entries: updatedList });
    }

    deleteEntry = (index: number) => {
        const updatedList = [...this.state.entries];
        updatedList.splice(index, 1);
        this.setState({ entries: updatedList });
    }

    updateEntry = (index: number) =>
        (e: SyntheticInputEvent<HTMLInputElement>) => {
            const updatedList = [...this.state.entries];
            updatedList[index] = e.target.value;
            this.setState({ entries: updatedList });
        }

    updateList = () => {
        if (this.props.onUpdate) {
            this.props.onUpdate(this.state.entries);
        }
    }

    maybeAddButton = (index: number) => {
        let isVisible = 'invisible';
        let isDisabled = false;
        let onClickFn = () => {};
        if (index === this.state.entries.length - 1 ||
            this.state.entries.length <= 0) {
            isVisible = 'visible';
            onClickFn = () => this.insertEntry();
        }
        if (this.props.listLimit > 0 &&
            this.state.entries.length >= this.props.listLimit ||
            this.state.entries[index] === '') {
            isDisabled = true;
            onClickFn = () => {};
        }

        return (
            <Button
                variant="buttonSecondary"
                className={isVisible}
                title="Add"
                disabled={isDisabled}
                name="addbtn"
                id="addbtn"
                onClick={onClickFn}
                icon={<i className="fa fa-plus-square" />}
            />
        );
    }

    maybeSubButton = (index: number) => {
        let isDisabled = true;
        let onClickFn = () => {};
        if (this.state.entries.length > 1) {
            isDisabled = false;
            onClickFn = () => this.deleteEntry(index);
        }
        return (
            <Button
                variant="buttonDelete"
                title="Remove"
                disabled={isDisabled}
                name={`delbtn${index}`}
                id={`delbtn${index}`}
                onClick={onClickFn}
                icon={<i className="fa fa-minus-square" />}
            />
        );
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return this.state !== nextState;
    }

    componentDidUpdate() {
        this.updateList();
    }

    componentDidMount() {
        if (this.state.entries.length <= 0) {
            this.insertEntry();
        }
    }

    handleKeyEvent = (e: SyntheticKeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' &&
            this.state.entries.length < this.props.listLimit) {
            this.insertEntry();
        }
    }

    genEntry = (value: string, index: number) => {
        return (
            <InputGroup key={`input-entry-${index}`}
                className="my-2"
                name="listEntries"
            >
                <Input
                    type="text"
                    name={`entry${index}`}
                    id={`entry${index}`}
                    onChange={this.updateEntry(index)}
                    placeholder="localhost:8181"
                    value={value}
                    autoComplete="off"
                />
                {this.maybeSubButton(index)}
                {this.maybeAddButton(index)}
            </InputGroup>
        );
    }

    render() {
        const { entries } = this.state;
        const lastEntry = entries.length - 1;
        return (
            <InputGroups className={this.props.className}>
                {entries.slice(0, -1).map(this.genEntry)}
                <InputGroup>
                    <Input
                        className="form-control"
                        type="text"
                        name={`entry${lastEntry}`}
                        id={`entry${lastEntry}`}
                        onChange={this.updateEntry(lastEntry)}
                        placeholder="localhost:8181"
                        value={entries[lastEntry]}
                        autoComplete="off"
                        onKeyPress={this.handleKeyEvent}
                    />
                    {this.maybeSubButton(lastEntry)}
                    {this.maybeAddButton(lastEntry)}
                </InputGroup>
            </InputGroups>
        );
    }
}
