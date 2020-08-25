import { Tabs } from '@scality/core-ui';
import styled from 'styled-components';

export const CustomTabs = styled(Tabs)`
    margin: 0px;
    .sc-tabs-item{
        min-width: 190px;
    }
    .sc-tabs-item-title{
        border-radius: 5px 5px 0px 0px;
    }
    .sc-tabs-item-content{
        height: 100%;
        border-radius: 5px;
    }
    .sc-tabs-bar{
        min-height: 50px;
    }
`;
