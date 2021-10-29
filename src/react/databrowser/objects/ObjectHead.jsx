// @noflow
import * as L from '../../ui-elements/ListLayout2';
import React from 'react';

type Props = {
  bucketName?: string,
};
export default function ObjectHead({ bucketName }: Props) {
  return (
    <L.Head>
      <L.HeadSlice>
        <L.HeadIcon className="fa fa-glass-whiskey" />
      </L.HeadSlice>
      <L.HeadBody>
        <L.HeadTitleContainer>
          <L.HeadTitle>{bucketName}</L.HeadTitle>
        </L.HeadTitleContainer>
      </L.HeadBody>
    </L.Head>
  );
}
