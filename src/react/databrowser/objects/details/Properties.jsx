// @noflow
import Table, * as T from '../../../ui-elements/TableKeyValue';
import { Clipboard } from '../../../ui-elements/Clipboard';
import MiddleEllipsis from '../../../ui-elements/MiddleEllipsis';
import type { ObjectMetadata } from '../../../../types/s3';
import { PrettyBytes } from '@scality/core-ui';
import React from 'react';
import { formatShortDate } from '../../../utils';
import styled from 'styled-components';

type Props = {
  objectMetadata: ObjectMetadata,
};

const TruncatedValue = styled(T.Value)`
  max-width: 300px;
`;

function Properties({ objectMetadata }: Props) {
  return (
    <div>
      <Table id="object-details-table">
        <T.Body>
          <T.Row>
            <T.Key> Name </T.Key>
            <T.Value> {objectMetadata.objectKey} </T.Value>
          </T.Row>
          <T.Row hidden={!objectMetadata.versionId}>
            <T.Key> Version ID </T.Key>
            <TruncatedValue copiable>
              <MiddleEllipsis
                text={objectMetadata.versionId}
                trailingCharCount={7}
                tooltipWidth="16rem"
              />
            </TruncatedValue>
            <T.ExtraCell>
              {' '}
              <Clipboard text={objectMetadata.versionId} />{' '}
            </T.ExtraCell>
          </T.Row>
          <T.Row>
            <T.Key> Size </T.Key>
            <T.Value>
              {' '}
              <PrettyBytes bytes={objectMetadata.contentLength} />{' '}
            </T.Value>
          </T.Row>
          <T.Row>
            <T.Key> Modified On </T.Key>
            <T.Value>
              {' '}
              {formatShortDate(new Date(objectMetadata.lastModified))}{' '}
            </T.Value>
          </T.Row>
          <T.Row>
            <T.Key> ETag </T.Key>
            <T.Value copiable>{objectMetadata.eTag}</T.Value>
            <T.ExtraCell>
              {' '}
              <Clipboard text={objectMetadata.eTag} />{' '}
            </T.ExtraCell>
          </T.Row>
          <T.Row>
            <T.Key> Lock </T.Key>
            <T.Value>
              {objectMetadata.lockStatus === 'LOCKED' && <>Locked ({objectMetadata.objectRetention.mode.toLowerCase()})<br />until {objectMetadata.objectRetention.retainUntilDate}</>}
              {objectMetadata.lockStatus === 'RELEASED' && `Released - since ${objectMetadata.objectRetention.retainUntilDate}`}
              {objectMetadata.lockStatus === 'NONE' && 'No retention'}
            </T.Value>
          </T.Row>
        </T.Body>
      </Table>
    </div>
  );
}

export default Properties;
