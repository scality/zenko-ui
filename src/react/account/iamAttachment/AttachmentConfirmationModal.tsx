import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Button } from '@scality/core-ui/dist/next';
import { CustomModal as Modal, ModalBody } from '../../ui-elements/Modal';
import { useMutation } from 'react-query';
import { useIAMClient } from '../../IAMProvider';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { AppState } from '../../../types/state';

type EntityType = 'user' | 'role' | 'policy' | 'group';
export type ResourceType = 'policy' | 'user';
type AttachmentStatus = 'Waiting for confirmation' | 'Error' | 'Success';

type AttachableEntity = {
  name: string;
  arn: string;
  type: EntityType;
};

export enum AttachmentType {
  ADD,
  REMOVE,
}

export type AttachmentOperation = {
  action: AttachmentType;
  entity: AttachableEntity;
};

//The entity is the "thing" you want to attach to the resource, sorry about the naming :(
function AttachmentConfirmationModal({
  attachmentOperations,
  resourceId,
  resourceType,
  resourceName,
}: {
  attachmentOperations: AttachmentOperation[];
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
}) {
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );

  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
  };
  const IAMClient = useIAMClient();

  const attachUserPolicyMutation = useMutation(
    ({
      action,
      type,
      entityName,
    }: {
      action: AttachmentType;
      type: EntityType;
      entityName: string;
    }) => {
      if (action === AttachmentType.ADD && type === 'user') {
        return notFalsyTypeGuard(IAMClient).attachUserPolicy(
          entityName,
          resourceId,
        );
      } else if (action === AttachmentType.REMOVE && type === 'user') {
        return notFalsyTypeGuard(IAMClient).detachUserPolicy(
          entityName,
          resourceId,
        );
      } else if (action === AttachmentType.ADD && type === 'group') {
        return notFalsyTypeGuard(IAMClient).attachGroupPolicy(
          entityName,
          resourceId,
        );
      } else if (action === AttachmentType.REMOVE && type === 'group') {
        return notFalsyTypeGuard(IAMClient).detachGroupPolicy(
          entityName,
          resourceId,
        );
      } else if (action === AttachmentType.ADD && type === 'role') {
        return notFalsyTypeGuard(IAMClient).attachRolePolicy(
          entityName,
          resourceId,
        );
      } else if (action === AttachmentType.REMOVE && type === 'role') {
        return notFalsyTypeGuard(IAMClient).detachRolePolicy(
          entityName,
          resourceId,
        );
      }
      throw new Error(`Attachment to ${type} is not yet supported`);
    },
  );
  const [attachmentOperationsFlat, setAttachmentOperationsFlat] = useState<
    {
      action: AttachmentType;
      type: EntityType;
      entityName: string;
      arn: string;
      attachmentStatus: AttachmentStatus;
    }[]
  >(
    attachmentOperations.map((attachmentOperation: AttachmentOperation) => {
      return {
        action: attachmentOperation.action,
        type: attachmentOperation.entity.type,
        entityName: attachmentOperation.entity.name,
        arn: attachmentOperation.entity.arn,
        attachmentStatus: 'Waiting for confirmation',
      };
    }),
  );

  const attach = () => {
    attachmentOperationsFlat.forEach((attachmentOperationFlat) => {
      if (
        attachmentOperationFlat.attachmentStatus ===
          'Waiting for confirmation' ||
        attachmentOperationFlat.attachmentStatus === 'error'
      ) {
        attachUserPolicyMutation.mutate(
          {
            ...attachmentOperationFlat,
          },
          {
            onSettled: (_, error) => {
              setAttachmentOperationsFlat((attachmentOperationsFlat) => {
                return attachmentOperationsFlat.map((attachmentOperation) => {
                  if (attachmentOperation.arn === attachmentOperationFlat.arn) {
                    return {
                      ...attachmentOperation,
                      attachmentStatus: error ? 'error' : 'success',
                    };
                  }
                  return attachmentOperation;
                });
              });
            },
          },
        );
      }
    });
  };
  const isAttachNotDone = attachmentOperationsFlat.find(
    (attachmentOperation) =>
      attachmentOperation.attachmentStatus === 'Waiting for confirmation',
  );
  const modalFooter = () => {
    return (
      <div>
        <Button variant="outline" onClick={handleClose} label="Cancel" />
        {isAttachNotDone ? (
          <Button
            icon={<i className="fas fa-arrow-right"></i>}
            variant="primary"
            onClick={attach}
            label="Confirm"
            disabled={loading}
          />
        ) : (
          <Button
            icon={<i className="fas fa-arrow-right"></i>}
            variant="primary"
            onClick={handleClose}
            label="Continue"
            disabled={loading}
          />
        )}
      </div>
    );
  };

  function AttachmentList() {
    const columns = [
      {
        Header: 'Action',
        accessor: 'action',
        Cell: ({ value }) => {
          return value === AttachmentType.ADD ? (
            <span>
              <i className="fas fa-link" /> Attach
            </span>
          ) : (
            <span>
              <i className="fas fa-link-slash" /> Detach
            </span>
          );
        },
      },
      {
        Header: 'Type',
        accessor: 'type',
        Cell: ({ value }: { value: EntityType }) => {
          return value === 'user' ? (
            <span>
              <i className="fas fa-user" /> User
            </span>
          ) : value === 'group' ? (
            <span>
              <i className="fas fa-users" /> Group
            </span>
          ) : (
            <span>
              <i className="fas fa-hat-cowboy" /> Role
            </span>
          );
        },
      },
      {
        Header: 'Entity name',
        accessor: 'entityName',
      },
      {
        Header: 'Attachment status',
        accessor: 'attachmentStatus',
        cellStyle: {
          width: '15rem',
        },
        Cell: ({ value }: { value: AttachmentStatus }) => {
          if (value === 'error') {
            return (
              <>
                {value}{' '}
                <Button onClick={attach} variant="danger" label="Retry" />
              </>
            );
          }
          return <>{value}</>;
        },
      },
    ];

    return (
      <div style={{ height: '25rem' }}>
        <div>The following entities will be attached or detached: </div>
        <div>
          {resourceType} {resourceName}
        </div>
        <Table
          columns={columns}
          data={attachmentOperationsFlat}
          defaultSortingKey={'entityName'}
        >
          <Table.SingleSelectableContent
            rowHeight="h32"
            separationLineVariant="backgroundLevel3"
            backgroundVariant="backgroundLevel1"
            children={(Rows) => {
              return <>{Rows}</>;
            }}
          ></Table.SingleSelectableContent>
        </Table>
      </div>
    );
  }

  return (
    <Modal
      close={handleClose}
      footer={modalFooter()}
      isOpen={isModalOpen}
      title="Attachment"
    >
      <ModalBody>
        <AttachmentList />
      </ModalBody>
    </Modal>
  );
}

export default AttachmentConfirmationModal;
