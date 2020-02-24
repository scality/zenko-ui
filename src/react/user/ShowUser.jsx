import React from 'react';
import styled from 'styled-components';

const Head = styled.div`
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

class ShowUser extends React.Component {
    render() {
        return (<Head>
            <div> Nicolas Humbert </div>
        </Head>);
    }
}

export default ShowUser;
