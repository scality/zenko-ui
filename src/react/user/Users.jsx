// @flow

import type { AppState } from '../../types/state';
import React from 'react';
import type { User } from '../../types/user';
import UserDisplay from './UserDisplay';
import UserInformation from './UserInformation';
import UserList from './UserList';
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

const UserRightHead = styled.div`
    display: flex;

    height: 100px;
    border-radius: 5px;
    padding: 15px;
    background: repeating-radial-gradient(
      circle at 5% 5%,
      #212127,
      #212127 3px,
      #32323a 3px,
      #32323a 15px
    );
`;

const UserRightContent = styled.div`
  display: flex;
  flex-direction: column;

  min-height: calc(100vh - 150px);
  margin-top: 10px;
  background-color: ${props => props.theme.brand.primaryDark1};
  border-radius: 5px;
  .sc-tabs{
      width: 100%;
  }
  .sc-tabs-item{
      min-width: 100px;
  }
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
                    <UserList/>
                </UserLeftSection>
                <UserRightSection>
                    <UserRightHead>
                        <UserDisplay/>
                    </UserRightHead>
                    <UserRightContent>
                        <UserInformation/>
                    </UserRightContent>
                </UserRightSection>
            </UsersContainer>
        );
    }

}

export default Users;
