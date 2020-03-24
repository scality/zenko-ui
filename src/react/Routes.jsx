import { Link, Route } from 'react-router-dom';
import DataBrowser from './databrowser/DataBrowser';
import Groups from './group/Groups';
import LocationCreate from './monitor/location/LocationCreate';
import { Navbar } from '@scality/core-ui';
import React from 'react';
import ReplicationCreate from './workflow/replication/ReplicationCreate';
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
  background-color: #0c0c0d;
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
                            link: <Link to="/groups">Groups</Link>,
                            selected: isSelected(location, '/groups'),
                        },
                        {
                            link: <Link to="/users">Users</Link>,
                            selected: isSelected(location, '/users'),
                        },
                        {
                            link: <Link to="/databrowser">Data Browser</Link>,
                            selected: isSelected(location, '/databrowser'),
                        },
                        {
                            link: <Link to="/workflow">Data Workflow</Link>,
                            selected: isSelected(location, '/workflow'),
                        },
                    ]}
                />
            </NavbarContainer>
            <Route exact path="/users" component={Users} />
            <Route path="/users/create" component={UserCreate} />
            <Route path="/groups" component={Groups} />
            <Route path="/databrowser" component={DataBrowser} />
            <Route exact path="/workflow" component={Workflows} />
            <Route path="/workflow/replication/create" component={ReplicationCreate} />
            <Route path="/location/create" component={LocationCreate} />
        </Layout>;
    }
}

function mapStateToProps(state) {
    return {
        location: state.router.location,
    };
}

export default connect(mapStateToProps)(Routes);
