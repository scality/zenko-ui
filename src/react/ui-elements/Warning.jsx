// @flow
import { Button } from '@scality/core-ui';
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    justify-content: center;
    color: ${props => props.theme.brand.textPrimary};
    height: 100%;
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
    title: string,
    btnTitle?: string,
    btnAction?: () => void,
};

export const Warning = ({ iconClass, title, btnTitle, btnAction }: WarningProps) => (
    <Container>
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
