import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Box, Button } from '@scality/core-ui/dist/next';
import { CustomModal as Modal, ModalBody } from '../../ui-elements/Modal';
import { useMutation, useQueryClient } from 'react-query';
import { useIAMClient } from '../../IAMProvider';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { AppState } from '../../../types/state';
import {
  AttachmentOperation,
  AttachmentAction,
  ResourceType,
  EntityType,
} from './AttachmentTypes';
import { useTheme } from 'styled-components';
import { useHistory } from 'react-router';
import { InlineButton } from '../../ui-elements/Table';
import {
  getListAttachedUserPoliciesQuery,
  getListEntitiesForPolicyQuery,
  getListPoliciesQuery,
  getUserListGroupsQuery,
} from '../../queries';
import { useCurrentAccount } from '../../DataServiceRoleProvider';
import {
  Icon,
  LargerText,
  SecondaryText,
  Stack,
  Wrap,
  spacing,
} from '@scality/core-ui';

type AttachmentStatus = 'Waiting for confirmation' | 'Error' | 'Success';

const EntityIcon = ({ type }: { type: EntityType }) => {
  return type === 'user' ? (
    <span>
      <Icon name="User" /> User
    </span>
  ) : type === 'group' ? (
    <span>
      <Icon name="Group" /> Group
    </span>
  ) : type === 'policy' ? (
    <span>
      <Icon name="Policy" /> Policy
    </span>
  ) : (
    <span>
      <Icon name="Role" /> Role
    </span>
  );
};

