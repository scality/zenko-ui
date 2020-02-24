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
    }
`;

export default class UserList extends React.Component {
    render() {
        return (
            <TableSection>
                <table>
                    <tbody>
                        <tr>
                            <th> UserName </th>
                            <th> ARN </th>
                            <th> Create time</th>
                            <th> User ID</th>
                        </tr>
                        {
                            this.props.userList.map(u =>
                                <tr key={u.UserId}>
                                    <td> {u.UserName} </td>
                                    <td> {u.Arn} </td>
                                    <td> {u.CreateDate.toString()} </td>
                                    <td> {u.UserId} </td>
                                </tr>)
                        }
                    </tbody>
                </table>
            </TableSection>
        );
    }
}
