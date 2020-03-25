import styled from 'styled-components';

// make my own import due to some imput event target undefined issue
const Input = styled.input`
    display: flex

    background-color: #161617;
    color: #ffffff;
    border: 1px solid #ffffff;
    padding: 8px 10px;
    font-size: 14px;
    display: block;
    border-radius: 4px;

    width: -moz-available;          /* WebKit-based browsers will ignore this. */
    width: -webkit-fill-available;  /* Mozilla-based browsers will ignore this. */
    width: fill-available;

    :focus {
        outline:none;
    }
`;

export default Input;
