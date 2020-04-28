// @noflow
import React, { useEffect } from 'react';
import { Row, TableContainer } from '../ui-elements/Table';
import { Button } from '@scality/core-ui';
import { connect } from 'react-redux';
import {formatDate} from '../utils';
import { listAccounts } from '../actions';
import { push } from 'connected-react-router';

console.log('listAccounts!!!', listAccounts);

function AccountList(props) {
    const rowClicked = (e, accountName) => {
        if (e) {
            e.preventDefault();
        }
        // if (this.isSelected(accountName)) {
        //     return;
        // }
        // return props.getAccount(accountName);
    }

    // isSelected(accountName) {
    //     return props.displayedAccount.AccountName && props.displayedAccount.AccountName === accountName;
    // }

    useEffect(() => {
        props.listAccounts();
    },[]);


    return (
        <div>
            <Button outlined onClick={() => props.redirect('/accounts/create')} size="default" text="Add" type="submit" />
            <TableContainer>
                <table>
                    <tbody>
                        <tr>
                            <th> Account </th>
                            <th> Create time</th>
                        </tr>
                        {
                            props.accountList.map(a =>
                                <Row onClick={e => this.rowClicked(e, a.name)} key={a.name}>
                                    <td> {a.name} </td>
                                    <td> {a.createDate} </td>
                                </Row>)
                        }
                    </tbody>
                </table>
            </TableContainer>
        </div>
    );
}

function mapStateToProps(state: AppState): StateProps{
    return {
        accountList: state.account.list,
        // displayedUser: state.user.displayedUser,
    };
}

function mapDispatchToProps(dispatch): DispatchProps{
    return {
        // getAccount: (accountName: string) => dispatch(getAccount(accountName)),
        listAccounts: (maxItems, marker) => dispatch(listAccounts(maxItems, marker)),
        redirect: (path: string) => dispatch(push(path)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountList);
