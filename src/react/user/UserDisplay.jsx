// @noflow

import { Button, Tabs } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import Hide from '../ui-elements/Hide';
import React from 'react';
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
  background-color: transparent;
`;

const UserInfo = styled.div`
  display: flex;
  flex-wrap: wrap;

  height: 100px;
  // width: calc(80% - 10px);
  // margin-left: 20px;
  width: 100%;
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

    setTab = (tab) => {
        this.setState({
            tab,
        });
    }

    isSelected = tab => {
        return tab === this.state.tab;
    }

    deleteDialog = () => {
        if (!this.props.showDelete) {
            return null;
        }
        return <DeleteConfirmation cancel={this.props.closeUserDeleteDialog} approve={() => this.props.deleteUser(this.props.displayedUser.UserName)} titleText={`Are you sure you want to delete user: ${this.props.displayedUser.UserName} ?`}/>;
    }

    render() {
        const user = this.props.displayedUser;
        return <div>
            {this.deleteDialog()}
            <Head>
                <Hide isHidden={!user.UserName}>
                    <UserInfo>
                        <div className='username'> {user.UserName} </div>
                        <Button outlined size="small" text='Delete user' type="submit"
                            onClick={this.props.openUserDeleteDialog} />
                    </UserInfo>
                </Hide>
            </Head>
            <Content>
                <Hide isHidden={!user.UserName}>
                    <Tabs
                        items={[
                            {
                                onClick: () => this.setTab(0),
                                selected: this.isSelected(0),
                                title: 'Information',
                            },
                            {
                                onClick: () => this.setTab(1),
                                selected: this.isSelected(1),
                                title: 'Buckets',
                            },
                            {
                                onClick: () => this.setTab(2),
                                selected: this.isSelected(2),
                                title: 'Key Metrics',
                            },
                        ]}
                    >
                        {this.state.tab === 0 && <UserInformation/>}
                        {this.state.tab === 1 && <UserBuckets/>}
                    </Tabs>
                </Hide>
            </Content>
        </div>;
    }
}

export default UserDisplay;
