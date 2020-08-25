import { Tabs } from '@scality/core-ui';
import styled from 'styled-components';

export const CustomTabs = styled(Tabs)`
    margin: 0px;
    .sc-tabs-item{
        min-width: 190px;
    }
    .sc-tabs-bar{
        min-height: 50px;
    }
    .sc-tabs-item-content{
        background-color: ${props => props.theme.brand.primary};
    }
`;
