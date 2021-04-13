import { fontSize, padding } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    background: ${props => props.theme.brand.backgroundLevel1};
    flex: 1;
`;

export const BreadcrumbContainer = styled.div`
    margin: 0px ${padding.small};
    height: ${padding.larger};
    display: flex;
    min-height: ${padding.larger};
    padding: ${padding.smaller} 0px;

    .sc-breadcrumb_item {
        font-size: ${fontSize.large};
    }
`;

export const ContentContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin: 0px ${padding.small} ${padding.small} ${padding.small};
`;

export const Head = styled.div`
    display: flex;
    min-height: 80px;

    padding: ${padding.base};
    padding-left: 32px;
    background-color: ${props => props.theme.brand.backgroundLevel3};
`;

export const HeadContainer = styled.div`
    display: flex;
    align-items: center;
`;

export const HeadTitleContainer = styled.div`
    display: flex;
    margin-top: ${padding.base};
`;

export const HeadTitle = styled.div`
    display: flex;
    color: ${props => props.theme.brand.textSecondary};
    font-size: ${fontSize.large};
    margin-right: ${padding.small};
    align-items: center;
`;

export const HeadSlice = styled.div`
    display: flex;
    justify-content: center;
    align-self: center;

    text-align: center;
    margin-right: ${padding.large};
`;

export const HeadBody = styled.div`
`;

export const HeadIcon = styled.i`
    display: flex;
    color: ${props => props.theme.brand.statusHealthy};
    background-color: ${props => props.theme.brand.backgroundLevel1};
    border-radius: 100%;
    border: 1px solid ${props => props.theme.brand.infoPrimary};
    width: 80px;
    height: 80px;
    text-align: center;
    line-height: 80px;
    vertical-align: middle;
    margin-right: ${padding.base};
    font-size: 32px;
    align-items: center;
    justify-content: center;
`;

export const Body = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    width: 100%;

    margin-top: 2px;
    overflow-y: auto;
`;

export const ListSection = styled.div`
    display: flex;
    flex: 1 1 65%;
    flex-direction: column;
    min-width: 650px;

    background-color: ${props => props.theme.brand.backgroundLevel2};
    padding-top: ${padding.base};
    padding-bottom: ${padding.base};
`;

export const ContentSection = styled.div`
    flex: 0 0 35%;
    min-width: 400px;
    flex-direction: column;

    background-color: ${props => props.theme.brand.backgroundLevel3};
    margin-left: 1px;
`;
