// @noflow
import { closeUserDeleteDialog, deleteUser, openUserDeleteDialog } from '../actions';
import { Button } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import Hide from '../ui-elements/Hide';
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';

const UserInfo = styled.div`
  display: flex;
  flex-wrap: wrap;

  height: 100px;
  // width: calc(80% - 10px);
  // margin-left: 20px;
  width: 100%;
  align-items: baseline;
  justify-content: space-between;

  .username{
    font-size: 25px;
  }
  .arn{
    font-size: 20px;
    margin-left: 10px;
  }
`;

const UserDisplayContainer = styled.div`
    display: flex;
    width: 100%;
`;

class UserDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: 0,
        };
    }

    setTab = (tab) => {
        this.setState({
            tab,
        });
    }

    isSelected = tab => {
        return tab === this.state.tab;
    }

    render() {
        const user = this.props.displayedUser;
        return <UserDisplayContainer>
            <DeleteConfirmation show={this.props.showDelete} cancel={this.props.closeUserDeleteDialog} approve={() => this.props.deleteUser(this.props.displayedUser.UserName)} titleText={`Are you sure you want to delete user: ${this.props.displayedUser.UserName} ?`}/>
            <Hide isHidden={!user.UserName}>
                <UserInfo>
                    <div className='username'> {user.UserName} </div>
                    <Button outlined size="small" text='Delete user' type="submit"
                        onClick={this.props.openUserDeleteDialog} />
                </UserInfo>
            </Hide>
        </UserDisplayContainer>;
    }
}

function mapStateToProps(state: AppState): StateProps{
    return {
        displayedUser: state.user.displayedUser,
        showDelete: state.uiUser.showDelete,
    };
}

function mapDispatchToProps(dispatch): DispatchProps{
    return {
        deleteUser: (userName: string) => dispatch(deleteUser(userName)),
        openUserDeleteDialog: () => dispatch(openUserDeleteDialog()),
        closeUserDeleteDialog: () => dispatch(closeUserDeleteDialog()),
        redirect: (path: string) => dispatch(push(path)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserDisplay);
