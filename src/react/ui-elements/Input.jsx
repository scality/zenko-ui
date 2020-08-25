import styled from 'styled-components';


// make my own import due to some imput event target undefined issue
const Input = styled.input`
    display: flex

    background-color: transparent;
    color: ${props => props.theme.brand.textPrimary};
    border-width: 1px;
    border-style: solid;
    border-color: ${props => props.hasError ? props.theme.brand.danger : '#ffffff'};
    padding: 0px 10px;
    font-size: 14px;
    border-radius: 4px;
    line-height: 36px;

    width: -moz-available;          /* WebKit-based browsers will ignore this. */
    width: -webkit-fill-available;  /* Mozilla-based browsers will ignore this. */
    width: fill-available;

    :focus {
        outline:none;
    }

    // Removing input background color for Chrome autocomplete
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
       -webkit-transition: "color 9999s ease-out, background-color 9999s ease-out";
       -webkit-transition-delay: 9999s;
    }
`;

export default Input;
