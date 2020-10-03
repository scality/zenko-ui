// @flow
import * as L from '../../ui-elements/ListLayout2';
import React from 'react';

type Props = {
    bucketNameParam?: string,
};
export default function ObjectHead({ bucketNameParam }: Props){
    return <L.Head>
        <L.HeadSlice>
            {bucketNameParam}
        </L.HeadSlice>
    </L.Head>;
}
