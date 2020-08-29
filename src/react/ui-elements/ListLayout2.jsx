import styled from 'styled-components';



export const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    background: ${props => props.theme.brand.background};
    height: calc(100vh - 48px);
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
    flex: 1 1 20%;
    background-clor: red;
`;

export const Body = styled.div`
    display: flex;
    flex: 2;
    flex-direction: row;
    width: 100%;

    margin: 10px 0px;
`;

export const ListSection = styled.div`
    flex: 0 0 650px;
    flex-direction: column;

    background-color: ${props => props.theme.brand.primary};
    margin-left: 10px;
    padding: 10px;
    border-radius: 5px;
`;

export const ContentSection = styled.div`
    flex: 0 1 calc(100vw - 650px);
    flex-direction: column;

    background-color: ${props => props.theme.brand.primary};
    margin: 0px 10px;
    padding: 10px;
    border-radius: 5px;
`;
