// @flow
import * as L from '../../ui-elements/ListLayout2';

import React from 'react';
import type { S3BucketList } from '../../../types/s3';
import styled from 'styled-components';

const Number = styled.div`
  font-size: 50px;
`;

const Unit = styled.div`
`;


type Props = {
    buckets: S3BucketList,
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
