import { S3 } from 'aws-sdk';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useIAMClient } from '../react/IAMProvider';
import { useManagementClient } from '../react/ManagementProvider';
import { useInstanceId } from '../react/next-architecture/ui/AuthProvider';
import { useS3Client } from '../react/next-architecture/ui/S3ClientProvider';
import { ApiError } from '../types/actions';
import { TagSetItem } from '../types/s3';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { MULTIPART_UPLOAD } from './S3Client';
import { EndpointV1 } from './managementClient/api';

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

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();
  const waitForRunningConfigurationVersionToBeUpdated = () => {
    setStatus('waiting');
    runningConfigurationVersionMutation.mutate(instanceId, {
      onSuccess: (version) => {
        if (version > versionRef.current) {
          setStatus('success');
        } else {
          setTimeoutId(
            setTimeout(waitForRunningConfigurationVersionToBeUpdated, 500),
          );
        }
      },
      onError: () => {
        setStatus('error');
      },
    });
  };
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);
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
      return notFalsyTypeGuard(managementClient)
        .createConfigurationOverlayUser(params.user, params.uuid)
        .catch(async (error: Response) => {
          if (error.status === 409) {
            throw {
              message: 'An account with the same name or email already exists',
            };
          }
          throw {
            message: 'An error occurred while creating the account',
          };
        });
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
  const options = {
    partSize: MULTIPART_UPLOAD.partSize,
    queueSize: MULTIPART_UPLOAD.queueSize,
  };
  return useMutation(
    ({ Bucket, Key, Body, ContentType }: S3.PutObjectRequest) =>
      s3Client.upload({ Bucket, Key, Body, ContentType }, options).promise(),
  );
};

const useCreateUserAccessKeyMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({ userName }: { userName: string }) =>
      IAMClient.createAccessKey(userName),
  });
};

export {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateEndpointMutation,
  useCreateIAMUserMutation,
  useCreatePolicyMutation,
  useCreateUserAccessKeyMutation,
  usePutBucketTaggingMutation,
  usePutObjectMutation,
};
