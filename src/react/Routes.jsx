// @flow

import { Link, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AccountCreate from './account/AccountCreate';
import Accounts from './account/Accounts';
import type { Action } from '../types/actions';
import type { AppState } from '../types/state';
import BucketCreate from './databrowser/BucketCreate';
import DataBrowser from './databrowser/DataBrowser';
import type { DispatchAPI } from 'redux';
import Groups from './group/Groups';
import LocationEditor from './monitor/location/LocationEditor';
import { Navbar } from '@scality/core-ui';
import React from 'react';
import ReplicationCreate from './workflow/replication/ReplicationCreate';
import StorageMonitor from './monitor/StorageMonitor';
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

function isSelected(location, tabName){
    return location.pathname === tabName;
}

function Routes() {
    const location = useSelector((state: AppState) => state.router.location);
    const userName = useSelector((state: AppState) => state.oidc.user.profile.name || '');

    const dispatch: DispatchAPI<Action> = useDispatch();
    return (
        <div>
            <NavbarContainer>
                <Navbar
                    rightActions={[
                        {
                            text: `logout ${userName}`,
                            icon: <i className='fas fa-user' />,
                            type: 'button',
                            onClick: () => dispatch(signout()),
                        },
                    ]}
                    tabs={[
                        {
                            link: <Link to="/">Storage Monitoring</Link>,
                            selected: isSelected(location, '/'),
                        },
                        {
                            link: <Link to="/accounts">Accounts</Link>,
                            selected: isSelected(location, '/accounts'),
                        },
                        // {
                        //     link: <Link to="/groups">Groups</Link>,
                        //     selected: isSelected(location, '/groups'),
                        // },
                        // {
                        //     link: <Link to="/users">Users</Link>,
                        //     selected: isSelected(location, '/users'),
                        // },
                        // {
                        //     link: <Link to="/databrowser">Data Browser</Link>,
                        //     selected: isSelected(location, '/databrowser'),
                        // },
                        // {
                        //     link: <Link to="/workflow">Data Workflow</Link>,
                        //     selected: isSelected(location, '/workflow'),
                        // },
                    ]}
                />
            </NavbarContainer>

            <Route exact path="/" component={StorageMonitor} />
            <Route exact path="/monitor/location/editor" component={LocationEditor} />
            <Route path="/monitor/location/editor/:locationName" component={LocationEditor} />

            <Route exact path='/accounts' component={Accounts} />
            <Route path="/accounts/create" component={AccountCreate} />

            <Route exact path="/users" component={Users} />
            <Route path="/users/create" component={UserCreate} />

            <Route path="/groups" component={Groups} />

            <Route exact path="/databrowser" component={DataBrowser} />
            <Route path="/databrowser/create" component={BucketCreate} />

            <Route exact path="/workflow" component={Workflows} />
            <Route path="/workflow/replication/create" component={ReplicationCreate} />

        </div>
    );
}

export default Routes;
