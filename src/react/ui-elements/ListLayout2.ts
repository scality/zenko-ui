import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: ${(props) => props.theme.brand.backgroundLevel1};
  flex: 1;
  height: 100%;
  overflow: auto;
`;
export const BreadcrumbContainer = styled.div`
  height: ${spacing.sp24};
  display: flex;
  min-height: ${spacing.sp24};
  justify-content: space-between;

  .sc-breadcrumb_item {
    font-size: ${fontSize.large};
  }
`;
export const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;
export const Head = styled.div`
  display: flex;
`;
export const HeadContainer = styled.div`
  display: flex;
  align-items: center;
`;
export const HeadTitleContainer = styled.div`
  display: flex;
  margin-top: ${spacing.sp16};
`;
export const HeadTitle = styled.div`
  display: flex;
  color: ${(props) => props.theme.brand.textSecondary};
  font-size: ${fontSize.large};
  margin-right: ${spacing.sp8};
  align-items: center;
`;
export const HeadSlice = styled.div`
  display: flex;
  justify-content: center;
  align-self: center;
  text-align: center;
`;
export const HeadBody = styled.div``;
export const HeadIcon = styled.i`
  display: flex;
  color: ${(props) => props.theme.brand.infoPrimary};
  background-color: ${(props) => props.theme.brand.backgroundLevel1};
  border-radius: 100%;
  border: ${spacing.sp1} solid ${(props) => props.theme.brand.infoPrimary};
  width: 80px;
  height: 80px;
  text-align: center;
  line-height: 80px;
  vertical-align: middle;
  margin-right: ${spacing.sp16};
  font-size: 32px;
  align-items: center;
  justify-content: center;
`;
export const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  width: 100%;

  margin-top: ${spacing.sp2};
  overflow-y: auto;
`;
export const ListSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  background-color: ${(props) => props.theme.brand.backgroundLevel2};
  padding-top: ${spacing.sp16};
`;
export const ContentSection = styled.div`
  flex: 1;
  flex-direction: column;

  background-color: ${(props) => props.theme.brand.backgroundLevel3};
  overflow: hidden;
`;
