// @noflow

import { Button, Chips } from '@scality/core-ui';
import { closeKeyDeleteDialog, closeSecretDialog, createAccessKey, deleteAccessKey, deleteSecret, openKeyDeleteDialog, openSecretDialog } from '../actions';
import AccessKey from './AccessKey';
import React from 'react';
import { TableContainer } from '../ui-elements/Table';
import type { User } from '../../types/user';
import { connect } from 'react-redux';
import {formatDate} from '../utils';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;

  padding: 15px;
`;

const TableWrapper = styled.div`
    margin-bottom: 20px;
    min-height: 130px;
`;

const Title = styled.div`
  display: flex;
  align-items: baseline;
  width: 100%;
  justify-content: space-between;
`;

const TdActions = styled.td`
  display: flex;
  justify-content: flex-end;
  button {
      margin-left:5px;
  }
`;

type DispatchProps = {
    listUsers: () => void,
    createAccessKey: (userName: string) => void,
    deleteAccessKey: (accessKey: string, userName: string) => void,
};

type StateProps = {
    userList: Array<User>,
    displayedUser: User,
    accessKeyList: Array<>,
    attachedPoliciesList: Array<>,
    groupList: Array<>,
    secretKeys: { [string]: string },
};

type Props = StateProps & DispatchProps;

class UserInformation extends React.Component<Props>{

    createKey = () => {
        this.props.createAccessKey(this.props.displayedUser.UserName);
    }

    render() {
        if (!this.props.displayedUser.UserName) {
            return null;
        }
        return <Wrapper>
            <TableWrapper>
                <Title>
                    <div>
                        User Keys ({this.props.accessKeyList.length})
                    </div>
                    <Button outlined size="small" text="Create Key" onClick={this.createKey}/>
                </Title>
                <TableContainer hide={this.props.accessKeyList.length === 0}>
                    <table>
                        <tbody>
                            <tr>
                                <th> Status </th>
                                <th> Access Key </th>
                                <th> Create On</th>
                                <th> </th>
                            </tr>
                            {
                                this.props.accessKeyList.map(a =>
                                    <tr key={a.AccessKeyId}>
                                        <td> <Chips
                                            text={a.Status}
                                            variant={a.Status === 'Active' ? 'success' : 'danger' }/>
                                        </td>
                                        <td> {a.AccessKeyId} </td>
                                        <td> {formatDate(a.CreateDate)} </td>
                                        <TdActions>
                                            <AccessKey
                                                keys={a}
                                                secretKey={this.props.secrets.get(a.AccessKeyId)}
                                                deleteSecret={this.props.deleteSecret}
                                                openSecretDialog={this.props.openSecretDialog}
                                                closeSecretDialog={this.props.closeSecretDialog}
                                                secretShown={a.AccessKeyId === this.props.showSecret}

                                                deleteAccessKey={this.props.deleteAccessKey}
                                                openKeyDeleteDialog={this.props.openKeyDeleteDialog}
                                                closeKeyDeleteDialog={this.props.closeKeyDeleteDialog}
                                                deleteShown={a.AccessKeyId === this.props.showDeleteKey}
                                            />
                                        </TdActions>
                                    </tr>)
                            }
                        </tbody>
                    </table>
                </TableContainer>
            </TableWrapper>
            <TableWrapper>
                <Title> User Policies ({this.props.attachedPoliciesList.length})</Title>
                <TableContainer hide={this.props.attachedPoliciesList.length === 0}>
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
                </TableContainer>
            </TableWrapper>
            <TableWrapper>
                <Title> Linked Groups ({this.props.groupList.length})</Title>
                <TableContainer hide={this.props.groupList.length === 0}>
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
                </TableContainer>
            </TableWrapper>
        </Wrapper>;
    }

}

function mapStateToProps(state){
    return {
        displayedUser: state.user.displayedUser,
        accessKeyList: state.user.accessKeyList,
        attachedPoliciesList: state.user.attachedPoliciesList,
        groupList: state.user.groupList,
        secrets: state.secrets,
        showSecret: state.uiUser.showSecret,
        showDeleteKey: state.uiUser.showDeleteKey,
    };
}

function mapDispatchToProps(dispatch){
    return {
        createAccessKey: userName => dispatch(createAccessKey(userName)),
        deleteAccessKey: (accessKey, userName) => dispatch(deleteAccessKey(accessKey, userName)),
        deleteSecret: accessKey => dispatch(deleteSecret(accessKey)),
        openSecretDialog: keyName => dispatch(openSecretDialog(keyName)),
        closeSecretDialog: () => dispatch(closeSecretDialog()),
        openKeyDeleteDialog: accessKey => dispatch(openKeyDeleteDialog(accessKey)),
        closeKeyDeleteDialog: () => dispatch(closeKeyDeleteDialog()),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserInformation);
