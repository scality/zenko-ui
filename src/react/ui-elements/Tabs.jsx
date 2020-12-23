import { Tabs } from '@scality/core-ui';
import styled from 'styled-components';

export const CustomTabs = styled(Tabs)`
    display: flex;
    flex: 1;
    height: 100%;
    margin: 0px;
    flex-direction: column;
    .sc-tabs-item{
        min-width: 100px;
    }
    .sc-tabs-item-title{
        border-radius: 5px 5px 0px 0px;
    }
    .sc-tabs-item-content{
        display: flex;
        border-radius: 5px;
        flex: 1;
        padding: 20px
    }
`;
