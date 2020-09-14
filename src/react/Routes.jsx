// @flow

import { Link, Route, matchPath } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AccountCreate from './account/AccountCreate';
import Accounts from './account/Accounts';
import type { Action } from '../types/actions';
import type { AppState } from '../types/state';
import DataBrowser from './databrowser/DataBrowser';
import type { DispatchAPI } from 'redux';
import Groups from './group/Groups';
import LocationEditor from './backend/location/LocationEditor';
import { Navbar } from '@scality/core-ui';
import React from 'react';
import ReplicationCreate from './workflow/replication/ReplicationCreate';
import StorageMonitor from './backend/StorageMonitor';
import UserCreate from './user/UserCreate';
import Users from './user/Users';
import Workflows from './workflow/Workflows';
import { signout } from './actions';
import styled from 'styled-components';

const NavbarContainer = styled.div`
  display: flex;
  width: 100%;
  .sc-navbar{
      width: 100%;
  }
`;

function Routes() {
    const pathname = useSelector((state: AppState) => state.router.location.pathname);
    const userName = useSelector((state: AppState) => state.oidc.user.profile.name || '');

    const dispatch: DispatchAPI<Action> = useDispatch();
    return (
        <div>
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
                            link: <Link to="/">Storage Monitoring</Link>,
                            selected: !!matchPath(pathname, { path: '/', exact: true }),
                        },
                        {
                            link: <Link to="/accounts">Accounts</Link>,
                            selected: !!matchPath(pathname, { path: '/accounts/:accountName?' }),
                        },
                        // {
                        //     link: <Link to="/groups">Groups</Link>,
                        //     selected: isSelected(location, '/groups'),
                        // },
                        // {
                        //     link: <Link to="/users">Users</Link>,
                        //     selected: isSelected(location, '/users'),
                        // },
                        {
                            link: <Link to="/buckets">Data Browser</Link>,
                            selected: !!matchPath(pathname, { path: '/buckets' }),
                        },
                        // {
                        //     link: <Link to="/workflow">Data Workflow</Link>,
                        //     selected: isSelected(location, '/workflow'),
                        // },
                    ]}
                />
            </NavbarContainer>

            <Route exact path="/" component={StorageMonitor} />

            <Route exact path="/create-location" component={LocationEditor} />
            <Route path="/locations/:locationName/edit" component={LocationEditor} />

            <Route path='/accounts/:accountName?' component={Accounts} />
            <Route path="/create-account" component={AccountCreate} />

            <Route exact path="/users" component={Users} />
            <Route path="/users/create" component={UserCreate} />

            <Route path="/groups" component={Groups} />

            <Route path={['/buckets/:bucketName?', '/create-bucket']} component={DataBrowser} />

            <Route exact path="/workflow" component={Workflows} />
            <Route path="/workflow/replication/create" component={ReplicationCreate} />
        </div>
    );
}

export default Routes;
