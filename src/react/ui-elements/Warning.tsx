import styled, { css } from 'styled-components';
import { Box, Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { ReactNode } from 'react';
import { Icon } from '@scality/core-ui';
import { HeadIcon } from './EntityHeader';
const Container = styled.div<{ centered?: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  text-align: center;
  margin-top: ${spacing.sp20};
  color: ${(props) => props.theme.textPrimary};
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
  color: ${(props) => props.theme.textPrimary};
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

export const NoAccountWarning = ({
  buttonSection,
}: {
  buttonSection: ReactNode;
}) => (
  <Container centered>
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      padding={16}
    >
      <HeadIcon>
        <Icon name="Account" />
      </HeadIcon>
    </Box>
    <Title>
      <Box padding={16}>
        <b>You don't have any account yet.</b>
        <br />
        <br />
        <b>
          Launch configuration assistant to create resources needed by Veeam.
        </b>
      </Box>
    </Title>
    <ButtonSection>{buttonSection}</ButtonSection>
  </Container>
);
