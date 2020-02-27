// @noflow

import { Button, Tabs } from '@scality/core-ui';
import UserInformation from './UserInformation';
import React from 'react';
import styled from 'styled-components';

const Head = styled.div`
  display: flex;

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
  flow-direction: row;
  flex-wrap: wrap;

  height: 100px;
  margin-left: 20px;
  align-items: baseline;
  .username{
    font-size: 25px;
  }
  .arn{
    font-size: 20px;
    margin-left: 10px;
  }
  .connect-as{
    margin-left: 10px;
  }
`;

class UserDisplay extends React.Component {
    render() {
        const user = this.props.displayedUser;
        return <div>
            <Head>
                <Picture> </Picture>
                <UserInfo>
                    <div className='username'> {user.UserName} </div>
                    <div className='arn'> {user.Arn} </div>
                    <Button className='connect-as' size="small" text="Connect as"> </Button>
                </UserInfo>
            </Head>
            <Content>
                <Tabs
                    items={[
                        {
                            onClick: function noRefCheck(){},
                            selected: true,
                            title: 'Information',
                        },
                        {
                            onClick: function noRefCheck(){},
                            selected: false,
                            title: 'Buckets',
                        },
                        {
                            onClick: function noRefCheck(){},
                            selected: false,
                            title: 'Key Metrics',
                        },
                    ]}
                >
                    <UserInformation/>
                </Tabs>
            </Content>
        </div>;
    }
}

export default UserDisplay;
