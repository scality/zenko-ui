import styled, { css } from 'styled-components';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { ReactNode } from 'react';
import { Icon, Text } from '@scality/core-ui';
const Container = styled.div<{ centered?: boolean }>`
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
  icon?: ReactNode;
  title: ReactNode;
  content?: ReactNode;
  btnTitle?: string;
  btnAction?: () => void;
  centered?: boolean;
};
export const Warning = ({
  icon,
  title,
  content,
  btnTitle,
  btnAction,
  centered,
}: WarningProps) => (
  <Container centered={centered}>
    <div>{icon}</div>
    <Title>
      <Text isEmphazed>{title}</Text>
    </Title>
    {!!btnTitle && !!btnAction && (
      <ButtonSection>
        {content}
        <Button label={btnTitle} variant="outline" onClick={btnAction} />{' '}
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
