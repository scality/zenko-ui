// @flow
import type { AppState } from '../../types/state';
import { CustomTabs } from '../ui-elements/Tabs';
import Properties from './details/Properties';
import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

const Tabs = styled(CustomTabs)`
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .sc-tabs-item-content{
      display: flex;
      overflow-y: auto;
    }
`;

function AccountDetails() {
    const account = useSelector((state: AppState) => state.account.display);

    if (!account.id) {
        return null;
    }

    return (
        <Tabs
            items={[
                {
                    onClick: function noRefCheck(){},
                    selected: true,
                    title: 'Properties',
                },
                {
                    onClick: function noRefCheck(){},
                    selected: false,
                    title: 'Keys',
                },
            ]}
        >
            <Properties/>
        </Tabs>
    );
}
// USE https://reactrouter.com/web/example/nesting

export default AccountDetails;
