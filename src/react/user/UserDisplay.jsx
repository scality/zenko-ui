// @noflow

import { Button, Tabs } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import React from 'react';
import Show from '../ui-elements/Show';
import UserBuckets from './UserBuckets';
import UserInformation from './UserInformation';
import styled from 'styled-components';

const Head = styled.div`
  display: flex;

  height: 100px;
  border-radius: 5px;
  padding: 15px;
  background: repeating-radial-gradient(
    circle at 5% 5%,
    #212127,
    #212127 3px,
    #32323a 3px,
    #32323a 15px
  );
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;

  height: calc(100vh - 150px);
  margin-top: 10px;
  background-color: #1c1c20;
  border-radius: 5px;
  .sc-tabs{
      width: 100%;
  }
  .sc-tabs-item{
      min-width: 100px;
  }
`;

const Picture = styled.div`
  display: flex;
  width: 20%;
  height: 100px;
  background-color: #fff;
`;

const UserInfo = styled.div`
  display: flex;
  flex-wrap: wrap;

  height: 100px;
  width: calc(80% - 10px);
  margin-left: 20px;
  align-items: baseline;
  justify-content: space-between;

  .username{
    font-size: 25px;
  }
  .arn{
    font-size: 20px;
    margin-left: 10px;
  }
`;

class UserDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: 0,
        };
    }

    setTab(e, tab){
        if (e) {
            e.preventDefault();
        }
        this.setState({
            tab,
        });
    }

    isSelected(tab){
        return tab === this.state.tab;
    }
    render() {
        const user = this.props.displayedUser;
        return <div>
            <Head>
                <Show isShown={!!user.UserName}>
                    <Picture> </Picture>
                    <UserInfo>
                        <div className='username'> {user.UserName} </div>
                        <DeleteConfirmation delete={() => this.props.deleteUser(this.props.displayedUser.UserName)} buttonText="Delete user" titleText={`Are you sure you want to delete user: ${user.UserName} ?`}/>
                    </UserInfo>
                </Show>
            </Head>
            <Content>
                <Tabs
                    items={[
                        {
                            onClick: e => this.setTab(e, 0),
                            selected: this.isSelected(0),
                            title: 'Information',
                        },
                        {
                            onClick: e => this.setTab(e, 1),
                            selected: this.isSelected(1),
                            title: 'Buckets',
                        },
                        {
                            onClick: e => this.setTab(e, 2),
                            selected: this.isSelected(2),
                            title: 'Key Metrics',
                        },
                    ]}
                >
                    {this.state.tab === 0 && <UserInformation/>}
                    {this.state.tab === 1 && <UserBuckets/>}
                </Tabs>
            </Content>
        </div>;
    }
}

export default UserDisplay;
