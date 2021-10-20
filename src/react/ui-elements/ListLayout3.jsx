import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import styled, { css } from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: ${props => props.theme.brand.backgroundLevel1};
  flex: 1;
`;

export const BreadcrumbContainer = styled.div`
  margin: 0px ${spacing.sp8};
  height: ${spacing.sp24};
  display: flex;
  min-height: ${spacing.sp24};
  padding: ${spacing.sp4} 0px;
  background-color: ${props => props.theme.brand.backgroundLevel1};

  .sc-breadcrumb_item {
    font-size: ${fontSize.large};
  }
`;

export const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  width: 100%;
`;

export const ListSection = styled.div`
    display: flex;
    flex: 1 1 50%;
    flex-direction: column;

    ${props => {
      if (props.disabled) {
        return css`
          opacity: 0.2;
          pointer-events: none;
        `;
      }
    }}
    background-color: ${props => props.theme.brand.backgroundLevel2};
    min-width: 500px;
    margin-left: ${spacing.sp1};
    padding-bottom: ${spacing.sp16};
    padding-top: ${spacing.sp16};
`;

export const ContentSection = styled.div`
  display: flex;
  flex: 0 0 50%;
  flex-direction: column;

  background-color: ${props => props.theme.brand.backgroundLevel4};
  margin: 0px ${spacing.sp1};
`;

export const CreationSection = styled.div`
  flex: 1;
  padding: ${spacing.sp24} ${spacing.sp40};
  background-color: ${props => props.theme.brand.backgroundLevel4};
`;
