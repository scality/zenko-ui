import styled from 'styled-components';

const TableSection = styled.div`
    display: flex;
    margin-top: 20px;
    font-size: 15px;
    table {
        border-collapse: collapse;
    }
    td {
        border-top: 1px solid #424242;
        padding: 5px;
    }
    tr:hover{
        background-color: grey;
    }
    ${({ hide }) => hide && `
        display: none;
    `}
`;

export default TableSection;
