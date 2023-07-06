import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

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
  font-size: 1rem;

  solutions-navbar {
    img[alt='logo'] {
      height: 2.143rem;
    }

    .sc-dropdown .trigger {
      background-color: rgb(18, 18, 25);
      height: 3rem;
      font-size: 1rem;
    }
  }

  .sc-navbar {
    width: 100%;
    height: 3rem;
    border-bottom: 0.071rem solid rgb(18, 18, 25);
    color: rgb(234, 234, 234);
    a {
      color: #dfdfdf;
    }

    div[aria-selected='true'] {
      a {
        color: rgb(234, 234, 234);
      }
    }

    span > i {
      color: rgb(223, 223, 223);
    }

    .sc-trigger-text {
      color: #eaeaea;
    }
  }
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
  ContainerFooter,
  NavbarContainer,
  ZenkoUIContainer,
  ButtonContainer,
  ButtonsContainer,
};
