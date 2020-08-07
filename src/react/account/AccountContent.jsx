// @flow
import * as L from '../ui-elements/ListLayout';
import React, { useMemo } from 'react';
import { Redirect, Route, Switch, matchPath, useParams, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { CustomTabs } from '../ui-elements/Tabs';
import Keys from './details/Keys';
import Locations from './details/Locations';
import Properties from './details/Properties';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import AccountHead from './AccountHead';
import AccountDetails from './AccountDetails';

const Tabs = styled(CustomTabs)`
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .sc-tabs-item-content{
      display: flex;
      overflow-y: auto;
    }
`;

type Props = {
    account: Account,
};

function AccountContent() {
    const accountList = useSelector((state: AppState) => state.configuration.latest.users);
    const { accountName: accountNameParams } = useParams();
    const account = useMemo(() => accountList.find(a => { return a.userName === accountNameParams; }), [accountList, accountNameParams]);

    return (
        <L.ContentSection>
            <AccountHead accountList={accountList} account={account}/>
            <L.Details>
                <AccountDetails accountList={accountList} account={account}  />
            </L.Details>
        </L.ContentSection>
    );
}

export default AccountContent;
