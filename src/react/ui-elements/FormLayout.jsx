// @noflow
import { Checkbox as BasicCheckbox, Tooltip } from '@scality/core-ui';
import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import { default as BasicInput } from './Input';
import { default as BasicInputList } from './InputList';
import { Select as BasicSelect } from '@scality/core-ui/dist/next';
import { IconTooltip } from './Icons';
import type { Node } from 'react';
import React from 'react';
import styled from 'styled-components';

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


export const Title = styled.div`
    display: flex;
    text-transform: capitalize;
    color: ${props => props.theme.brand.textPrimary};
    margin-bottom: ${spacing.sp40};
    font-size: ${fontSize.massive};
`;

export const Fieldset = styled.fieldset`
    display: flex;
    flex-direction: column;
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

export const Checkbox = styled(BasicCheckbox)`
`;

export const Input = styled(BasicInput)`
    margin: ${spacing.sp8} 0px ${spacing.sp4} 0px;
`;

export const InputList = styled(BasicInputList)`
    margin: ${spacing.sp8} 0px ${spacing.sp4} 0px;
`;

// * ErrorInput
const ErrorInputContainer = styled.div`
    height: ${spacing.sp16};
    color: ${props => props.theme.brand.danger};
`;

type ErrorInputProps = {
    children: Node,
    hasError: boolean,
};

export const ErrorInput = ({ children, hasError }: ErrorInputProps) => (
    <ErrorInputContainer>
        { hasError && children }
    </ErrorInputContainer>
);

// * Label
const LabelContainer = styled.label`
    display: flex;
`;

const TooltipContainer = styled.div`
    margin-left: ${spacing.sp8};
`;

const UlOverlay = styled.ul`
    text-align:left;
    padding: 0px 0px 0px ${spacing.sp20};
`;

type LabelProps = {
    children: Node,
    tooltipMessages?: Array<string>,
};

export const Label = ({ children, tooltipMessages }: LabelProps) => (
    <LabelContainer>
        { children }
        {
            tooltipMessages && tooltipMessages.length > 0 && <TooltipContainer> <Tooltip
                overlay= {
                    <UlOverlay>
                        { tooltipMessages.map((message, i) => <li key={i}> {message} </li>) }
                    </UlOverlay>}
                placement="right"
            >
                <IconTooltip/>
            </Tooltip> </TooltipContainer>
        }
    </LabelContainer>
);

export const Footer = styled.div`
    display: flex;
    width: 100%;
    justify-content: flex-end;
    align-items: flex-end;

    height: 50px;
    text-transform: lowercase;
    margin-top: ${spacing.sp40};
`;

export const FooterError = styled.div`
    flex: 1 1 auto;
    height: inherit;
    margin-right: ${spacing.sp4};
`;

export const FooterButtons = styled.div`
    flex: 0 0 auto;

    button{
        margin-left: ${spacing.sp24};
    }
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    background-color: ${props => props.theme.brand.backgroundLevel1};
    padding-top: 5%;
    padding-left: 30%;
    padding-right: 30%;
`;

const FormContainer = styled.div`
    height: 100%;
    background-color: ${props => props.theme.brand.backgroundLevel1};
    margin: ${spacing.sp8};
    margin-bottom: ${spacing.sp24};
    overflow: auto;
`;

export default FormContainer;
