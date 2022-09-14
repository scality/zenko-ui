import { useCallback, useEffect, useState } from 'react';
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
const MiddleEllipsisText = styled.span<{ calculationDone?: boolean }>`
  opacity: ${(props) => (props.calculationDone ? '1' : '0')};
`;
export const ellipseNode = (
  parentNode: HTMLElement,
  childNode: HTMLElement,
  originalText: string,
  ellipsisText = '...',
  trailingCharCount = 7,
): boolean => {
  if (parentNode && childNode && originalText) {
    const childWidth = childNode.offsetWidth;
    const containerWidth = parentNode.offsetWidth;

    if (childWidth > containerWidth && originalText) {
      const txtContent = originalText;
      const avgLetterSize = childWidth / txtContent.length;
      const txtWidthEllipsisInPX = ellipsisText.length * avgLetterSize;
      const trailingCharsInPX = trailingCharCount * avgLetterSize;
      const leftWidthInPX =
        containerWidth - (txtWidthEllipsisInPX + trailingCharsInPX);
      // As we do not know the value of "avgLetterSize" (because the letters are not all the same size)
      // then we remove 2 letters so that we can't have an overflow.
      const leftWidthInCh = leftWidthInPX / avgLetterSize - 2;
      const endLeft = Math.floor(ellipsisText.length + leftWidthInCh);
      const startRight = Math.ceil(-trailingCharCount);
      childNode.setAttribute('data-original', originalText);
      childNode.textContent =
        txtContent.substr(0, endLeft) +
        ellipsisText +
        txtContent.substr(startRight);
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
  tooltipWidth?: string;
};

const MiddleEllipsis = ({
  text,
  trailingCharCount = 7,
  ellipsisText = '...',
  tooltipPlacement = 'bottom',
  width,
  tooltipWidth,
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

      setIsEllipsized(
        ellipseNode(
          node.offsetWidth > parent.offsetWidth ? parent : node,
          child,
          text,
          ellipsisText,
          trailingCharCount,
        ),
      );
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
    if (node) setNode(node);
  }, []);

  const content = () => (
    <Tooltip
      overlay={text}
      placement={tooltipPlacement}
      overlayStyle={{
        width: tooltipWidth,
      }}
    >
      <StyledMiddleEllipsis ref={ref}>
        <MiddleEllipsisText
          calculationDone={calculationDone}
          className="middle-ellipsis-text"
        >
          {text}
        </MiddleEllipsisText>
      </StyledMiddleEllipsis>
    </Tooltip>
  );

  return (
    <MiddleEllipsisContainer>
      {isEllipsized ? content() : content().props.children}
    </MiddleEllipsisContainer>
  );
};

export default MiddleEllipsis;
