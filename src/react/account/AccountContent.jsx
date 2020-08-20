// @flow

import * as L from '../ui-elements/ListLayout';
import type { Account } from '../../types/account';
import AccountDetails from './AccountDetails';
import AccountHead from './AccountHead';
import React from 'react';

type Props = {
    account: ?Account,
};
function AccountContent({ account }: Props) {
    return (
        <L.ContentSection>
            <L.Head>
                <AccountHead account={account}/>
            </L.Head>
            <L.Details>
                <AccountDetails account={account} />
            </L.Details>
        </L.ContentSection>
    );
}

export default AccountContent;
