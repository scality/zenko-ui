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
    display: block;
    overflow-y: auto;
    height: calc(100vh - 340px);
    margin: 15px;
`;

const DeleteButton = styled(Button)`
    margin-left: 10px;
`;

type Props = {
    bucket: S3Bucket,
};

function Properties({ bucket }: Props) {
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
            <Table>
                <T.Body>
                    <T.Group>
                        <T.GroupName>
                            Overview
                        </T.GroupName>
                        <T.GroupContent>
                            <T.Row>
                                <T.Key> Name </T.Key>
                                <T.Value>
                                    { bucketInfo.name }
                                    <DeleteButton icon={<i className="fas fa-trash" />} size="smaller" disabled={loading} variant='danger' onClick={handleDeleteClick} text=''/>
                                </T.Value>
                            </T.Row>
                            <T.Row>
                                <T.Key> Versioning </T.Key>
                                <T.Value>
                                    <Toggle
                                        disabled={loading}
                                        toggle={bucketInfo.versioning}
                                        label={bucketInfo.versioning ? 'Enabled' : 'Disabled'}
                                        onChange={() => dispatch(toggleBucketVersioning(bucket.Name, !bucketInfo.versioning))}
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
                            <T.Row>
                                <T.Key> Replication </T.Key>
                                <T.Value>
                                    {bucketInfo.crossRegionReplication ? 'Enabled' : 'Disabled'}
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

export default Properties;
