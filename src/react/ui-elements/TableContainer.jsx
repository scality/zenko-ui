import styled from 'styled-components';

const TableContainer = styled.div`
    display: flex;
    margin-top: 20px;
    font-size: 15px;
    table {
        width: 100%;
        border-collapse: collapse;
    }
    td {
        border-top: 1px solid #424242;
        padding: 5px;
    }
    th {
        text-align:left;
        padding: 5px;
    }
    tr:not(:first-child):hover{
        background-color: #000;
    }
    ${({ hide }) => hide && `
        display: none;
    `}
`;

export default TableContainer;
