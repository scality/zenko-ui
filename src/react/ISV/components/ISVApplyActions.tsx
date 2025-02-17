import { Form, Icon, Stack, Text } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import Table, * as T from '../../ui-elements/Table';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import styled, { useTheme } from 'styled-components';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { ISVStepsIndexes, ISV_STEPS } from './ISVSteps';
import { memo } from 'react';
import { ISVSkipModal } from './ISVSkipModal';
import { ISVPlatformConfig } from '../types';
import { useMutationActions } from '../hooks/useMutationActions';

export const ListItem = styled.li`
  padding: 0.5rem;
`;

export type Bucket = {
  name: string;
  tag: string;
  capacity?: string;
  capacityUnit?: string;
  capacityBytes?: number;
};

export type ISVApplyActionsProps = {
  platform: ISVPlatformConfig;
  accountName: string;
  application: string;
  buckets?: Bucket[];
  enableImmutableBackup: boolean;
  accessKey: string;
  secretKey: string;
};

export type ISVConfig = {
  accountName: string;
  accountNameType?: 'create' | 'existing';
  IAMUserName?: string;
  IAMUserNameType?: 'create' | 'existing';
  generateKey?: boolean;
  application?: string;
  enableImmutableBackup?: boolean;
  buckets?: {
    name: string;
    tag: string;
    capacity?: string;
    capacityUnit?: string;
    capacityBytes?: number;
  }[];
};

const StatusBox = styled(Box)`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export default memo(function ISVApplyActions(
  propsConfiguration: ISVApplyActionsProps,
) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const theme = useTheme();
  const navigate = useBasenameRelativeNavigate();
  const queryClient = useQueryClient();
  const { next } = useStepper(ISVStepsIndexes.ApplyActions, ISV_STEPS);

  const { buckets, enableImmutableBackup, accountName, application, platform } =
    propsConfiguration;

  const { data, accessKey, secretKey } = useMutationActions(propsConfiguration);

  const isCancellable = useMemo(
    () => data.some((row) => row.status === 'error'),
    [data],
  );
  const isContinue = useMemo(
    () => data.every((row) => row.status === 'success'),
    [data],
  );

  const handleContinue = useCallback(() => {
    queryClient.invalidateQueries(['WebIdentityRoles']);
    next({
      accountName,
      buckets,
      enableImmutableBackup,
      accessKey,
      secretKey,
      application,
    });
  }, [
    accountName,
    buckets,
    enableImmutableBackup,
    accessKey,
    secretKey,
    application,
  ]);

  const handleExit = useCallback(() => {
    setConfirmCancel(true);
    queryClient.invalidateQueries(['WebIdentityRoles']);
  }, [queryClient]);

  return (
    <>
      <ISVSkipModal
        isOpen={confirmCancel}
        close={() => setConfirmCancel(false)}
        exitAction={() => navigate('/')}
        title={`Exit ${platform.name} Assistant Configuration`}
        modalContent={platform.skipModalContent}
      />
      <Form
        layout={{
          title: `Configure ARTESCA for ${platform.name}`,
          kind: 'page',
        }}
        requireMode="all"
        rightActions={
          <Stack gap="r16">
            <Button
              type="button"
              disabled={!isCancellable}
              variant="outline"
              label="Exit"
              onClick={handleExit}
            />
            <Button
              disabled={!isContinue}
              variant="primary"
              label={'Continue'}
              icon={<Icon name="Arrow-right" />}
              onClick={handleContinue}
            />
          </Stack>
        }
        style={{ width: '50rem' }}
      >
        <div style={{ height: '32rem' }}>
          {/* <Table columns={columns} data={data}>
            <Table.SingleSelectableContent
              rowHeight="h32"
              separationLineVariant="backgroundLevel3"
              children={(rows) => {
                console.log('DEBUG rows', rows);
                return rows;
              }}
            />
          </Table> */}
          <Table>
            <T.Head>
              <T.HeadRow>
                <T.HeadCell>Step</T.HeadCell>
                <T.HeadCell>Action</T.HeadCell>
                <T.HeadCell>Status</T.HeadCell>
              </T.HeadRow>
            </T.Head>
            <T.Body>
              {data.map((row, index) => (
                <T.Row key={index} style={{ display: 'flex' }}>
                  <T.Cell>{row.step}</T.Cell>
                  <T.Cell style={{ flex: 0.5 }}>
                    <div>
                      <Text>{row.action}</Text>
                    </div>
                  </T.Cell>
                  <T.Cell>
                    {row.status === 'success' ? (
                      <StatusBox>
                        <Icon name="Check" color={theme.statusHealthy} />
                        <span>Success</span>
                      </StatusBox>
                    ) : row.status === 'error' ? (
                      <StatusBox>
                        <Icon
                          name="Exclamation-triangle"
                          color={theme.statusCritical}
                        />
                        <span>Failed</span>
                        <Button
                          icon={<Icon name="Redo" />}
                          variant="secondary"
                          type="button"
                          label="Retry"
                          onClick={row.retry}
                        />
                      </StatusBox>
                    ) : (
                      <span>Pending...</span>
                    )}
                  </T.Cell>
                </T.Row>
              ))}
            </T.Body>
          </Table>
        </div>
      </Form>
    </>
  );
});
