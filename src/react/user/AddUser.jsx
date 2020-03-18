// @flow
import { Button, Input } from '@scality/core-ui';
import React from 'react';
import { connect } from 'react-redux';
import { createUser } from '../actions';
import { push } from 'connected-react-router'
import styled from 'styled-components';

const Container = styled.div`

    display: flex;
    flex-direction: column;

    max-width: 600px;
    margin: 10px;
    padding: 20px;
    background-color: #1c1c20;
    border-radius: 5px;
    text-transform: uppercase;

    .title {
        display: flex;
        margin-bottom: 60px;
        font-size: 19px;
    }
    .input{
        display: flex;
        align-items: baseline;
        input{
            margin-left: 50px;
            width: 300px;
        }
    }
    .footer {
      display: flex;
      justify-content: flex-end;

      text-transform: lowercase;
      margin-top: 60px;

      button{
          margin-left: 5px;
      }
    }
`;
// import styled from 'styled-components';

type Props = {
    createUser: (userName: string) => void,
};

type State = {
    userName: string,
};

class AddUser extends React.Component<Props, State> {
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
        this.setState({ userName: ''});
    }

    handleChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.setState({
            userName: e.target.value,
        });
    }

    redirect = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (e) {
            e.preventDefault();
        }
        this.props.redirect();
    }

    render() {
        console.log('adduser!!!');
        return (
            <Container>
                <div className='title'> create new user </div>
                <div className='input'>
                    <div className='name'> name: </div>
                    <Input
                        type='text'
                        name='userName'
                        placeholder='User Name'
                        onChange={this.handleChange}
                        value={this.state.userName}
                        autoComplete='off' />
                </div>
                <div className='footer'>
                    <Button outlined onClick={this.redirect} size='small' text='Cancel'/>
                    <Button outlined onClick={this.submit} size='small' text='Add'/>
                </div>
            </Container>
        );
    }
}

function mapDispatchToProps(dispatch): DispatchProps{
    return {
        createUser: (userName: string) => dispatch(createUser(userName)),
        redirect: () => dispatch(push('/users')),
    };
}

export default connect<any, any, any, any, any, any>(null, mapDispatchToProps)(AddUser);
