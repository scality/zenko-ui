// @flow
import type { Account } from '../../../../types/account';
import AccountInfo from './AccountInfo';
import AccountKeys from './AccountKeys';
import { AutoSizer } from 'react-virtualized';
import React from 'react';
import styled from 'styled-components';

type Props = {
    account: Account,
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: ${props => props.height}px;
    width: ${props => props.width}px;
`;

function AccountProperties({ account }: Props) {
    return (
        <AutoSizer>
            {({ height, width }) => (
                <Container height={height} width={width}>
                    <AccountInfo account={ account }/>
                    <AccountKeys account={ account }/>
                </Container>
            )}
        </AutoSizer>
    );
}

export default AccountProperties;
