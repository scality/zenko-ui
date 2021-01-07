// @flow
import { ContentSection } from '../../ui-elements/ListLayout2';
import { CustomTabs } from '../../ui-elements/Tabs';
import Overview from './details/Overview';
import React from 'react';
import type { S3Bucket } from '../../../types/s3';
import { Warning } from '../../ui-elements/Warning';

type Props = {
    bucket: ?S3Bucket,
};

const NotFound = () => <Warning iconClass='fas fa-3x fa-exclamation-triangle' title='Bucket not found.' />;

function BucketDetails({ bucket }: Props) {
    const details = () => {
        if (!bucket) {
            return <NotFound/>;
        }
        return <Overview bucket={bucket} />;
    };

    return (
        <ContentSection>
            <CustomTabs
                items={[
                    {
                        onClick: () => {},
                        selected: true,
                        title: 'Overview',
                    },
                ]}
            >
                { details() }
            </CustomTabs>
        </ContentSection>
    );
}

export default BucketDetails;
