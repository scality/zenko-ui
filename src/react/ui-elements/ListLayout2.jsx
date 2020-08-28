import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    background: ${props => props.theme.brand.background};
    height: calc(100vh - 48px);
`;

export const BreadcrumbContainer = styled.div`
    margin: 0px 10px;
    height: 22px;
    display: flex;
    min-height: 22px;
    padding: 4px 0px;

    .sc-breadcrumb_item {
        font-size: 15px;
    }
`;

export const Head = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    min-height: 100px;

    border-radius: 5px;
    padding: 15px;
    margin: 0px 10px;
    background-color: ${props => props.theme.brand.primary};
`;

export const HeadSlice = styled.div`
    display: flex;
    flex: 0 1 100px;
    flex-direction: column;
    justify-content: center;

    background-clor: red;
    text-align: center;
`;

export const Body = styled.div`
    display: flex;
    flex: 2;
    flex-direction: row;
    width: 100%;

    margin: 10px 0px;
`;

export const ListSection = styled.div`
    flex: 3 1 70%;
    flex-direction: column;

    background-color: ${props => props.theme.brand.primary};
    margin-left: 10px;
    padding: 10px;
    border-radius: 5px;
`;

export const ContentSection = styled.div`
    flex: 1 1 30%;
    flex-direction: column;

    background-color: ${props => props.theme.brand.primary};
    margin: 0px 10px;
    padding: 10px;
    border-radius: 5px;
`;
