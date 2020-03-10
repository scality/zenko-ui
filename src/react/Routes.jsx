import { Link, Route } from 'react-router-dom';
import Groups from './group/Groups';
import { Navbar } from '@scality/core-ui';
import React from 'react';
import Users from './user/Users';
import { connect } from 'react-redux';
import styled from 'styled-components';

const Layout = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: scroll;
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
                    ]}
                />
            </NavbarContainer>
            <Route path="/users" component={Users} />
            <Route path="/groups" component={Groups} />
        </Layout>;
    }
}

function mapStateToProps(state) {
    return {
        location: state.router.location,
    };
}

export default connect(mapStateToProps)(Routes);
