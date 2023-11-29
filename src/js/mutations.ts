import { S3 } from 'aws-sdk';
import { useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useIAMClient } from '../react/IAMProvider';
import { useManagementClient } from '../react/ManagementProvider';
import { useInstanceId } from '../react/next-architecture/ui/AuthProvider';
import { useS3Client } from '../react/next-architecture/ui/S3ClientProvider';
import { TagSetItem } from '../types/s3';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { EndpointV1 } from './managementClient/api';
import { ApiError } from '../types/actions';

export const useWaitForRunningConfigurationVersionToBeUpdated = () => {
  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const client = notFalsyTypeGuard(managementClient);
  const runningConfigurationVersionMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      return (
        (await client.getLatestInstanceStatus(instanceId)).state
          ?.runningConfigurationVersion || 0
      );
    },
  });
  const versionRef = useRef(0);
  const [status, setStatus] = useState<
    'idle' | 'refTaken' | 'waiting' | 'success' | 'error'
  >('idle');
  const setReferenceVersion = ({ onRefTaken }: { onRefTaken?: () => void }) => {
    setStatus('waiting');
    runningConfigurationVersionMutation.mutate(instanceId, {
      onSuccess: (version) => {
        versionRef.current = version;
        setStatus('refTaken');
        if (onRefTaken) {
          onRefTaken();
        }
      },
      onError: () => {
        setStatus('error');
      },
    });
  };

  const waitForRunningConfigurationVersionToBeUpdated = () => {
    setStatus('waiting');
    runningConfigurationVersionMutation.mutate(instanceId, {
      onSuccess: (version) => {
        if (version > versionRef.current) {
          setStatus('success');
        } else {
          setTimeout(waitForRunningConfigurationVersionToBeUpdated, 500);
        }
      },
      onError: () => {
        setStatus('error');
      },
    });
  };
  return {
    waitForRunningConfigurationVersionToBeUpdated,
    setReferenceVersion,
    status,
  };
};
const useCreateEndpointMutation = () => {
  const managementClient = useManagementClient();
  return useMutation<
    EndpointV1,
    ApiError,
    {
      hostname: string;
      locationName: string;
      instanceId: string;
    }
  >({
    mutationFn: ({ hostname, locationName, instanceId }) => {
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
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateEndpointMutation,
  useCreateIAMUserMutation,
  useCreatePolicyMutation,
  usePutBucketTaggingMutation,
  usePutObjectMutation,
};
