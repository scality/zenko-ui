import { Button, Input, Modal } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
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

class AccessKey extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            copied: false,
        };
    }

    closeSecretModal = e => {
        if (e) {
            e.preventDefault();
        }
        this.props.deleteSecret(this.props.keys.AccessKeyId);
        this.props.closeSecretDialog()
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

    openSecretModal = e => {
        if (e) {
            e.preventDefault();
        }
        this.props.openSecretDialog(this.props.keys.AccessKeyId)
    }

    deleteKey = (e) => {
        if (e) {
            e.preventDefault();
        }
        this.props.deleteAccessKey(this.props.keys.AccessKeyId, this.props.keys.UserName);
    }

    openKeyDeleteDialog = (e) => {
        if (e) {
            e.preventDefault();
        }
        this.props.openKeyDeleteDialog(this.props.keys.AccessKeyId);
    }

    render() {
        return <div>
            {
                this.props.secretShown && <Modal
                    close={this.closeSecretModal}
                    footer={<div style={{display: 'flex', justifyContent: 'flex-end'}}> <Button outlined onClick={this.copySecretToClipboard} size="small" text={this.state.copied ? 'Copied' : 'Copy'}/> <Button outlined onClick={this.closeSecretModal} size="small" text="Close"/> </div>}
                    isOpen={true}
                    title="Copy Secret Key">
                    <div style={{margin: '0px 0px 20px'}}>
                        <div>Secret Key for {this.props.keys.UserName}</div>
                        <InputWrapper>
                            <input type="text" readOnly value={this.props.secretKey} ref={n => this.clipboardInput = n} />
                        </InputWrapper>
                        <small>It is shown in cleartext this one time only.</small>
                    </div>
                </Modal>
            }
            {
                this.props.secretKey && <Button outlined size="small" text="Show" onClick={this.openSecretModal}/>
            }
            {this.deleteDialog()}
            <Button outlined size="small" text="Delete" onClick={this.openKeyDeleteDialog}/>
        </div>;
    }

    deleteDialog = () => {
        if (!this.props.deleteShown) {
            return null;
        }
        return <DeleteConfirmation cancel={this.props.closeKeyDeleteDialog} approve={this.deleteKey} titleText={`Are you sure you want to delete key: ${this.props.keys.AccessKeyId} ?`}/>;
    }

}

export default AccessKey;
