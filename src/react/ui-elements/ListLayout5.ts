import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
// Used by Account page
// TEMPLATE
//<L.Container>
//  <div>
//    <L.BreadcrumbContainer></L.BreadcrumbContainer>
//    <EntityHeader> optional </EntityHeader>
//  </div>
//  <L.Content>
//    <L.SearchActions></L.SearchActions>
//    <L.ListOrTable></L.ListOrTable>
//  </L.Content>
//</L.Container>;
export const BreadcrumbContainer = styled.div`
  height: ${spacing.sp24};
  display: flex;
  min-height: ${spacing.sp24};
  padding: ${spacing.sp4} 0px;
  background-color: ${(props) => props.theme.brand.backgroundLevel1};

  .sc-breadcrumb_item {
    font-size: ${fontSize.large};
  }
`;
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: ${spacing.sp16};
  padding-bottom: ${spacing.sp16};
`;
export const Content = styled.div`
  flex: 1;
  height: 100%;
  margin-top: ${spacing.sp2};
  background-color: ${(props) => props.theme.brand.backgroundLevel3};
`;