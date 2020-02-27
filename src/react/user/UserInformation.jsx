import { Button } from '@scality/core-ui';
import React from 'react';
import TableSection from '../ui-elements/TableSection';
import { connect } from 'react-redux';
import {formatDate} from '../utils';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const TableWrapper = styled.div`
    margin-top: 20px;
    min-height: 130px;
`

const Title = styled.div`
  display: flex;
  align-items: baseline;
  width: 100%;
  justify-content: space-between;
`;


class UserInformation extends React.Component{

    render() {
        return <Wrapper>
            <TableWrapper>
                <Title>
                    <div>
                        User Keys ({this.props.accessKeyList.length})
                    </div>
                    <Button size="small" text="Create Key"/>
                </Title>
                <TableSection hide={this.props.accessKeyList.length === 0}>
                    <table>
                        <tbody>
                            <tr>
                                <th> Status </th>
                                <th> Access Key </th>
                                <th> Create On</th>
                            </tr>
                            {
                                this.props.accessKeyList.map(a =>
                                    <tr key={a.AccessKeyId}>
                                        <td> {a.Status} </td>
                                        <td> {a.AccessKeyId} </td>
                                        <td> {formatDate(a.CreateDate)} </td>
                                    </tr>)
                            }
                        </tbody>
                    </table>
                </TableSection>
            </TableWrapper>
            <TableWrapper>
                <Title> User Policies ({this.props.attachedPoliciesList.length})</Title>
                <TableSection hide={this.props.attachedPoliciesList.length === 0}>
                    <table>
                        <tbody>
                            <tr>
                                <th> Name </th>
                                <th> ARN </th>
                            </tr>
                            {
                                this.props.attachedPoliciesList.map(p =>
                                    <tr key={p.PolicyName}>
                                        <td> {p.PolicyName} </td>
                                        <td> {p.PolicyArn} </td>
                                    </tr>)
                            }
                        </tbody>
                    </table>
                </TableSection>
            </TableWrapper>
            <TableWrapper>
                <Title> Linked Groups ({this.props.groupList.length})</Title>
                <TableSection hide={this.props.groupList.length === 0}>
                    <table>
                        <tbody>
                            <tr>
                                <th> Path </th>
                                <th> Group Name </th>
                                <th> Group ID </th>
                                <th> Group ARN </th>
                                <th> Created On </th>
                            </tr>
                            {
                                this.props.groupList.map(g =>
                                    <tr key={g.GroupId}>
                                        <td> {g.Path} </td>
                                        <td> {g.GroupName} </td>
                                        <td> {g.GroupId} </td>
                                        <td> {g.Arn} </td>
                                        <td> {formatDate(g.CreateDate)} </td>
                                    </tr>)
                            }
                        </tbody>
                    </table>
                </TableSection>
            </TableWrapper>
        </Wrapper>;
    }

}

function mapStateToProps(state){
    return {
        accessKeyList: state.user.accessKeyList,
        attachedPoliciesList: state.user.attachedPoliciesList,
        groupList: state.user.groupList,
    };
}

// function mapDispatchToProps(dispatch){
//     return {
//
//     }
// }

export default connect(mapStateToProps)(UserInformation);
