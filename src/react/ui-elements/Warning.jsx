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

const Title = styled.div`
    margin-top: 10px;
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
