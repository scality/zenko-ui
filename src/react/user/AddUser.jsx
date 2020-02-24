// @flow

import { Button, Input } from '@scality/core-ui';
import React from 'react';
import styled from 'styled-components';

type Props = {
    createUser: (userName: string) => void,
};

type State = {
    userName: string,
};

const FormSection = styled.form`
    display: flex;
    align-items: baseline;
    justify-content: space-around;
    .sc-input {
      flex: 0 0 370px;
      box-sizing: border-box;
      .sc-input-wrapper {
        flex: 1;
      }
      .sc-input-type{
        background-color: #000;
      }
    }
    .sc-button {
      flex: 0 1 auto;
      width: 50px
    }
  `;

export default class AddUser extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            userName: '',
        };
    }

    submit = (e: SyntheticInputEvent<HTMLButtonElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.props.createUser(this.state.userName);
        this.setState({ userName: '' });
    }

    handleChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.setState({
            userName: e.target.value,
        });
    }

    render() {
        return (
            <div className="list-group-item flex-row-reverse">
                <FormSection onSubmit={this.submit}>
                    <Input
                        type="text"
                        name="userName"
                        placeholder="User Name"
                        onChange={this.handleChange}
                        value={this.state.userName}
                        autoComplete="off" />
                    <span className="icon icon-add-user"></span>
                    <Button size="default" text="Add" type="submit"
                        id="add-account-btn"
                        onClick={this.submit} />
                </FormSection>
            </div>
        );
    }
}
