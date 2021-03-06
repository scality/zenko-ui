//@flow
import React, { useCallback, useEffect, useState } from 'react';
import { Tooltip } from '@scality/core-ui';
import styled from 'styled-components';

const StyledMiddleEllipsis = styled.div`
  word-break: keep-all;
  overflow-wrap: normal;
`;

const MiddleEllipsisContainer = styled.div`
    .sc-tooltip {
        display: block;
    }
`;

const MiddleEllipsisText = styled.span`
    opacity: ${props => props.calculationDone ? '1' : '0'};
`;

export const ellipseNode = (
    parentNode: HTMLElement,
    childNode: HTMLElement,
    originalText: string,
    ellipsisText: string = '...',
    trailingCharCount: number = 7,
): boolean => {
    if (parentNode && childNode) {
        const childWidth = childNode.offsetWidth;
        const containerWidth = parentNode.offsetWidth;
        const txtWidth = childNode.offsetWidth;
        const targetWidth = childWidth > txtWidth ? childWidth : txtWidth;

        if (targetWidth > containerWidth) {
            const txtContent = childNode.textContent;
            const avgLetterSize = txtWidth / txtContent.length;
            const txtWidthEllipsisInPX = ellipsisText.length * avgLetterSize;
            const trailingCharsInPX = trailingCharCount * avgLetterSize;
            const leftWidthInPX = containerWidth - (txtWidthEllipsisInPX + trailingCharsInPX);
            const leftWidthInCh = leftWidthInPX / avgLetterSize;

            const endLeft = Math.floor(ellipsisText.length + leftWidthInCh);
            const startRight = Math.ceil(-trailingCharCount);

            childNode.setAttribute('data-original', originalText);
            childNode.textContent = txtContent.substr(0, endLeft) + ellipsisText + txtContent.substr(startRight);
            return true;
        }
    }
    return false;
};

type Props = {
    text: string;
    trailingCharCount?: number;
    ellipsisText?: string;
    tooltipPlacement?: string;
    width?: number;
};

const MiddleEllipsis = ({
    text,
    trailingCharCount = 7,
    ellipsisText = '...',
    tooltipPlacement = 'bottom',
    width,
}: Props) => {
    const [node, setNode] = useState(null);
    const [isEllipsized, setIsEllipsized] = useState(true);
    const [calculationDone, setCalculationDone] = useState(false);

    const prepEllipse = useCallback(() => {
        if (node && node.childNodes && node.childNodes[0]) {
            const parent = node.parentNode;
            const child = node.childNodes[0];

            // (Re)-set text back to data-original-text if it exists.
            if (child.hasAttribute('data-original')) {
                child.textContent = child.getAttribute('data-original');
            }

            setIsEllipsized(ellipseNode(
                node.offsetWidth > parent.offsetWidth ? parent : node,
                child,
                text,
                ellipsisText,
                trailingCharCount,
            ));
            setCalculationDone(true);
        }
    }, [ellipsisText, node, text, trailingCharCount]);

    useEffect(() => {
        prepEllipse();
        window.addEventListener('resize', prepEllipse);
        return () => {
            window.removeEventListener('resize', prepEllipse);
        };
    }, [prepEllipse]);

    useEffect(() => {
        prepEllipse();
    }, [prepEllipse, width]);

    const ref = useCallback((node) => {
        if (node)
            setNode(node);
    }, []);

    const content = () => (
        <Tooltip overlay={ text } placement={ tooltipPlacement }>
            <StyledMiddleEllipsis ref={ ref }>
                <MiddleEllipsisText
                    calculationDone={calculationDone}
                    className="middle-ellipsis-text"
                >
                    { text }
                </MiddleEllipsisText>
            </StyledMiddleEllipsis>
        </Tooltip>
    );

    return <MiddleEllipsisContainer>
        { isEllipsized ? content() : content().props.children }
    </MiddleEllipsisContainer>;
};

export default MiddleEllipsis;
