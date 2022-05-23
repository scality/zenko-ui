import { Checkbox as BasicCheckbox, Tooltip } from '@scality/core-ui';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { default as BasicInput } from './Input';
import { default as BasicInputList } from './InputList';
import { Select as BasicSelect } from '@scality/core-ui/dist/next';
import styled from 'styled-components';
import {
  SmallerText,
  LargerText,
} from '@scality/core-ui/dist/components/text/Text.component';
import { HTMLAttributes, LabelHTMLAttributes } from 'react';

/* TEMPLATE:
<FormContainer>
    <F.Form>
        <F.Title> global title </F.Title>
        <F.Fieldset>
            <F.Label tooltipMessages={['text1', 'text2']> label1 </F.Label>
            <F.Input/>
            <F.ErrorInput hasError={false}> error Name </F.ErrorInput>
        </F.Fieldset>
        <F.Fieldset>
            <F.Label tooltipMessages={['text1', 'text2']}> label2 </F.Label>
            <F.Input />
            <F.ErrorInput hasError={false}> error Email </F.ErrorInput>
        </F.Fieldset>
        <F.Footer>
            <F.FooterError> <Banner> Global error </Banner> </F.FooterError>
            <F.FooterButtons> <Button/> <Button/> </F.FooterButtons>
        </F.Footer>
    </F.Form>
    <F.Form>
        // ...
    </F.Form>
</FormContainer>
*/
export const Title = styled(LargerText)`
  display: flex;
  text-transform: capitalize;
  margin-bottom: ${spacing.sp16};
`;
export const SubTitle = styled.div`
  display: flex;
  color: ${(props) => props.theme.brand.textPrimary};
  font-weight: bold;
`;
export const Fieldset = styled.fieldset`
  display: flex;
  flex-direction: ${(props) => props.direction || 'column'};
  ${(props) => (props.alignItems ? `align-items: ${props.alignItems};` : '')}
  border: 0;
  padding: 0;
  margin-top: ${spacing.sp16};
`;
export const Select = styled(BasicSelect)`
  margin: ${spacing.sp8} 0px ${spacing.sp4} 0px;
`;
export const CheckboxContainer = styled.div`
  display: block;
  margin: ${spacing.sp8} 0px ${spacing.sp4} 0px;
  align-items: baseline;

  .sc-checkbox {
    margin-right: ${spacing.sp8};
  }
`;
export const Checkbox = styled(BasicCheckbox)``;
export const Input = styled(BasicInput)`
  margin: ${spacing.sp8} 0px ${spacing.sp4} 0px;
`;
export const InputList = styled(BasicInputList)`
  margin: ${spacing.sp8} 0px ${spacing.sp4} 0px;
`;
export const SessionSeperation = styled.div`
  width: 23px;
  height: 1px;
  margin: ${spacing.sp16} 0px ${spacing.sp16} 0px;
  background-color: ${(props) => props.theme.brand.buttonSecondary};
`;
export const LabelSecondary = styled(SmallerText)`
  color: ${(props) => props.theme.brand.textSecondary};
`;
// * ErrorInput
const ErrorInputContainer = styled.div`
  height: ${spacing.sp16};
  color: ${(props) => props.theme.brand?.danger};
`;
const WarningInputContainer = styled.div`
  height: ${spacing.sp16};
  color: ${(props) => props.theme.brand.warning};
`;
type ErrorInputProps = {
  children: JSX.Element|JSX.Element[];
  hasError: boolean;
  id?: string;
} & HTMLAttributes<HTMLDivElement>;
export const ErrorInput = ({ children, hasError, id, ...props }: ErrorInputProps) => (
  <ErrorInputContainer id={id} role='alert' {...props}>{hasError && children}</ErrorInputContainer>
);
export const WarningInput = ({ children, hasError }: ErrorInputProps) => (
  <WarningInputContainer>{hasError && children}</WarningInputContainer>
);
// * Label
const LabelContainer = styled.label<{required?: boolean}>`
  display: flex;
  align-items: center;
  width: 35%;
  ${(props) =>
    props.required
      ? `
        &:after {
            content: '*';
        }
    `
      : ''}
`;
const TooltipContainer = styled.div`
  margin-left: ${spacing.sp8};
`;
const IconQuestionCircle = styled.i`
  color: ${(props) => props.theme.brand.buttonSecondary};
`;
const UlOverlay = styled.ul`
  text-align: left;
  padding: 0px 0px 0px ${spacing.sp20};
`;
type LabelProps = {
  children: JSX.Element|string;
  tooltipMessages?: JSX.Element[]|Array<string>;
  tooltipWidth?: string;
  style?: CSSStyleSheet;
  required?: boolean;
} & LabelHTMLAttributes<HTMLLabelElement>;
export const Label = ({
  children,
  tooltipMessages,
  tooltipWidth,
  ...labelProps
}: LabelProps) => (
  <LabelContainer {...labelProps}>
    {children}
    {tooltipMessages && tooltipMessages.length > 0 && (
      <TooltipContainer>
        <Tooltip
          overlay={
            tooltipMessages.length > 1 ? (
              <UlOverlay>
                {tooltipMessages.map((message, i) => (
                  <li key={i}> {message} </li>
                ))}
              </UlOverlay>
            ) : (
              tooltipMessages[0]
            )
          }
          placement="right"
          overlayStyle={{
            width: tooltipWidth,
          }}
        >
          <IconQuestionCircle className="fas fa-question-circle"></IconQuestionCircle>
        </Tooltip>
      </TooltipContainer>
    )}
  </LabelContainer>
);
export const Footer = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  align-items: flex-end;
  text-transform: lowercase;
`;
export const FooterError = styled.div`
  flex: 1 1 auto;
  height: inherit;
  margin-right: ${spacing.sp4};
`;
export const FooterButtons = styled.div`
  flex: 0 0 auto;

  button {
    margin-left: ${spacing.sp24};
  }
`;
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.brand.backgroundLevel1};
  padding-top: 1%;
  padding-left: 30%;
  padding-right: 30%;
`;
const FormContainer = styled.div`
  height: 100%;
  background-color: ${(props) => props.theme.brand.backgroundLevel1};
  margin: ${spacing.sp8};
  margin-bottom: ${spacing.sp24};
  overflow: auto;
`;
export const FormScrollArea = styled.div`
  overflow: auto;
  max-height: calc(100vh - 19rem);
  margin-right: ${spacing.sp12};
  padding-bottom: ${spacing.sp40};
`;
export default FormContainer;
