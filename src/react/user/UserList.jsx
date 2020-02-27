// @noflow
import React from 'react';
import TableSection from '../ui-elements/TableSection';
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
            <TableSection>
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
            </TableSection>
        );
    }
}
