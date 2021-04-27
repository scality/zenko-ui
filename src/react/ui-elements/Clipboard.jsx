// @flow
import React, { useEffect, useState } from 'react';
import { Tooltip } from '@scality/core-ui';
import styled from 'styled-components';

const Container = styled.div`
    cursor: pointer;
`;

export const IconSuccess = styled.i`
    color: ${props => props.theme.brand.success};
`;

export const IconCopy = styled.i`
    color: ${props => props.theme.brand.textSecondary};
    display: ${props => props.hidden ? 'none': 'block'};
`;

export const Clipboard = ({ text }: { text: ?string }) => {
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCopySuccess(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, [copySuccess]);

    const copyToClipboard = () => {
        if (!navigator || !navigator.clipboard) {
            return;
        }
        navigator.clipboard.writeText(text || '');
        setCopySuccess(true);
    };

    return <Container>
        {
            copySuccess ?
                <Tooltip overlay= "Copied!" placement="right" >
                    <IconSuccess className='fas fa-check'></IconSuccess>
                </Tooltip>:
                <IconCopy hidden={!navigator || !navigator.clipboard} className='far fa-clone' onClick={copyToClipboard}></IconCopy>
        }
    </Container>;
};
