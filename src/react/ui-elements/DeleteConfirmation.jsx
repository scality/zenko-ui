/* eslint-disable */

import { Button, Modal } from '@scality/core-ui';
import React from 'react';
import styled from 'styled-components';

const ModalContainer = styled.div`
    .sc-modal-footer{
      display: flex;
      justify-content: flex-end;
      button{
          margin-left: 5px;
      }
    }
`;

type Props = {
    approve: () => void,
    cancel: () => void,
    titleText: string,
};

export default class DeleteConfirmation extends React.Component<Props> {

    submit = (e: SyntheticInputEvent<HTMLButtonElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.props.approve();
    }

    render() {
        if (!this.props.show) {
            return null;
        }
        return (
            <ModalContainer>
                <Modal
                    close={this.props.cancel}
                    isOpen={true}
                    footer={<div><Button outlined onClick={this.props.cancel} size="small" text="Cancel"/><Button outlined onClick={this.submit} size="small" text="Delete"/></div>}
                    title='Confirmation'>
                    <div> {this.props.titleText} </div>
                </Modal>
            </ModalContainer>
        );
    }
}
