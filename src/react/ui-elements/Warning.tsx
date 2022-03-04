import styled, { css } from 'styled-components';
import { Button } from '@scality/core-ui/dist/next';
import type { Node } from 'react';
import React from 'react';
import { spacing } from '@scality/core-ui/dist/style/theme';
const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  text-align: center;
  margin-top: ${spacing.sp20};
  color: ${(props) => props.theme.brand.textPrimary};
  ${(props) => {
    if (props.centered) {
      return css`
        justify-content: center;
      `;
    }

    return css`
      margin-top: ${spacing.sp20};
    `;
  }}
`;
const Container2 = styled.div`
  text-align: center;
  margin: ${spacing.sp32} 0px;
  color: ${(props) => props.theme.brand.textPrimary};
`;
const Title = styled.div`
  margin-top: ${spacing.sp8};
`;
const Description = styled.div`
  margin-top: ${spacing.sp8};
`;
const ButtonSection = styled.div`
  margin-top: ${spacing.sp16};
`;
type WarningProps = {
  iconClass?: string;
  title: Node;
  btnTitle?: string;
  btnAction?: () => void;
  centered?: boolean;
};
export const Warning = ({
  iconClass,
  title,
  btnTitle,
  btnAction,
  centered,
}: WarningProps) => (
  <Container centered={centered}>
    {!!iconClass && <i className={iconClass}></i>}
    <Title> {title} </Title>
    {!!btnTitle && !!btnAction && (
      <ButtonSection>
        {' '}
        <Button label={btnTitle} variant="secondary" onClick={btnAction} />{' '}
      </ButtonSection>
    )}
  </Container>
);
type WarningMetadataProps = {
  description: string;
};
export const WarningMetadata = ({ description }: WarningMetadataProps) => (
  <Container2>
    <i className="fas fa-2x fa-exclamation-circle"></i>
    <Title> Metadata Search returned an error. </Title>
    <Description> {description} </Description>
  </Container2>
);
export const NoBucketWarning = () => (
  <Container2>
    <i className="fas fa-2x fa-exclamation-circle"></i>
    <Title> No bucket </Title>
    <Description>
      {' '}
      Data workflows and search work on buckets, but no bucket has been created
      yet.{' '}
    </Description>
  </Container2>
);
export const NoLocationWarning = () => (
  <Container2>
    <i className="fas fa-2x fa-exclamation-circle"></i>
    <Title> No location </Title>
    <Description>
      {' '}
      To create a replication workflow, first create one or several cloud
      locations that will be used as replication targets.{' '}
    </Description>
  </Container2>
);