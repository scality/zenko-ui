import { Link, Route } from 'react-router-dom';
import AccountCreate from './account/AccountCreate';
import BucketCreate from './databrowser/BucketCreate';
import DataBrowser from './databrowser/DataBrowser';
import Groups from './group/Groups';
import LocationEditor from './monitor/location/LocationEditor';
import { Navbar } from '@scality/core-ui';
import React from 'react';
import ReplicationCreate from './workflow/replication/ReplicationCreate';
import StorageMonitor from './monitor/StorageMonitor';
import UserCreate from './user/UserCreate';
import Users from './user/Users';
import Workflows from './workflow/Workflows';
import { connect } from 'react-redux';
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

class Routes extends React.Component{
    render() {
        const { location, userName } = this.props;
        return <div>
            <NavbarContainer>
                <Navbar
                    rightActions={[
                        {
                            text: `logout ${userName}`,
                            icon: <i className='fas fa-user' />,
                            type: 'button',
                            onClick: () => this.props.dispatch(signout()),
                        },
                    ]}
                    tabs={[
                        {
                            link: <Link to="/">Storage Monitoring</Link>,
                            selected: isSelected(location, '/system'),
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
                            link: <Link to="/databrowser">Data Browser</Link>,
                            selected: isSelected(location, '/databrowser'),
                        },
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

            <Route exact path="/accounts/create" component={AccountCreate} />

            <Route exact path="/users" component={Users} />
            <Route path="/users/create" component={UserCreate} />

            <Route path="/groups" component={Groups} />

            <Route exact path="/databrowser" component={DataBrowser} />
            <Route path="/databrowser/create" component={BucketCreate} />

            <Route exact path="/workflow" component={Workflows} />
            <Route path="/workflow/replication/create" component={ReplicationCreate} />

        </div>;
    }
}

function mapStateToProps(state) {
    return {
        location: state.router.location,
        userName: state.oidc.user.profile.name || '',
    };
}

export default connect(mapStateToProps)(Routes);
