// @flow
import * as L from '../../ui-elements/ListLayout2';

import type { AppState } from '../../../types/state';
import { Breadcrumb } from '@scality/core-ui';
import BucketHead from './BucketHead';
import BucketList from './BucketList';
import React from 'react';

import { useSelector } from 'react-redux';

export default function Buckets(){
    const buckets = useSelector((state: AppState) => state.s3.listBucketsResults.list);
    const accountName = useSelector((state: AppState) => state.s3.listBucketsResults.ownerName);
    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    console.log('accountName!!!', accountName);
    return <L.Container>
        <L.BreadcrumbContainer>
            <Breadcrumb
                paths={[
                    <label key={1}>{ accountName }</label>,
                    <label key={2}>buckets</label>,
                ]}
            />
        </L.BreadcrumbContainer>
        <BucketHead buckets={buckets} />

        <L.Body>
            <BucketList buckets={buckets} locations={locations} />
            <L.ContentSection>
            </L.ContentSection>
        </L.Body>

    </L.Container>;
}
