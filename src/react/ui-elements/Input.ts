import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
export const Hints = styled.div`
  position: absolute;
  z-index: 1;
  background-color: ${(props) => props.theme.brand?.backgroundLevel1};
  left: 20px;
  margin-top: ${spacing.sp40};
  padding: ${spacing.sp8};
`;
export const HintsTitle = styled.div`
  font-style: italic;
  padding: ${spacing.sp2} 0px ${spacing.sp4} ${spacing.sp4};
  color: ${(props) => props.theme.brand.textSecondary};
`;
export const Hint = styled.div`
  padding: ${spacing.sp4};
  cursor: pointer;

  &:hover {
    background-color: ${(props) => props.theme.brand.secondaryDark1};
  }
`;
// make my own import due to some imput event target undefined issue
const Input = styled.input<{ hasError?: boolean }>`
  display: flex;

  background-color: ${(props) => props.theme.brand?.backgroundLevel1};
  color: ${(props) => props.theme.brand?.textPrimary};
  border-width: ${spacing.sp1};
  border-style: solid;
  border-color: ${(props) =>
    props.hasError ? props.theme.brand.danger : props.theme.brand?.border};
  padding: 0px ${spacing.sp8};
  font-size: ${fontSize.base};
  border-radius: ${spacing.sp4};
  line-height: ${spacing.sp32};
  ${(props) =>
    props.type !== 'radio' &&
    `
    width: -moz-available; /* WebKit-based browsers will ignore this. */
    width: -webkit-fill-available; /* Mozilla-based browsers will ignore this. */
    width: fill-available;  
  `}

  :focus {
    outline: none;
    border: ${spacing.sp1} solid ${(props) => props.theme.brand?.secondary};
  }
  ${(props) =>
    props.disabled &&
    `  pointer-events: auto;
cursor: not-allowed;
opacity: 0.5;
`}
  // Removing input background color for Chrome autocomplete
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-transition: 'color 9999s ease-out, background-color 9999s ease-out';
    -webkit-transition-delay: 9999s;
  }
`;
export default Input;
