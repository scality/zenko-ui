// @flow
import { Checkbox as BasicCheckbox, Select as BasicSelect, Tooltip } from '@scality/core-ui';
import { default as BasicInput } from './Input';
import { default as BasicInputList } from './InputList';
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
    margin-bottom: 40px;
    font-size: 24px;
`;

export const Fieldset = styled.fieldset`
    display: flex;
    flex-direction: column;
    border: 0;
    padding: 0;
    margin-top: 15px;
`;

export const Select = styled(BasicSelect)`
    margin: 10px 0px 5px 0px;
`;

export const CheckboxContainer = styled.div`
    display: flex;
    margin: 10px 0px 5px 0px;
    align-items: baseline;
`;

export const Checkbox = styled(BasicCheckbox)`
    margin-left: 15px;
`;

export const Input = styled(BasicInput)`
    margin: 10px 0px 5px 0px;
`;

export const InputList = styled(BasicInputList)`
    margin: 10px 0px 5px 0px;
`;

// * ErrorInput
const ErrorInputContainer = styled.div`
    font-size: 14px;
    height: 15px;
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
    margin-left: 8px;
`;

const IconQuestionCircle = styled.i`
    color: #434343;
`;

const UlOverlay = styled.ul`
    text-align:left;
    padding: 0px 0px 0px 20px;
    font-size: 14px;
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
                <IconQuestionCircle className='fas fa-question-circle'></IconQuestionCircle>
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
    margin-top: 40px;
`;

export const FooterError = styled.div`
    flex: 1 1 auto;

    margin-right: 5px;
    word-break: break-all;
`;

export const FooterButtons = styled.div`
    flex: 0 0 auto;

    button{
        margin-left: 24px;
    }
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    background-color: ${props => props.theme.brand.primaryDark1};
    padding-top: 5%;
    padding-left: 30%;
    padding-right: 30%;
`;

const FormContainer = styled.div`
    height: auto;
    background-color: ${props => props.theme.brand.primaryDark1};
    min-height: 100%;
    margin: 8px;
    border-radius: 5px;
`;

export default FormContainer;
