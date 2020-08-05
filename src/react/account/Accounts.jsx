import * as L from '../ui-elements/ListLayout';
import AccountContent from './AccountContent';
import AccountList from './AccountList';
import React from 'react';

const Accounts = () => {
    return (
        <L.Container>
            <L.ListSection>
                <AccountList/>
            </L.ListSection>
            <AccountContent/>
        </L.Container>
    );
};

export default Accounts;
