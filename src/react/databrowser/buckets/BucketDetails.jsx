// @flow
import { closeBucketDeleteDialog, deleteBucket, openBucketDeleteDialog } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Button } from '@scality/core-ui';
import { ContentSection } from '../../ui-elements/ListLayout2';
import DeleteConfirmation from '../../ui-elements/DeleteConfirmation';
import React from 'react';
import type { S3Bucket } from '../../../types/s3';
import { Warning } from '../../ui-elements/Warning';
import styled from 'styled-components';

const ActionButtons = styled.div`
    display: flex;
    justify-content: flex-end;
`;

type Props = {
    bucket: ?S3Bucket,
};

const NotFound = () => <Warning iconClass='fas fa-3x fa-exclamation-triangle' title='Bucket not found.' />;

function BucketDetails({ bucket }: Props) {
    const dispatch = useDispatch();
    const showDelete = useSelector((state: AppState) => state.uiBuckets.showDelete);

    if (!bucket) {
        return <ContentSection> <NotFound/> </ContentSection>;
    }

    const handleDeleteClick = () => {
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

    return (
        <ContentSection>
            <DeleteConfirmation show={showDelete === bucket.Name} cancel={handleDeleteCancel} approve={handleDeleteApprove} titleText={`Are you sure you want to delete bucket: ${bucket.Name} ?`}/>
            <ActionButtons>
                <Button icon={<i className="fas fa-trash" />} variant='danger' onClick={handleDeleteClick} text='Delete Bucket'/>
            </ActionButtons>
        </ContentSection>
    );
}

export default BucketDetails;
