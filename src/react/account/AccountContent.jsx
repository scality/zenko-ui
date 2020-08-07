// @flow
import * as L from '../ui-elements/ListLayout';
import React, { useMemo } from 'react';
import AccountDetails from './AccountDetails';
import AccountHead from './AccountHead';
import type { AppState } from '../../types/state';
import { Warning } from '../ui-elements/Warning';
import { useParams } from 'react-router-dom';
import {  useSelector } from 'react-redux';

const NotFound = () => <Warning iconClass='fas fa-3x fa-exclamation-triangle' title='Account not found.' />;

function AccountContent() {
    const accountList = useSelector((state: AppState) => state.configuration.latest.users);
    const { accountName: accountNameParams } = useParams();
    const account = useMemo(() => accountList.find(a => { return a.userName === accountNameParams; }), [accountList, accountNameParams]);
    // const account = {};
    // empty state
    if (!account) {
        return <L.ContentSection>
            <L.Head> </L.Head>
            <L.Details> { accountList.length > 0 && <NotFound/>} </L.Details>
        </L.ContentSection>;
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
