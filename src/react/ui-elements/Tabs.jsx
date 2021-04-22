import { Tabs } from '@scality/core-ui';
import { padding } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

export const CustomTabs = styled(Tabs)`
    display: flex;
    flex: 1;
    height: 100%;
    margin: 0px;
    flex-direction: column;
    background-color: ${props => props.theme.brand.backgroundLevel3};
    .sc-tabs-item{
        background-color: ${props => props.theme.brand.backgroundLevel3};
        min-width: 115px;
    }
    .sc-tabs-item-title{
        border-radius: ${padding.small} ${padding.small} 0px 0px;
    }
    .sc-tabs-item-content{
        background-color: ${props => props.theme.brand.backgroundLevel4};
        display: flex;
        flex: 1;
        padding: ${padding.larger} 32px;
        overflow-y: auto;
        height: 0;
        min-height: 0;
    }
`;
