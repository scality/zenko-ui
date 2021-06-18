// @flow

import React from 'react';
import { Tooltip } from '@scality/core-ui';
import styled from 'styled-components';

type Props = {
    text: ?string,
    trailingCharCount?: number,
};

const TextStart = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
`;

const TextEnd = styled.div`
    white-space: nowrap;
    flex-basis: content;
    flex-grow: 0;
    flex-shrink: 0;
`;

const TruncatedContainer = styled.div`
    & > div {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: flex-start;
    }
`;

const TruncatedText = ({
    text,
    trailingCharCount = 7,
}: Props) => {

    if (!text)
        return null;

    const shrinkString = (originStr, trailingCharCount) => {
        if (originStr.length > trailingCharCount) {
            const front = originStr.substr(0, originStr.length - trailingCharCount);
            const end = originStr.substr(-trailingCharCount);
            return [front, end];
        }
        return [originStr, null];
    };

    const [front, end] = shrinkString(text, trailingCharCount);

    const content = () => (
        <Tooltip overlay={ text } placement='bottom'>
            <TextStart className='truncated-start'>{ front }</TextStart>
            { end && <TextEnd className='truncated-end'>{ end }</TextEnd> }
        </Tooltip>
    );

    return <TruncatedContainer className='truncated-container'>
        { end ? content() : content().props.children }
    </TruncatedContainer>;
};

export default TruncatedText;
