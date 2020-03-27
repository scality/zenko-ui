import styled from 'styled-components';

export const TableContainer = styled.div`
    display: flex;
    margin-top: 20px;
    font-size: 15px;
    table {
        width: 100%;
        border-collapse: collapse;
    }
    td {
        border-top: 1px solid #424242;
        padding: 0.75rem;
    }
    th {
        text-align:left;
        padding: 0.75rem;
    }
    tr:not(:first-child):hover{
        background-color: #000;
    }
    ${({ hide }) => hide && `
        display: none;
    `}
`;

export const Row = styled.tr`
    cursor: pointer;
    background-color: ${props => props.selected ? '#000' : 'inherit'};
`;
