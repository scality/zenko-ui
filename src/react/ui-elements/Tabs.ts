import { Tabs } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
export const CustomTabs = styled(Tabs)`
  display: flex;
  flex: 1;
  .sc-tabs-item-content {
    overflow-y: auto;
  }
`;
