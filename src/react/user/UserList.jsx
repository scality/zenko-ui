// @noflow
import { Button } from '@scality/core-ui';
import React from 'react';
import { TableContainer, Row } from '../ui-elements/Table';
import { connect } from 'react-redux';
import {formatDate} from '../utils';
import { getUser } from '../actions';
import { push } from 'connected-react-router';
import styled from 'styled-components';

const ManageUserSection = styled.div`
    background-color: ${props => props.theme.brand.backgroundContrast1};
    padding: 10px;
    border-radius: 5px;
    height: calc(100% - 20px);
`;

class UserList extends React.Component {
    rowClicked = (e, userName) => {
        if (e) {
            e.preventDefault();
        }
        if (this.isSelected(userName)) {
            return;
        }
        return this.props.getUser(userName);
    }

    isSelected(userName) {
        return this.props.displayedUser.UserName && this.props.displayedUser.UserName === userName;
    }
    render() {
        return (
            <ManageUserSection>
                <Button outlined onClick={() => this.props.redirect('/users/create')} size="default" text="Add" type="submit" />
                <TableContainer>
                    <table>
                        <tbody>
                            <tr>
                                <th> UserName </th>
                                <th> Create time</th>
                            </tr>
                            {
                                this.props.userList.map(u =>
                                    <Row onClick={e => this.rowClicked(e, u.UserName)} selected={this.isSelected(u.UserName)} key={u.UserName}>
                                        <td> {u.UserName} </td>
                                        <td> {formatDate(u.CreateDate)} </td>
                                    </Row>)
                            }
                        </tbody>
                    </table>
                </TableContainer>
            </ManageUserSection>
        );
    }
}

function mapStateToProps(state: AppState): StateProps{
    return {
        userList: state.user.list,
        displayedUser: state.user.displayedUser,
    };
}

function mapDispatchToProps(dispatch): DispatchProps{
    return {
        getUser: (userName: string) => dispatch(getUser(userName)),
        redirect: (path: string) => dispatch(push(path)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserList);
