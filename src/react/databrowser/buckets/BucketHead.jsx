// @flow
import * as L from '../../ui-elements/ListLayout2';
import MultiBucketsLogo from '../../../../public/assets/logo-multi-buckets.svg';
import React from 'react';
import type { S3BucketList } from '../../../types/s3';
import { TextBadge } from '../../ui-elements/TextBadge';

type Props = {
  buckets: S3BucketList,
};
export default function BucketHead({ buckets }: Props) {
  const bucketLength = buckets ? buckets.size : 0;

  return (
    <L.Head>
      <L.HeadSlice>
        <L.HeadIcon>
          <img src={MultiBucketsLogo} alt="Multi Buckets Logo" />
        </L.HeadIcon>
      </L.HeadSlice>
      <L.HeadBody>
        <L.HeadTitleContainer>
          <L.HeadTitle>
            All Buckets
            <TextBadge text={bucketLength} variant="infoPrimary" />
          </L.HeadTitle>
        </L.HeadTitleContainer>
      </L.HeadBody>
    </L.Head>
  );
}
