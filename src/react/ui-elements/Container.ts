import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
const MainContainer = styled.div`
  color: ${(props) => props.theme.brand.textPrimary};
  font-size: ${fontSize.base};
`;
const Container = styled.div`
  display: flex;
  flex-direction: column;

  max-width: 600px;
  margin: ${spacing.sp8};
  padding: ${spacing.sp20};
  background-color: ${(props) => props.theme.brand.backgroundLevel1};
`;
const ContainerFooter = styled.div`
  display: flex;
  justify-content: flex-end;

  margin-top: ${spacing.sp8};
`;
const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;
export const EmptyStateContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  background: ${(props) => props.theme.brand.backgroundLevel1};
`;
const NavbarContainer = styled.div`
  display: flex;
  width: 100%;
  .sc-navbar {
    width: 100%;
  }
`;
const RouteContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: stretch;
`;
const ZenkoUIContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: stretch;
`;
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;
const ButtonsContainer = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;
export {
  Container,
  LoaderContainer,
  MainContainer,
  ContainerFooter,
  NavbarContainer,
  RouteContainer,
  ZenkoUIContainer,
  ButtonContainer,
  ButtonsContainer,
};
