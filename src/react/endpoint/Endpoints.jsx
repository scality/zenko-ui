// @flow
import * as L from '../ui-elements/ListLayout';
import React, { useMemo } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { EmptyStateContainer } from '../ui-elements/Container';
import { Warning } from '../ui-elements/Warning';
import { push } from 'connected-react-router';

const Endpoints = () => {

    return (
        <L.Container>
            ENDPOINTS...
        </L.Container>
    );
};

export default Endpoints;
