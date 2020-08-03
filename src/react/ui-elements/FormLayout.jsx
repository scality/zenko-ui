// @flow
import { default as BasicInput } from './Input';
import type { Node } from 'react';

import React from 'react';
import { Tooltip } from '@scality/core-ui';
import styled from 'styled-components';

// TEMPLATE:
//
// <Form>
//     <F.Title> global title </F.Title>
//     <F.Fieldset>
//         <F.Label tooltipMessages={['text1', 'text2']> label1 </F.Label>
//         <F.Input/>
//         <F.ErrorInput hasError={false}> error Name </F.ErrorInput>
//     </F.Fieldset>
//     <F.Fieldset>
//         <F.Label tooltipMessages={['text1', 'text2']}> label2 </F.Label>
//         <F.Input />
//         <F.ErrorInput hasError={false}> error Email </F.ErrorInput>
//     </F.Fieldset>
//     <F.Footer>
//         <F.FooterError> <Banner> Global error </Banner> </F.FooterError>
//         <F.FooterButtons> <Button/> <Button/> </F.FooterButtons>
//     </F.Footer>
// </Form>


export const Title = styled.div`
    display: flex;

    text-transform: uppercase;
    margin-bottom: 40px;
    font-size: 19px;
`;

export const Fieldset = styled.fieldset`
    display: flex;
    flex-direction: column;
    border: 0;
    padding: 0;
    margin-top: 15px;
`;

export const Input = styled(BasicInput)`
    margin: 10px 0px 5px 0px;
`;

// * ErrorInput
const ErrorInputContainer = styled.div`
    font-size: 11px;
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
    margin-left: 10px;
`;

const UlOverlay = styled.ul`
    width: 100px;
    text-align:left;
    padding: 0px 0px 0px 20px;
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
                <i className='far fa-question-circle'></i>
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
        margin-right: 5px;
    }
`;


const Form = styled.form`
    display: flex;
    flex-direction: column;

    max-width: 600px;
    margin: 10px;
    padding: 20px;
    background-color: ${props => props.theme.brand.backgroundContrast1};
    border-radius: 5px;
`;

export default Form;
