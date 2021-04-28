// @flow
import React, { useState } from 'react';
import type { Node } from 'react';
import styled from 'styled-components';


const HideContainer = styled.div`
    display: flex;
`;

const HideValue = styled.div`
`;

const HideAction = styled.div`
    margin-left: 8px;
    color: ${props => props.theme.brand.textLink};
    text-decoration: none;
    cursor: pointer;
    &:hover{
        text-decoration: underline;
    }
`;


export function HideCredential({ children }: { children: Node }) {
    const [shown, setShown] = useState(false);
    return <HideContainer>
        <HideValue>
            { shown ? children : '*********' }
        </HideValue>
        <HideAction onClick={() => setShown(!shown)}>
            { shown ? 'Hide' : 'Show' }
        </HideAction>
    </HideContainer>;
}


function Hide({ isHidden, children }: { isHidden: boolean, children: Node }){
    if (isHidden) {
        return null;
    }
    return children;
}

export default Hide;
