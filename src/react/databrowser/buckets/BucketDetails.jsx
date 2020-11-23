// @flow
import { ContentSection } from '../../ui-elements/ListLayout2';
import { CustomTabs } from '../../ui-elements/Tabs';
import Properties from './details/Properties';
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

type Props = {
    bucket: ?S3Bucket,
};

const NotFound = () => <Warning iconClass='fas fa-3x fa-exclamation-triangle' title='Bucket not found.' />;

function BucketDetails({ bucket }: Props) {

    const details = () => {
        if (!bucket) {
            return <NotFound/>;
        }
        return <Properties bucket={bucket} />;
    };

    return (
        <ContentSection>
            <CustomTabs
                items={[
                    {
                        onClick: () => {},
                        selected: true,
                        title: 'Summary',
                    },
                ]}
            >
                <div>
                    { details() }
                </div>
            </CustomTabs>
        </ContentSection>
    );
}

export default BucketDetails;
