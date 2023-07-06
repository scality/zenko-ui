import { BasicText, EmphaseText, LargerText } from '@scality/core-ui';
import { useState } from 'react';
import { useParams, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import { useCurrentAccount } from '../../DataServiceRoleProvider';
import { regexArn } from '../../utils/hooks';
import AttachmentConfirmationModal from './AttachmentConfirmationModal';
import AttachmentTabs from './AttachmentTabs';
import { AttachmentOperation, ResourceType } from './AttachmentTypes';

const AttachmentContainer = styled.div`
  padding-top: 1%;
  padding-left: 18%;
  padding-right: 18%;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const AttachmentFooterContainer = styled.div`
  border-top: 1px solid ${(props) => props.theme.brand.backgroundLevel2};
  margin-top: 3%;
  padding-top: 1%;
  padding-left: 1%;
  padding-right: 1%;
  margin-left: 17%;
  margin-right: 17%;
  display: flex;
  flex-direction: column;
`;

const TitleBlock = styled(LargerText)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 1rem;
  gap: 2rem;
  border-bottom: 1px solid ${(props) => props.theme.brand.backgroundLevel2};
`;

const DescriptiveBlock = styled(BasicText)`
  margin-bottom: 0.5rem;
`;

const Attachments = () => {
  const isAttachToPolicy = useRouteMatch(
    '/accounts/:accountName/policies/:policyArn/attachments',
  );
  const [attachmentOperations, setAttachmentOperations] = useState<
    AttachmentOperation[]
  >([]);
  const resourceType: ResourceType = isAttachToPolicy ? 'policy' : 'user';
  const { policyArn: encodedPolicyArn } = useParams<{ policyArn: string }>();
  const policyArn = decodeURIComponent(encodedPolicyArn);
  const { account } = useCurrentAccount();
  const { IAMUserName } = useParams<{ IAMUserName: string }>();

  const resourceId = resourceType === 'policy' ? policyArn : IAMUserName;
  const resourceName = isAttachToPolicy
    ? regexArn.exec(policyArn)?.groups?.name || ''
    : IAMUserName;

  return (
    <>
      <AttachmentContainer>
        <TitleBlock>Attach entities</TitleBlock>
        <DescriptiveBlock>
          Search for the entries you want to attach or click remove for the
          items you want to detach from the{' '}
          {isAttachToPolicy ? 'Policy' : 'User'}:{' '}
          <EmphaseText>{resourceName}</EmphaseText>
        </DescriptiveBlock>

        <AttachmentTabs
          resourceId={resourceId}
          resourceType={resourceType}
          resourceName={resourceName}
          onAttachmentsOperationsChanged={setAttachmentOperations}
        />
      </AttachmentContainer>
      <AttachmentFooterContainer>
        <AttachmentConfirmationModal
          attachmentOperations={attachmentOperations}
          resourceId={resourceId}
          resourceName={resourceName}
          resourceType={resourceType}
          redirectUrl={
            isAttachToPolicy
              ? `/accounts/${account?.Name}/policies`
              : `/accounts/${account?.Name}/users`
          }
        />
      </AttachmentFooterContainer>
    </>
  );
};

export default Attachments;
