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
    flex-direction: row;
    justify-content: space-between;
    min-height: 80px;

    padding: ${padding.base};
    background-color: ${props => props.theme.brand.backgroundLevel3};
`;

export const HeadSlice = styled.div`
    display: flex;
    flex: 0 1 100px;
    flex-direction: column;
    justify-content: center;
    text-align: center;
`;

export const Body = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    width: 100%;

    margin-top: ${padding.smaller};
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
