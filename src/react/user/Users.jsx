// @flow

import { closeUserDeleteDialog, createUser, deleteUser, getUser, listUsers, openUserDeleteDialog } from '../actions';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import React from 'react';
import type { User } from '../../types/user';
import UserDisplay from './UserDisplay';
import UserList from './UserList';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';

const UsersContainer = styled.div`
    display: flex;
    width: 100%;
`;

const UserLeftSection = styled.div`
    flex: 0 0 450px;
    flex-direction: column;

    padding: 10px;
    background: #111112;
`;

const UserRightSection = styled.div`
    display: flex;
    flex: 0 1 calc(100vw - 450px);
    flex-direction: column;

    background: #111112;
    padding: 10px;
`;

const ManageUserSection = styled.div`
    background-color: #1c1c20;
    padding: 10px;
    border-radius: 5px;
    height: calc(100% - 20px);
`;


type DispatchProps = {
    listUsers: () => void,
    createUser: (userName: string) => void,
    deleteUser: (userName: string) => void,
    redirect: (path: string) => void,
};

type StateProps = {
    userList: ?Array<User>,
    displayedUser: User,
};

type Props = StateProps & DispatchProps;

class Users extends React.Component<Props>{

    componentDidMount() {
        this.props.listUsers();
    }

    redirect = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (e) {
            e.preventDefault();
        }
        return this.props.redirect('/users/create');
    }

    render() {
        return (
            <UsersContainer>
                <UserLeftSection>
                    <ManageUserSection>
                        <Button outlined onClick={this.redirect} size="default" text="Add" type="submit" />
                        <UserList getUser={this.props.getUser} userList={this.props.userList} displayedUser={this.props.displayedUser}/>
                    </ManageUserSection>
                </UserLeftSection>
                <UserRightSection>
                    <UserDisplay
                        displayedUser={this.props.displayedUser}
                        deleteUser={this.props.deleteUser}
                        openUserDeleteDialog={this.props.openUserDeleteDialog}
                        closeUserDeleteDialog={this.props.closeUserDeleteDialog}
                        showDelete={this.props.showDelete}
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
        showDelete: state.uiUser.showDelete,
    };
}

function mapDispatchToProps(dispatch): DispatchProps{
    return {
        deleteUser: (userName: string) => dispatch(deleteUser(userName)),
        listUsers: () => dispatch(listUsers()),
        createUser: (userName: string) => dispatch(createUser(userName)),
        getUser: (userName: string) => dispatch(getUser(userName)),
        openUserDeleteDialog: () => dispatch(openUserDeleteDialog()),
        closeUserDeleteDialog: () => dispatch(closeUserDeleteDialog()),
        redirect: (path: string) => dispatch(push(path)),
    };
}

export default connect<any, any, any, any, any, any>(mapStateToProps, mapDispatchToProps)(Users);
