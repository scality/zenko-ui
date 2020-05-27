import {LoaderContainer} from './Container';
import { Loader as LoaderCoreUI } from '@scality/core-ui';
import React from 'react';

const Loader = (props) => (
    <LoaderContainer>
        <LoaderCoreUI size="massive">{props.children}</LoaderCoreUI>
    </LoaderContainer>
);

export default Loader;
