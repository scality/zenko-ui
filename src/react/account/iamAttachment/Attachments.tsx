import { useParams, useRouteMatch } from 'react-router';
import { regexArn } from '../../utils/hooks';
import { ResourceType } from './AttachmentConfirmationModal';

const Attachments = () => {
  const isAttachToUser = useRouteMatch(
    '/accounts/:accountName/users/:IAMUserName/attachments',
  );
  const isAttachToPolicy = useRouteMatch(
    '/accounts/:accountName/policies/:policyArn/attachments',
  );
  const resourceType: ResourceType = isAttachToPolicy ? 'policy' : 'user';
  const { policyArn: encodedPolicyArn } = useParams<{ policyArn: string }>();
  const policyArn = decodeURIComponent(encodedPolicyArn);
  const { IAMUserName } = useParams<{ IAMUserName: string }>();

  const resourceId = resourceType === 'policy' ? policyArn : IAMUserName;
  const resourceName = regexArn.exec(policyArn)?.groups?.name;
  return <></>;
};

export default Attachments;
