// @flow
import { Redirect, Route, Switch, matchPath, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { Account } from '../../types/account';
import AccountProperties from './details/properties/AccountProperties';
import type { AppState } from '../../types/state';
import { CustomTabs } from '../ui-elements/Tabs';
import Locations from './details/Locations';
import React from 'react';
import { Warning } from '../ui-elements/Warning';
import { push } from 'connected-react-router';

type Props = {
    account: ?Account,
};

const NotFound = () => <Warning iconClass='fas fa-3x fa-exclamation-triangle' title='Account not found.' />;

function AccountDetails({ account }: Props) {
    const pathname = useSelector((state: AppState) => state.router.location.pathname);
    const theme = useSelector((state: AppState) => state.uiConfig.theme);
    const dispatch = useDispatch();
    const { path, url } = useRouteMatch();

    if (!account) {
        return <NotFound/>;
    }

    return (
        <CustomTabs
            activeTabColor={ theme.brand.backgroundLevel4 }
            items={[
                {
                    onClick: () => dispatch(push(url)),
                    selected: !!matchPath(pathname, { path: `${path}`, exact: true }),
                    title: 'Properties',
                },
                {
                    onClick: () => dispatch(push(`${url}/locations`)),
                    selected: !!matchPath(pathname, { path: `${path}/locations` }),
                    title: 'Locations',
                },
            ]}
        >
            <Switch>
                <Route exact path={path}>
                    <AccountProperties account={account}/>
                </Route>
                <Route path={`${path}/locations`}>
                    <Locations/>
                </Route>
                <Redirect to={url}/>
            </Switch>
        </CustomTabs>
    );
}

export default AccountDetails;
