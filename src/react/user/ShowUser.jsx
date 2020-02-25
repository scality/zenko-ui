// @noflow

import React from 'react';
import styled from 'styled-components';

const Head = styled.div`
  display: flex;
  flex: 1 0 100%;
  border-radius: 5px;
  padding: 15px;
  flow-direction: row;
  background: repeating-radial-gradient(
    circle at 5% 5%,
    #212127,
    #212127 3px,
    #32323a 3px,
    #32323a 15px
  );
`;

const Picture = styled.div`
  display: flex;
  width: 20%;
  height: 100px;
  background-color: #fff;
`;

const UserInfo = styled.div`
  display: flex;
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
`;

class ShowUser extends React.Component {
    render() {
        const user = this.props.userShown;
        return <Head>
            <Picture> </Picture>
            <UserInfo>
                <div className='username'> {user.UserName} </div>
                <div className='arn'> {user.Arn} </div>

            </UserInfo>
        </Head>;
    }
}

export default ShowUser;
