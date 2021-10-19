import React, { useMemo } from 'react';
import { matchPath, useLocation, useParams } from 'react-router-dom';
import { Button } from '@scality/core-ui/dist/next';
import { listBuckets } from '../actions/s3bucket';
import { listObjects } from '../actions/s3object';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

export const ButtonsContainer = styled.div`
    height: 100%;
    display: flex;
    align-items: center;
`;

export function RefreshButton() {
    const { bucketName } = useParams();
    const { pathname } = useLocation();
    const dispatch = useDispatch();
    const isBrowsingObjects = !!matchPath(pathname, '/buckets/:bucketName/objects');
    const prefixWithSlash = useMemo(() => {
        const splitedPath = pathname.split('objects/');
        if (splitedPath.length < 2 || splitedPath[1].length === 0) {
            return '';
        } else {
            const prefix = splitedPath[1].slice(-1) === '/' ? splitedPath[1] : `${splitedPath[1]}/`;
            return prefix;
        }
    }, [ pathname ]);

    const handleRefreshClick = () => {
        if (isBrowsingObjects) {
            dispatch(listObjects(bucketName, prefixWithSlash));
        } else {
            dispatch(listBuckets());
        }
    };

    return <Button icon={<i className="fas fa-sync" />} onClick={handleRefreshClick} />;
}

export default function Buttons() {
    return <ButtonsContainer>
        <RefreshButton />
    </ButtonsContainer>;
}
