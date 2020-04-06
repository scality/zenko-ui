import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex-direction: column;

    max-width: 600px;
    margin: 10px;
    padding: 20px;
    background-color: ${props => props.theme.brand.backgroundContrast1};
    border-radius: 5px;

    .button-align-right{
        display: flex;
        justify-content: flex-end;
    }
`;

export {Container};
