// @noflow

import Table, * as T from '../../ui-elements/TableKeyValue';
import type { Account } from '../../../types/account';
import { Clipboard } from '../../ui-elements/Clipboard';
import React from 'react';
import { formatDate } from '../../utils';

type Props = {
    account: Account,
};

function Properties({ account }: Props) {
    return (
        <div>
            <Table id='account-details-table'>
                <T.Body>
                    <T.Row>
                        <T.Key> Account ID </T.Key>
                        <T.Value> {account.id} </T.Value>
                        <T.ExtraCell> <Clipboard text={account.id}/> </T.ExtraCell>
                    </T.Row>
                    <T.Row>
                        <T.Key> Name </T.Key>
                        <T.Value> {account.userName} </T.Value>
                        <T.ExtraCell> <Clipboard text={account.userName}/> </T.ExtraCell>
                    </T.Row>
                    <T.Row>
                        <T.Key> Creation Date </T.Key>
                        <T.Value> {formatDate(new Date(account.createDate))} </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key> Quota (GB) </T.Key>
                        <T.Value> {account.quotaMax || 'N/A'} </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key> Root User Email </T.Key>
                        <T.Value> {account.email} </T.Value>
                        <T.ExtraCell> <Clipboard text={account.email}/> </T.ExtraCell>
                    </T.Row>
                    <T.Row>
                        <T.Key> Root User ARN </T.Key>
                        <T.Value> {account.arn} </T.Value>
                        <T.ExtraCell> <Clipboard text={account.arn}/> </T.ExtraCell>
                    </T.Row>
                </T.Body>
            </Table>
        </div>
    );
}

export default Properties;
