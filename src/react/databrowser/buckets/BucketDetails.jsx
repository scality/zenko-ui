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

export const ToBeReplacedByCustomTabs = styled.div`
    display: flex;
    flex-direction: column;
    height: calc(100vh - 249px);
    margin: 0px;
    padding: 10px;
    border-radius: 5px;
    background-color: ${props => props.theme.brand.primary};
`;

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

    const details = () => {
        if (!bucket) {
            return <NotFound/>;
        }
        return <div>
            <DeleteConfirmation show={showDelete === bucket.Name} cancel={handleDeleteCancel} approve={handleDeleteApprove} titleText={`Are you sure you want to delete bucket: ${bucket.Name} ?`}/>
            <ActionButtons>
                <Button icon={<i className="fas fa-trash" />} variant='danger' onClick={handleDeleteClick} text='Delete Bucket'/>
            </ActionButtons>
        </div>;
    };

    return (
        <ContentSection>
            <ToBeReplacedByCustomTabs>
                { details() }
            </ToBeReplacedByCustomTabs>
        </ContentSection>
    );
}

export default BucketDetails;
