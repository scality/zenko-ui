// @flow
import { Link, Redirect, Route, Switch, matchPath } from 'react-router-dom';
import { NavbarContainer, RouteContainer } from './ui-elements/Container';
import { useDispatch, useSelector } from 'react-redux';
import AccountCreate from './account/AccountCreate';
import Accounts from './account/Accounts';
import type { Action } from '../types/actions';
import type { AppState } from '../types/state';
import DataBrowser from './databrowser/DataBrowser';
import type { DispatchAPI } from 'redux';
import LocationEditor from './backend/location/LocationEditor';
import { Navbar } from '@scality/core-ui';
import NoMatch from './NoMatch';
import React from 'react';
import { signout } from './actions';

function Routes() {
    const pathname = useSelector((state: AppState) => state.router.location.pathname);
    const userName = useSelector((state: AppState) => state.oidc.user.profile.name || '');

    const dispatch: DispatchAPI<Action> = useDispatch();
    return (
        <RouteContainer>
            <NavbarContainer>
                <Navbar
                    rightActions={[
                        {
                            icon: <i className="fas fa-user"/>,
                            text: `${userName}`,
                            type: 'dropdown',
                            items: [{ label: 'Log out', onClick: () => dispatch(signout()) } ],
                        }]
                    }
                    tabs={[
                        {
                            link: <Link to="/accounts">Accounts</Link>,
                            selected: !!matchPath(pathname, { path: '/accounts/:accountName?' }) ||
                                      !!matchPath(pathname, { path: '/create-account' }),
                        },
                        {
                            link: <Link to="/buckets">Data Browser</Link>,
                            selected: !!matchPath(pathname, { path: '/buckets' }) ||
                                      !!matchPath(pathname, { path: '/create-bucket' }),
                        },
                    ]}
                />
            </NavbarContainer>
            <Switch>
                <Route exact path="/" render={() => <Redirect to="/accounts" />}/>

                <Route exact path="/create-location" component={LocationEditor} />
                <Route path="/locations/:locationName/edit" component={LocationEditor} />

                <Route path='/accounts/:accountName?' component={Accounts} />
                <Route path="/create-account" component={AccountCreate} />

                <Route path={['/buckets/:bucketName?', '/buckets/:bucketName/objects', '/create-bucket']} component={DataBrowser} />
                <Route path="*" component={NoMatch}/>
            </Switch>
        </RouteContainer>
    );
}

export default Routes;
