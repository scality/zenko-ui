import styled, { css } from 'styled-components';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui';

import { ReactNode } from 'react';
import { Icon, LargeText } from '@scality/core-ui';

const Container = styled.div<{ centered?: boolean }>`
  ${(props) => {
    return css`
      color: ${props.theme.textSecondary};
    `;
  }}
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 10%;
`;
const Container2 = styled.div`
  text-align: center;
  margin: ${spacing.r32} 0px;
  color: ${(props) => props.theme.textPrimary};
`;
const Title = styled.div`
  margin-top: ${spacing.r8};
`;
const Description = styled.div`
  margin-top: ${spacing.r8};
`;
const ButtonSection = styled.div`
  margin-top: ${spacing.r16};
`;
type WarningProps = {
  icon?: ReactNode;
  title: ReactNode;
  btnTitle?: string;
  btnAction?: () => void;
  centered?: boolean;
};
export const Warning = ({
  icon,
  title,
  btnTitle,
  btnAction,
  centered,
}: WarningProps) => (
  <Container centered={centered}>
    <div>{icon}</div>
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
    <Icon size="2x" name="Exclamation-circle" />
    <Title> Metadata Search returned an error. </Title>
    <Description> {description} </Description>
  </Container2>
);
export const NoBucketWarning = () => (
  <Container2>
    <Icon size="2x" name="Exclamation-circle" />
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
    <Icon size="2x" name="Exclamation-circle" />
    <Title> No location </Title>
    <Description>
      {' '}
      To create a replication workflow, first create one or several cloud
      locations that will be used as replication targets.{' '}
    </Description>
  </Container2>
);

export const EmptyStateRow = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: ${spacing.r24};
`;
export const ActionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing.r8};
`;
export const NoAccountWarning = ({
  buttonSection,
}: {
  buttonSection: ReactNode;
}) => (
  <Container>
    <EmptyStateRow>
      <Icon name="Account" size="5x" withWrapper />
    </EmptyStateRow>
    <EmptyStateRow>
      <LargeText>You don't have any account yet.</LargeText>
    </EmptyStateRow>
    <EmptyStateRow>
      <LargeText>
        Launch configuration assitant to create resources needed by Veeam.
      </LargeText>
    </EmptyStateRow>
    <ActionWrapper>{buttonSection}</ActionWrapper>
  </Container>
);
