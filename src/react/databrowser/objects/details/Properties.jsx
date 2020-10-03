// @noflow

import Table, * as T from '../../../ui-elements/TableKeyValue';
import { formatBytes, formatDate } from '../../../utils';
import { Clipboard } from '../../../ui-elements/Clipboard';
import type { ObjectMetadata } from '../../../../types/s3';
import React from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
    display: block;
    overflow-y: auto;
    height: calc(100vh - 340px);
    width: fit-content;
    margin: 15px 0 0 30px;
`;

type Props = {
    objectMetadata: ObjectMetadata,
};

function Properties({ objectMetadata }: Props) {
    return (
        <TableContainer>
            <Table id='object-details-table'>
                <T.Body>
                    <T.Row>
                        <T.Key> Name </T.Key>
                        <T.Value> {objectMetadata.objectKey} </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key> Size </T.Key>
                        <T.Value> {formatBytes(objectMetadata.contentLength)} </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key> Modified On </T.Key>
                        <T.Value> {formatDate(new Date(objectMetadata.lastModified))} </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key> ETag </T.Key>
                        <T.Value> {objectMetadata.eTag} </T.Value>
                        <T.ExtraCell> <Clipboard text={objectMetadata.eTag}/> </T.ExtraCell>
                    </T.Row>
                </T.Body>
            </Table>
        </TableContainer>
    );
}

export default Properties;
