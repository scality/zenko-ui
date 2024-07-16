import { Expiration } from '../../../types/config';
import { BucketWorkflowV1 } from '../../../js/managementClient/api';
import { flattenFormErrors, prepareExpirationQuery } from '../utils';
describe('prepareExpirationQuery', () => {
  it('should remove null and empty values', () => {
    //S
    const request: Expiration = {
      bucketName: 'string',
      enabled: true,
      filter: {
        objectKeyPrefix: 'string',
      },
      name: 'string',
      //@ts-expect-error fix this when you are working on it
      type: BucketWorkflowV1.TypeEnum.ExpirationV1,
      workflowId: 'string',
      currentVersionTriggerDelayDate: '',
      currentVersionTriggerDelayDays: 1,
      expireDeleteMarkersTrigger: false,
      incompleteMultipartUploadTriggerDelayDays: null,
      previousVersionTriggerDelayDays: null,
    };
    //E
    const preparedRequest = prepareExpirationQuery(request);
    //V
    expect(preparedRequest).toStrictEqual({
      bucketName: 'string',
      enabled: true,
      filter: {
        objectKeyPrefix: 'string',
      },
      name: 'string/string - (Current version: 1d)',
      type: BucketWorkflowV1.TypeEnum.ExpirationV1,
      workflowId: 'string',
      currentVersionTriggerDelayDays: 1,
    });
  });

  it('should keep expireDeleteMarkersTrigger when true', () => {
    //S
    const request: Expiration = {
      bucketName: 'string',
      enabled: true,
      filter: {
        objectKeyPrefix: 'string',
      },
      name: 'string',
      //@ts-expect-error fix this when you are working on it
      type: BucketWorkflowV1.TypeEnum.ExpirationV1,
      workflowId: 'string',
      currentVersionTriggerDelayDate: '',
      currentVersionTriggerDelayDays: null,
      expireDeleteMarkersTrigger: true,
      incompleteMultipartUploadTriggerDelayDays: 1,
      previousVersionTriggerDelayDays: null,
    };
    //E
    const preparedRequest = prepareExpirationQuery(request);
    //V
    expect(preparedRequest).toStrictEqual({
      bucketName: 'string',
      enabled: true,
      filter: {
        objectKeyPrefix: 'string',
      },
      name: 'string/string - (Orphan delete markers, Incomplete multipart: 1d)',
      type: BucketWorkflowV1.TypeEnum.ExpirationV1,
      workflowId: 'string',
      expireDeleteMarkersTrigger: true,
      incompleteMultipartUploadTriggerDelayDays: 1,
    });
  });
});

describe('flattenFormErrors', () => {
  it('should flatten form errors', () => {
    //S
    const formError = { message: 'string', ref: '', type: '' };
    const errors = {
      level1: formError,
      parent: {
        child: formError,
      },
      deep: {
        ly: {
          nested: {
            key: formError,
          },
        },
      },
    };
    //E
    const flattenErrors = flattenFormErrors(errors);
    //V
    expect(flattenErrors).toStrictEqual({
      level1: formError,
      'parent.child': formError,
      'deep.ly.nested.key': formError,
    });
  });
});
