// @flow

import { Button, Input, Modal } from '@scality/core-ui';
import React from 'react';
// import styled from 'styled-components';

type Props = {
    createUser: (userName: string) => void,
};

type State = {
    userName: string,
    showModal: boolean,
};

export default class AddUser extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            userName: '',
            showModal: false,
        };
    }

    submit = (e: SyntheticInputEvent<HTMLButtonElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.props.createUser(this.state.userName);
        this.setState({ userName: '', showModal: false });
    }

    handleChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.setState({
            userName: e.target.value,
        });
    }

    close = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.setState({
            showModal: false,
        });
    }

    show = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.setState({
            showModal: true,
        });
    }

    render() {
        return (
            <div className="list-group-item flex-row-reverse">
                <Button outlined size="default" text="Add" type="submit"
                    id="add-account-btn"
                    onClick={this.show} />
                <Modal close={this.close}
                    footer={<div style={{display: 'flex', justifyContent: 'space-between'}}> <Button onClick={this.close} size="small" text="Cancel"/> <Button onClick={this.submit} size="small" text="Add"/> </div>}
                    isOpen={this.state.showModal}
                    title="Add User">
                    <Input
                        type="text"
                        name="userName"
                        placeholder="User Name"
                        onChange={this.handleChange}
                        value={this.state.userName}
                        autoComplete="off" />
                </Modal>
            </div>
        );
    }
}
