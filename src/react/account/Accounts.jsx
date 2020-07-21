import * as L from '../ui-elements/ListLayout';
import AccountDetails from './AccountDetails';
import AccountHead from './AccountHead';
import AccountList from './AccountList';
import React from 'react';

const Accounts = () => {
    return (
        <L.Container>
            <L.ListSection>
                <AccountList/>
            </L.ListSection>
            <L.ContentSection>
                <AccountHead/>
                <L.Details>
                    <AccountDetails/>
                </L.Details>
            </L.ContentSection>
        </L.Container>
    );
};

export default Accounts;
