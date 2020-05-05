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
import styled from 'styled-components';

const Layout = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: scroll;

  color: #fff;
  background-color: ${props => props.theme.brand.background};
  flex-direction:column;
`;

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
        const location = this.props.location;
        return <Layout>
            <NavbarContainer>
                <Navbar
                    rightActions={[
                        {
                            type: 'dropdown',
                            text: 'Nicolas2bert',
                            icon: <i className='fas fa-user' />,
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

            <Route exact path="/accounts/create" component={AccountCreate} />

            <Route exact path="/users" component={Users} />
            <Route path="/users/create" component={UserCreate} />

            <Route path="/groups" component={Groups} />

            <Route exact path="/databrowser" component={DataBrowser} />
            <Route path="/databrowser/create" component={BucketCreate} />

            <Route exact path="/workflow" component={Workflows} />
            <Route path="/workflow/replication/create" component={ReplicationCreate} />

        </Layout>;
    }
}

function mapStateToProps(state) {
    return {
        location: state.router.location,
    };
}

export default connect(mapStateToProps)(Routes);
