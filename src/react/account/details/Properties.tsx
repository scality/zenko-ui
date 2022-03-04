import type { Account } from '../../../types/account';
import AccountInfo from './properties/AccountInfo';
import AccountKeys from './properties/AccountKeys';
import { AutoSizer } from 'react-virtualized';
import React from 'react';
import styled from 'styled-components';
type Props = {
  account: Account;
};
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: ${(props) => props.height}px;
  width: ${(props) => props.width}px;
`;

function Properties({ account }: Props) {
  return (
    <AutoSizer>
      {({ height, width }) => (
        <Container height={height} width={width}>
          <AccountInfo account={account} />
          <AccountKeys account={account} />
        </Container>
      )}
    </AutoSizer>
  );
}

export default Properties;