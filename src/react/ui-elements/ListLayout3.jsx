import styled, { css } from 'styled-components';
import { padding } from '@scality/core-ui/dist/style/theme';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    background: ${props => props.theme.brand.backgroundLevel1};
    flex: 1;
`;

export const BreadcrumbContainer = styled.div`
    margin: 0px ${padding.small};
    height: 22px;
    display: flex;
    min-height: 22px;
    padding: ${padding.smaller} 0px;
    background-color: ${props => props.theme.brand.backgroundLevel1};

    .sc-breadcrumb_item {
        font-size: ${padding.base};
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
    margin-left: 1px;
    padding-bottom: ${padding.base};
    padding-top: ${padding.base};
`;

export const ContentSection = styled.div`
    display: flex;
    flex: 0 0 50%;
    flex-direction: column;

    background-color: ${props => props.theme.brand.backgroundLevel4};
    margin: 0px 1px;
`;

export const CreationSection = styled.div`
    flex: 1;
    padding: ${padding.larger} 40px;
    background-color: ${props => props.theme.brand.backgroundLevel4};
`;
