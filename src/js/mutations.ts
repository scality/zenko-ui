import { useMutation } from 'react-query';
import { useManagementClient } from '../react/ManagementProvider';
import { useS3Client } from '../react/next-architecture/ui/S3ClientProvider';
import { useIAMClient } from '../react/IAMProvider';
import { TagSetItem } from '../types/s3';
import { S3 } from 'aws-sdk';
import { notFalsyTypeGuard } from '../types/typeGuards';

const useCreateEndpointMutation = () => {
  const managementClient = useManagementClient();
  return useMutation({
    mutationFn: ({
      hostname,
      locationName,
      instanceId,
    }: {
      hostname: string;
      locationName: string;
      instanceId: string;
    }) => {
      const params = {
        uuid: instanceId,
        endpoint: {
          hostname,
          locationName,
        },
      };
      return notFalsyTypeGuard(
        managementClient,
      ).createConfigurationOverlayEndpoint(params.endpoint, params.uuid);
    },
  });
};

const useCreateAccountMutation = () => {
  const managementClient = useManagementClient();
  return useMutation({
    mutationFn: ({
      user,
      instanceId,
    }: {
      user: { userName: string; email: string };
      instanceId: string;
    }) => {
      const params = {
        uuid: instanceId,
        user,
      };
      return notFalsyTypeGuard(managementClient).createConfigurationOverlayUser(
        params.user,
        params.uuid,
      );
    },
  });
};

const useCreateIAMUserMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({ userName }: { userName: string }) =>
      IAMClient.createUser(userName),
  });
};

const useCreatePolicyMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({
      policyName,
      policyDocument,
    }: {
      policyName: string;
      policyDocument: string;
    }) => IAMClient.createPolicy(policyName, policyDocument),
  });
};

const useAttachPolicyToUserMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({
      userName,
      policyArn,
    }: {
      userName: string;
      policyArn: string;
    }) => IAMClient.attachUserPolicy(userName, policyArn),
  });
};

const usePutBucketTaggingMutation = () => {
  const s3Client = useS3Client();
  return useMutation(
    ({ bucketName, tagSet }: { bucketName: string; tagSet: TagSetItem[] }) =>
      s3Client
        .putBucketTagging({
          Bucket: bucketName,
          Tagging: { TagSet: tagSet },
        })
        .promise(),
  );
};

const usePutObjectMutation = () => {
  const s3Client = useS3Client();
  return useMutation(({ Bucket, Key, Body }: S3.PutObjectRequest) =>
    s3Client.putObject({ Bucket, Key, Body }).promise(),
  );
};

export {
  useCreateEndpointMutation,
  useCreateIAMUserMutation,
  useCreateAccountMutation,
  useCreatePolicyMutation,
  useAttachPolicyToUserMutation,
  usePutBucketTaggingMutation,
  usePutObjectMutation,
};
