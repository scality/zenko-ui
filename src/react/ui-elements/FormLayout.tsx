import { Checkbox as BasicCheckbox, TextArea, Tooltip } from '@scality/core-ui';
import {
  LargerText,
  SmallerText,
} from '@scality/core-ui/dist/components/text/Text.component';
import { Select as BasicSelect } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { getTheme } from '@scality/core-ui/dist/utils';
import { HTMLAttributes, LabelHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { IconQuestionCircle } from './Icons';
import { default as BasicInput } from './Input';
import { default as BasicInputList } from './InputList';

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
  color: ${(props) => props.theme.textPrimary};
  font-weight: bold;
`;
export const SectionTitle = styled.div<{ fontSize?: string }>`
  display: flex;
  color: ${(props) => props.theme.textPrimary};
  font-size: ${(props) => props.fontSize || 'inherit'};
`;
export const Fieldset = styled.fieldset<{
  direction?: string;
  alignItems?: string;
}>`
  display: flex;
  flex-direction: ${(props) => props.direction || 'column'};
  ${(props) => (props.alignItems ? `align-items: ${props.alignItems};` : '')}
  border: 0;
  padding: 0;
  margin-top: ${spacing.sp12};
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
export const LargeCustomInput = styled(TextArea)`
  display: inline;
  float: left;
  margin: 1rem 0.1rem 0.3rem 0rem;

  padding: ${spacing.sp1};
  border-radius: 4px;
  ${(props) => {
    const { border, textSecondary, backgroundLevel1, selectedActive } =
      getTheme(props);
    return css`
      border-color: ${border};
      color: ${textSecondary};
      background: ${backgroundLevel1};
      &:focus {
        border-color: ${selectedActive};
        outline: none;
      }
    `;
  }}
`;
export const Hr = styled.hr`
  border-color: ${(props) => props.theme.buttonSecondary};
  height: 0.05rem;
  width: 40rem;
  margin-bottom: 1rem;
`;
export const InputList = styled((props) => <BasicInputList {...props} />)`
  margin: ${spacing.sp8} 0px ${spacing.sp4} 0px;
`;

export const SessionSeperation = styled.div`
  width: 23px;
  height: 1px;
  margin: ${spacing.sp16} 0px ${spacing.sp16} 0px;
  background-color: ${(props) => props.theme.buttonSecondary};
`;
export const LabelSecondary = styled(SmallerText)`
  color: ${(props) => props.theme.textSecondary};
`;
// * ErrorInput
const ErrorInputContainer = styled.div`
  height: ${spacing.sp16};
  color: ${(props) => props.theme.statusCritical};
`;
const WarningInputContainer = styled.div`
  height: ${spacing.sp16};
  color: ${(props) => props.theme.statusWarning};
`;
type ErrorInputProps = {
  error?: React.ReactNode;
  id?: string;
} & HTMLAttributes<HTMLDivElement>;
export const ErrorInput = ({ error, id, ...props }: ErrorInputProps) => {
  if (!error) return null;
  return (
    <ErrorInputContainer id={id} role="alert" {...props}>
      {error}
    </ErrorInputContainer>
  );
};

export const WarningInput = ({ error, id }: ErrorInputProps) => {
  if (!error) return null;
  return (
    <WarningInputContainer id={id}>
      <small>{error}</small>
    </WarningInputContainer>
  );
};
// * Label
const LabelContainer = styled.label<{ required?: boolean }>`
  display: flex;
  align-items: center;
  width: 60%;
`;

const RequiredField = styled.span`
  margin-left: ${spacing.sp2};
`;

export const TooltipContainer = styled.div`
  margin-left: ${spacing.sp8};
  display: inline;
`;
const UlOverlay = styled.ul`
  text-align: left;
  padding: 0px 0px 0px ${spacing.sp20};
`;
type LabelProps = {
  children: ReactNode;
  tooltipMessages?: JSX.Element[] | Array<string>;
  tooltipWidth?: string;
  style?: CSSProperties;
  required?: boolean;
} & LabelHTMLAttributes<HTMLLabelElement>;
export const Label = ({
  children,
  tooltipMessages,
  tooltipWidth,
  required,
  ...labelProps
}: LabelProps) => (
  <LabelContainer {...labelProps}>
    {children}
    {required && <RequiredField>*</RequiredField>}
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
          overlayStyle={{ width: tooltipWidth }}
        >
          <IconQuestionCircle name="Info" />
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
  background-color: ${(props) => props.theme?.backgroundLevel1};
  padding-top: 1%;
  padding-left: 20%;
  padding-right: 20%;
`;
export const CustomForm = styled.form`
  height: calc(100vh - 510px);
  margin: ${spacing.sp32};
`;
const FormContainer = styled.div`
  height: 100%;
  overflow: auto;
`;
export const FormScrollArea = styled.div`
  overflow: auto;
  max-height: calc(100vh - 19rem);
  margin-right: ${spacing.sp12};
  padding-bottom: ${spacing.sp40};
`;
export default FormContainer;
