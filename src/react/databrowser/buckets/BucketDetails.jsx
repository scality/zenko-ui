// @flow
import type { AppState } from '../../../types/state';
import { ContentSection } from '../../ui-elements/ListLayout2';
import { CustomTabs } from '../../ui-elements/Tabs';
import Overview from './details/Overview';
import React from 'react';
import type { S3Bucket } from '../../../types/s3';
import { Warning } from '../../ui-elements/Warning';
import { useSelector } from 'react-redux';

type Props = {
    bucket: ?S3Bucket,
};

const NotFound = () => <Warning iconClass='fas fa-3x fa-exclamation-triangle' title='Bucket not found.' />;

function BucketDetails({ bucket }: Props) {
    const theme = useSelector((state: AppState) => state.uiConfig.theme);

    const details = () => {
        if (!bucket) {
            return <NotFound/>;
        }
        return <Overview bucket={bucket} />;
    };

    return (
        <ContentSection>
            <CustomTabs
                activeTabColor={ theme.brand.backgroundLevel4 }
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
