import { Button, Input, Modal } from '@scality/core-ui';
import React from 'react';
import styled from 'styled-components';

const InputWrapper = styled.div`
    margin: 10px 0px;
    input {
        width: 370px;
        background-color: #ffffff;
        color: #87929D;
        border: 1px solid #87929D;
        padding: 8px 10px;
        font-size: 14px;
        display: block;
        border-radius: 4px;
    };
`;

class ShowSecretKeyButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isModal: false,
            copied: false,
        };
    }
    showModal = e => {
        if (e) {
            e.preventDefault();
        }
        this.setState({
            isModal: true,
        });
    };

    close = e => {
        if (e) {
            e.preventDefault();
        }
        this.props.deleteSecret(this.props.keys.AccessKeyId);
        this.setState({
            isModal: false,
        });
    };

    copySecretToClipboard = e => {
        if (this.clipboardInput) {
            this.clipboardInput.select();
            document.execCommand('copy');
            this.setState({ copied: true });
        }
        if (e) {
            e.preventDefault();
        }
    }
    render() {
        return <div>
            <Modal
                close={this.close}
                footer={<div style={{display: 'flex', justifyContent: 'flex-end'}}> <Button onClick={this.copySecretToClipboard} size="small" text={this.state.copied ? 'Copied' : 'Copy'}/> <Button onClick={this.close} size="small" text="Close"/> </div>}
                isOpen={this.state.isModal}
                title="Create New Keys">
                <div style={{margin: '0px 0px 20px'}}>
                    <div>Secret Key for {this.props.keys.UserName}</div>
                    <InputWrapper>
                        <input type="text" readOnly value={this.props.secretKey} ref={n => this.clipboardInput = n} />
                    </InputWrapper>
                    <small>It is shown in cleartext this one time only.</small>
                </div>
            </Modal>
            {
                this.props.secretKey && <Button size="small" text="Show" onClick={this.showModal}/>
            }
        </div>;
    }

}

export default ShowSecretKeyButton;
