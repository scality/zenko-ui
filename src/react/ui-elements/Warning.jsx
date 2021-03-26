// @flow
import styled, { css } from 'styled-components';
import { Button } from '@scality/core-ui';
import type { Node } from 'react';
import React from 'react';
import { padding } from '@scality/core-ui/dist/style/theme';

const Container = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    text-align: center;
    margin-top: ${padding.large};
    color: ${props => props.theme.brand.textPrimary};
    ${(props) => {
        if (props.centered) {
            return css`
               justify-content: center;
            `;
        }
        return css`
          margin-top: ${padding.large};
        `;
    }}
`;

const Container2 = styled.div`
    text-align: center;
    margin: 30px 0px;
    color: ${props => props.theme.brand.textPrimary};
`;

const Title = styled.div`
    margin-top: ${padding.small};
`;

const Description = styled.div`
    margin-top: ${padding.small};
`;

const ButtonSection = styled.div`
    margin-top: ${padding.base};
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
        { !!btnTitle && !!btnAction && <ButtonSection> <Button text={btnTitle} variant='buttonSecondary' onClick={btnAction} /> </ButtonSection> }
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

export const NoBucketWarning = () => (
    <Container2>
        <i className='fas fa-2x fa-exclamation-circle'></i>
        <Title> No bucket </Title>
        <Description> Data workflows and search work on Zenko buckets, but no bucket has been created yet. </Description>
    </Container2>
);

export const NoLocationWarning = () => (
    <Container2>
        <i className='fas fa-2x fa-exclamation-circle'></i>
        <Title> No location </Title>
        <Description> To create a replication workflow, first create one or several cloud locations that will be used as replication targets. </Description>
    </Container2>
);