//The entity is the "thing" you want to attach to the resource, sorry about the naming :(
function AttachmentConfirmationModal({
  attachmentOperations,
  resourceId,
  resourceType,
  resourceName,
  redirectUrl,
}: {
  attachmentOperations: AttachmentOperation[];
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  redirectUrl: string;
}) {
  const history = useHistory();
  const queryClient = useQueryClient();
  const { account } = useCurrentAccount();
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClose = () => {
    setIsModalOpen(false);
  };
  const IAMClient = useIAMClient();

  const [attachmentOperationsStatuses, setAttachmentOperationsStatuses] =
    useState<Record<string, AttachmentStatus>>({});

  const attachUserPolicyMutation = useMutation(
    ({
      action,
      type,
      id,
    }: {
      action: AttachmentAction;
      type: EntityType;
      entityName: string;
      id: string;
    }) => {
      if (action === AttachmentAction.ADD && type === 'user') {
        return IAMClient.attachUserPolicy(id, resourceId);
      } else if (action === AttachmentAction.REMOVE && type === 'user') {
        return IAMClient.detachUserPolicy(id, resourceId);
      } else if (action === AttachmentAction.ADD && type === 'group') {
        if (resourceType === 'policy') {
          return IAMClient.attachGroupPolicy(id, resourceId);
        } else {
          return IAMClient.addUserToGroup(id, resourceId);
        }
      } else if (action === AttachmentAction.REMOVE && type === 'group') {
        if (resourceType === 'policy') {
          return IAMClient.detachGroupPolicy(id, resourceId);
        } else {
          return IAMClient.removeUserFromGroup(id, resourceId);
        }
      } else if (action === AttachmentAction.ADD && type === 'role') {
        return IAMClient.attachRolePolicy(id, resourceId);
      } else if (action === AttachmentAction.REMOVE && type === 'role') {
        return IAMClient.detachRolePolicy(id, resourceId);
      } else if (action === AttachmentAction.ADD && type === 'policy') {
        return IAMClient.attachUserPolicy(resourceId, id);
      } else if (action === AttachmentAction.REMOVE && type === 'policy') {
        return IAMClient.detachUserPolicy(resourceId, id);
      }
      throw new Error(`Attachment to ${type} is not yet supported`);
    },
    {
      onSettled: (_, error, flatEntity) => {
        setAttachmentOperationsStatuses((statuses) => ({
          ...statuses,
          [flatEntity.id]: error ? 'Error' : 'Success',
        }));
        if (resourceType === 'policy') {
          queryClient.invalidateQueries(
            getListEntitiesForPolicyQuery(resourceId, IAMClient),
          );
          queryClient.refetchQueries(
            getListPoliciesQuery(notFalsyTypeGuard(account).Name, IAMClient),
          );
          if (flatEntity.type === 'user') {
            queryClient.refetchQueries(
              getListAttachedUserPoliciesQuery(
                flatEntity.id,
                notFalsyTypeGuard(account).Name,
                IAMClient,
              ),
            );
          }
        }
        if (resourceType === 'user') {
          queryClient.invalidateQueries(
            getListAttachedUserPoliciesQuery(
              resourceId,
              notFalsyTypeGuard(account).Name,
              IAMClient,
            ),
          );
          queryClient.invalidateQueries(
            getUserListGroupsQuery(resourceId, IAMClient),
          );
          if (flatEntity.type === 'policy') {
            queryClient.refetchQueries(
              getListEntitiesForPolicyQuery(flatEntity.id, IAMClient),
            );
            queryClient.invalidateQueries(
              getListPoliciesQuery(notFalsyTypeGuard(account).Name, IAMClient)
                .queryKey,
            );
          }
        }
      },
    },
  );

  const attachmentOperationsFlat: {
    action: AttachmentAction;
    type: EntityType;
    entityName: string;
    id: string;
  }[] = attachmentOperations.map((attachmentOperation: AttachmentOperation) => {
    return {
      action: attachmentOperation.action,
      type: attachmentOperation.entity.type,
      entityName: attachmentOperation.entity.name,
      id: attachmentOperation.entity.id,
    };
  });

  const attach = () => {
    attachmentOperationsFlat.forEach((attachmentOperationFlat) => {
      if (
        attachmentOperationsStatuses[attachmentOperationFlat.id] ===
          'Waiting for confirmation' ||
        attachmentOperationsStatuses[attachmentOperationFlat.id] === 'Error' ||
        !attachmentOperationsStatuses[attachmentOperationFlat.id]
      ) {
        setAttachmentOperationsStatuses((attachmentOperationsStatuses) => {
          return {
            ...attachmentOperationsStatuses,
            [attachmentOperationFlat.id]: 'Waiting for confirmation',
          };
        });
        attachUserPolicyMutation.mutate({
          ...attachmentOperationFlat,
        });
      }
    });
  };
  const isAttachNotDone = attachmentOperationsFlat.find(
    (attachmentOperation) =>
      !attachmentOperationsStatuses[attachmentOperation.id],
  );
  const modalFooter = () => {
    return (
      <Wrap>
        <p></p>
        <Stack>
          {isAttachNotDone ? (
            <>
              <Button variant="outline" onClick={handleClose} label="Cancel" />
              <Button
                icon={<Icon name="Arrow-right" />}
                variant="primary"
                onClick={attach}
                label="Confirm"
                disabled={loading}
              />
            </>
          ) : (
            <Button
              icon={<Icon name="Arrow-right" />}
              variant="primary"
              onClick={() => history.push(redirectUrl)}
              label="Exit"
              disabled={loading}
            />
          )}
        </Stack>
      </Wrap>
    );
  };

  function AttachmentList() {
    const theme = useTheme();
    const columns = [
      {
        Header: 'Action',
        accessor: 'action',
        cellStyle: {
          width: '12.5%',
        },
        Cell: ({ value }: { value: AttachmentAction }) => {
          return value === AttachmentAction.ADD ? (
            <span>
              <Icon name="Link" /> Attach
            </span>
          ) : (
            <Box color={theme.brand.statusCritical}>
              <Icon name="Unlink" /> Detach
            </Box>
          );
        },
      },
      {
        Header: 'Type',
        accessor: 'type',
        cellStyle: {
          width: '12.5%',
        },
        Cell: ({ value }: { value: EntityType }) => {
          return <EntityIcon type={value} />;
        },
      },
      {
        Header: 'Entity name',
        accessor: 'entityName',
        cellStyle: {
          width: '42.5%',
        },
      },
      {
        Header: 'Attachment status',
        accessor: 'id',
        cellStyle: {
          width: '32.5%',
        },
        Cell: ({ value: resourceId }: { value: string }) => {
          if (attachmentOperationsStatuses[resourceId] === 'Error') {
            return (
              <Box display="flex" gap={8} alignItems="center">
                <Icon color="statusCritical" name="Times-circle" />
                {attachmentOperationsStatuses[resourceId]}{' '}
                <InlineButton
                  onClick={attach}
                  variant="outline"
                  label="Retry"
                />
              </Box>
            );
          }
          if (attachmentOperationsStatuses[resourceId] === 'Success') {
            return (
              <Box display="flex" gap={8} alignItems="center">
                <Icon color="statusHealthy" name="Check-circle" />
                {attachmentOperationsStatuses[resourceId]}
              </Box>
            );
          }
          return (
            <>
              {attachmentOperationsStatuses[resourceId] ||
                'Waiting for confirmation'}
            </>
          );
        },
      },
    ];

    return (
      <div style={{ height: '25rem', width: '50rem' }}>
        <div>The following entities will be attached or detached: </div>
        <Box display="flex" gap={24} alignItems="center">
          <SecondaryText>
            <EntityIcon type={resourceType} />
          </SecondaryText>
          <p>{resourceName}</p>
        </Box>
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
    <>
      <Box
        display="flex"
        justifyContent="flex-end"
        gap={8}
        marginBottom={spacing.r16}
      >
        <Button
          label="Cancel"
          variant="outline"
          onClick={() => history.push(redirectUrl)}
        />
        <Button
          icon={<Icon name="Save" />}
          label="Save"
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          disabled={attachmentOperations.length === 0}
        />
      </Box>
      {/*@ts-expect-error TODO core-ui typing is incorrect here.*/}
      <Modal
        close={handleClose}
        footer={modalFooter()}
        isOpen={isModalOpen}
        title={
          <Box display="flex" gap={8}>
            <LargerText>
              <Icon name="Link" />
            </LargerText>
            <LargerText>Attachment</LargerText>
          </Box>
        }
      >
        <ModalBody>
          <AttachmentList />
        </ModalBody>
      </Modal>
    </>
  );
}

export default AttachmentConfirmationModal;
