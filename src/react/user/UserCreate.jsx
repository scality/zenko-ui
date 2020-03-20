// @flow
import { Button, Input } from '@scality/core-ui';
import CreateContainer from '../ui-elements/CreateContainer';
import React from 'react';
import { connect } from 'react-redux';
import { createUser } from '../actions';
import { push } from 'connected-react-router';
import styled from 'styled-components';

// import styled from 'styled-components';

type Props = {
    createUser: (userName: string) => void,
    redirect: (path: string) => void,
};

type State = {
    userName: string,
};

class UserCreate extends React.Component<Props, State> {
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
        this.setState({
            userName: e.target.value,
        });
    }

    redirect = () => {
        this.props.redirect('/users');
    }

    render() {
        return (
            <CreateContainer>
                <div className='title'> create new user </div>
                <div className='input'>
                    <div className='name'> name </div>
                    <Input
                        type='text'
                        name='userName'
                        placeholder='User Name'
                        onChange={this.handleChange}
                        value={this.state.userName}
                        autoComplete='off' />
                </div>
                <div className='footer'>
                    <Button outlined onClick={this.redirect} text='Cancel'/>
                    <Button outlined onClick={this.submit} text='Add'/>
                </div>
            </CreateContainer>
        );
    }
}

function mapDispatchToProps(dispatch): DispatchProps{
    return {
        createUser: (userName: string) => dispatch(createUser(userName)),
        redirect: (path: string) => dispatch(push(path)),
    };
}

export default connect<any, any, any, any, any, any>(null, mapDispatchToProps)(UserCreate);
