// @flow

import { Button, Modal } from '@scality/core-ui';
import React from 'react';
// import styled from 'styled-components';

type Props = {
    delete: () => void,
};

type State = {
    showModal: boolean,
};

export default class DeleteConfirmation extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            showModal: false,
        };
    }

    submit = (e: SyntheticInputEvent<HTMLButtonElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.props.delete();
        this.setState({ showModal: false });
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
                <Button outlined size="small" text={this.props.buttonText} type="submit"
                    onClick={this.show} />
                <Modal close={this.close}
                    footer={<div style={{display: 'flex', justifyContent: 'space-between'}}> <Button outlined onClick={this.close} size="small" text="Cancel"/> <Button outlined onClick={this.submit} size="small" text="Delete"/> </div>}
                    isOpen={this.state.showModal}
                    title='Confirmation'>
                    <div> {this.props.titleText} </div>
                </Modal>
            </div>
        );
    }
}
