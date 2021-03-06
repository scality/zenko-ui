import { fontSize, padding } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

export const Hints = styled.div`
  position: absolute;
  z-index: 1;
  background-color: ${props => props.theme.brand.backgroundLevel1};
  left: 20px;
  margin-top: 40px;
  padding: ${padding.small};
`;

export const HintsTitle = styled.div`
  font-style: italic;
  padding: 2px 0px ${padding.smaller} ${padding.smaller};
  color: ${props => props.theme.brand.textSecondary};
`;

export const Hint = styled.div`
  padding: ${padding.smaller};
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.brand.secondaryDark1};
  }
`;

// make my own import due to some imput event target undefined issue
const Input = styled.input`
    display: flex;

    background-color: ${props => props.theme.brand.backgroundLevel1};
    color: ${props => props.theme.brand.textPrimary};
    border-width: 1px;
    border-style: solid;
    border-color: ${props => props.hasError ? props.theme.brand.danger : props.theme.brand.border};
    padding: 0px ${padding.small};
    font-size: ${fontSize.base};
    border-radius: 4px;
    line-height: 36px;

    width: -moz-available;          /* WebKit-based browsers will ignore this. */
    width: -webkit-fill-available;  /* Mozilla-based browsers will ignore this. */
    width: fill-available;

    :hover:enabled {
        border: 1px solid ${props => props.theme.brand.border};
    }

    :focus {
        outline:none;
        border: 1px solid ${props => props.theme.brand.secondary};
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
