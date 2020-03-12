// @noflow
import React from 'react';
import TableContainer from '../ui-elements/TableContainer';
import {formatDate} from '../utils';
import styled from 'styled-components';

const Row = styled.tr`
    cursor: pointer;
`;

export default class UserList extends React.Component {
    rowClicked = (e, userName) => {
        if (e) {
            e.preventDefault();
        }
        this.props.getUser(userName);
    }
    render() {
        return (
            <TableContainer>
                <table>
                    <tbody>
                        <tr>
                            <th> UserName </th>
                            <th> Create time</th>
                        </tr>
                        {
                            this.props.userList.map(u =>
                                <Row onClick={e => this.rowClicked(e, u.UserName)} key={u.UserName}>
                                    <td> {u.UserName} </td>
                                    <td> {formatDate(u.CreateDate)} </td>
                                </Row>)
                        }
                    </tbody>
                </table>
            </TableContainer>
        );
    }
}
