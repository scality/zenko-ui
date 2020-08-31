// @flow
import * as L from '../../ui-elements/ListLayout2';

import { List } from 'immutable';
import React from 'react';
import type { S3Bucket } from '../../../types/s3';
import styled from 'styled-components';

const Number = styled.div`
  font-size: 50px;
`;

const Unit = styled.div`
`;


type Props = {
    buckets: List<S3Bucket>,
};
export default function BucketHead({ buckets }: Props){
    return <L.Head>
        <L.HeadSlice>
            <Number>
                { buckets.size }
            </Number>
            <Unit> bucket{ buckets.size > 1 && 's' } </Unit>
        </L.HeadSlice>
    </L.Head>;
}
