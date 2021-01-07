// @flow
import styled, { css } from 'styled-components';
import { Button } from '@scality/core-ui';
import type { Node } from 'react';
import React from 'react';

const Container = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    text-align: center;
    margin-top: 20px;
    color: ${props => props.theme.brand.textPrimary};
    height: 100%;
    ${(props) => {
        if (props.centered) {
            return css`
               justify-content: center;
            `;
        }
        return css`
          margin-top: 20px;
        `;
    }}
`;

const Container2 = styled.div`
    text-align: center;
    margin: 30px 0px;
    color: ${props => props.theme.brand.textPrimary};
`;

const Title = styled.div`
    font-size: 15px;
    margin-top: 10px;
`;

const Description = styled.div`
    margin-top: 10px;
    font-size: 13px;
`;

const ButtonSection = styled.div`
    margin-top: 15px;
`;

type WarningProps = {
    iconClass?: string,
    title: Node,
    btnTitle?: string,
    btnAction?: () => void,
    centered?: boolean,
};

export const Warning = ({ iconClass, title, btnTitle, btnAction, centered }: WarningProps) => (
    <Container centered={centered}>
        { !!iconClass && <i className={iconClass}></i> }
        <Title> {title} </Title>
        { !!btnTitle && !!btnAction && <ButtonSection> <Button text={btnTitle} variant='info' onClick={btnAction} /> </ButtonSection> }
    </Container>
);

type WarningMetadataProps = {
    description: string,
};
export const WarningMetadata = ({ description }: WarningMetadataProps) => (
    <Container2>
        <i className='fas fa-2x fa-exclamation-circle'></i>
        <Title> Metadata Search returned an error. </Title>
        <Description> {description} </Description>
    </Container2>
);
