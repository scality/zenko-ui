// @flow

import { createUser, getUser, listAccessKeys, listUsers } from '../actions';
import AddUser from './AddUser';
import type { AppState } from '../../types/state';
import type { DispatchAPI } from 'redux';
import React from 'react';
import type { User } from '../../types/user';
import UserDisplay from './UserDisplay';
import UserList from './UserList';
import { connect } from 'react-redux';
import styled from 'styled-components';

const UsersContainer = styled.div`
    display: flex;
    width: 100%;
`;

const UserLeftSection = styled.div`
    flex: 0 0 450px;
    flex-direction: column;
    color: #fff;

    padding: 10px;
    background: #111112;
`;

const UserRightSection = styled.div`
    display: flex;
    flex: 0 1 auto;
    flex-direction: column;
    color: #fff;


    width: calc(100vw - 450px);
    background: deepskyblue;
    padding: 10px;
`;

const ManageUserSection = styled.div`
    background-color: #1c1c20;
    padding: 10px;
    border-radius: 5px;
    height: 100%;
`;


type DispatchProps = {
    listUsers: () => void,
    createUser: (userName: string) => void,
};

type StateProps = {
    userList: ?Array<User>,
    displayedUser: User,
};

type Props = StateProps & DispatchProps;

class Users extends React.Component<Props>{

    componentDidMount() {
        console.log("componentDidMount!!!");
        this.props.listUsers();
    }

    render() {
        console.log('User render()');
        return (
            <UsersContainer>
                <UserLeftSection>
                    <ManageUserSection>
                        <AddUser createUser={this.props.createUser} />
                        <UserList getUser={this.props.getUser} userList={this.props.userList}/>
                    </ManageUserSection>
                </UserLeftSection>
                <UserRightSection>
                    <UserDisplay
                        displayedUser={this.props.displayedUser}
                    />
                </UserRightSection>
            </UsersContainer>
        );
    }

}

function mapStateToProps(state: AppState): StateProps{
    return {
        userList: state.user.list,
        displayedUser: state.user.displayedUser,
        attachedPoliciesList: state.user.attachedPoliciesList,
    };
}

function mapDispatchToProps(dispatch): DispatchProps{
    return {
        listUsers: () => dispatch(listUsers()),
        createUser: (userName: string) => dispatch(createUser(userName)),
        getUser: (userName: string) => dispatch(getUser(userName)),
    };
}

export default connect<any, any, any, any, any, any>(mapStateToProps, mapDispatchToProps)(Users);
