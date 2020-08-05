// @flow

import * as L from '../ui-elements/ListLayout';
import React, { useMemo } from 'react';
import AccountDetails from './AccountDetails';
import AccountHead from './AccountHead';
import type { AppState } from '../../types/state';
import { useParams } from 'react-router-dom';
import {  useSelector } from 'react-redux';

export const EmptyState = () => (
    <L.ContentSection>
        <L.Head/>
        <L.Details/>
    </L.ContentSection>
);

function AccountContent() {
    const accountList = useSelector((state: AppState) => state.configuration.latest.users);
    const { accountName: accountNameParam } = useParams();
    const account = useMemo(() => accountList.find(a => a.userName === accountNameParam), [accountList, accountNameParam]);

    // while loading/redirecting to the first account.
    if (!accountNameParam && accountList.length > 0) {
        // TODO: add a loader.
        return <L.ContentSection> </L.ContentSection>;
    }

    // empty state.
    if (accountList.length === 0) {
        return <EmptyState />;
    }
    return (
        <L.ContentSection>
            <L.Head>
                <AccountHead account={account}/>
            </L.Head>
            <L.Details>
                <AccountDetails account={account}  />
            </L.Details>
        </L.ContentSection>
    );
}

export default AccountContent;
