// @noflow
import { Button, Toggle } from '@scality/core-ui';
import React, { useEffect } from 'react';
import Table, * as T from '../../../ui-elements/TableKeyValue2';
import { closeBucketDeleteDialog, deleteBucket, getBucketInfo, openBucketDeleteDialog, toggleBucketVersioning } from '../../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import DeleteConfirmation from '../../../ui-elements/DeleteConfirmation';
import type { S3Bucket } from '../../../types/s3';
import { getLocationTypeFromName } from '../../../utils/storageOptions';
import { maybePluralize } from '../../../utils';
import styled from 'styled-components';

const TableContainer = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow-y: auto;
    height: calc(100vh - 362px);
    margin: 5px 15px;
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
`;

type Props = {
    bucket: S3Bucket,
};

function Overview({ bucket }: Props) {
    const dispatch = useDispatch();
    const showDelete = useSelector((state: AppState) => state.uiBuckets.showDelete);
    const bucketInfo = useSelector((state: AppState) => state.s3.bucketInfo);
    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    const loading = useSelector((state: AppState) => state.networkActivity.counter > 0);

    useEffect(() => {
        dispatch(getBucketInfo(bucket.Name));
    }, [dispatch, bucket.Name]);

    const handleDeleteClick = () => {
        if (!bucket) {
            return;
        }
        dispatch(openBucketDeleteDialog(bucket.Name));
    };

    const handleDeleteApprove = () => {
        if (!bucket) {
            return;
        }
        dispatch(deleteBucket(bucket.Name));
    };

    const handleDeleteCancel = () => {
        dispatch(closeBucketDeleteDialog());
    };

    if (!bucketInfo) {
        return null;
    }

    return (
        <TableContainer>
            <DeleteConfirmation show={showDelete === bucket.Name} cancel={handleDeleteCancel} approve={handleDeleteApprove} titleText={`Are you sure you want to delete bucket: ${bucket.Name} ?`}/>
            <ButtonContainer>
                <Button icon={<i className="fas fa-trash" />} size="default" disabled={loading} variant='danger' onClick={handleDeleteClick} text='Delete Bucket'/>
            </ButtonContainer>
            <Table>
                <T.Body>
                    <T.Group>
                        <T.GroupName>
                            General
                        </T.GroupName>
                        <T.GroupContent>
                            <T.Row>
                                <T.Key> Name </T.Key>
                                <T.Value>
                                    { bucketInfo.name }
                                </T.Value>
                            </T.Row>
                            <T.Row>
                                <T.Key> Versioning </T.Key>
                                <T.Value>
                                    <Toggle
                                        disabled={loading}
                                        toggle={bucketInfo.isVersioning}
                                        label={bucketInfo.versioning}
                                        onChange={() => dispatch(toggleBucketVersioning(bucket.Name, !bucketInfo.isVersioning))}
                                    />
                                </T.Value>
                            </T.Row>
                            <T.Row>
                                <T.Key> Location </T.Key>
                                <T.Value>
                                    { bucketInfo.locationConstraint || 'us-east-1' } /
                                    <small> { getLocationTypeFromName(bucketInfo.locationConstraint, locations) } </small>
                                </T.Value>
                            </T.Row>
                        </T.GroupContent>
                    </T.Group>
                    <T.Group>
                        <T.GroupName>
                            Permissions
                        </T.GroupName>
                        <T.GroupContent>
                            <T.Row>
                                <T.Key> Owner </T.Key>
                                <T.Value> { bucketInfo.owner } </T.Value>
                            </T.Row>
                            <T.Row>
                                <T.Key> Access Control List </T.Key>
                                <T.Value>
                                    {maybePluralize(bucketInfo.aclGrantees, 'Grantee')}
                                </T.Value>
                            </T.Row>
                            <T.Row>
                                <T.Key> CORS Configuration </T.Key>
                                <T.Value>
                                    {bucketInfo.cors ? 'Yes' : 'No'}
                                </T.Value>
                            </T.Row>
                            <T.Row>
                                <T.Key> Public </T.Key>
                                <T.Value>
                                    {bucketInfo.public ? 'Yes' : 'No'}
                                </T.Value>
                            </T.Row>
                        </T.GroupContent>
                    </T.Group>
                </T.Body>
            </Table>
        </TableContainer>
    );
}

export default Overview;
