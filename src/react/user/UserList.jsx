// @noflow
import React from 'react';
import styled from 'styled-components';

const TableSection = styled.div`
    display: flex;
    margin-top: 20px;
    font-size: 11px;
    table {
        border-collapse: collapse;
    }
    td {
        border-top: 1px solid #424242;
        padding: 5px;
    }
    tr:hover{
        background-color: grey;
    }
`;

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
                                    <td> {u.CreateDate.toString()} </td>
                                </Row>)
                        }
                    </tbody>
                </table>
            </TableSection>
        );
    }
}
