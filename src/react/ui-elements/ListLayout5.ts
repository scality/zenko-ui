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
  display: flex;

  .sc-breadcrumb_item {
    font-size: ${fontSize.large};
  }
`;
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;
export const Content = styled.div`
  flex: 1;
  height: 100%;
  background-color: ${(props) => props.theme.brand.backgroundLevel3};
`;
