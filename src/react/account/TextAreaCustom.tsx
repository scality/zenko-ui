import React, { useRef, forwardRef } from 'react';
import styled from 'styled-components';

type Props = {
  rows?: number;
  cols?: number;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (e: React.SyntheticEvent<HTMLInputElement>) => void;
};
type RefType = HTMLTextAreaElement | null;

const passRef = (ref: React.ForwardedRef<RefType>,  node: HTMLTextAreaElement | null) => {
  if (ref) {
    if (typeof ref === 'function' ) {
      ref(node);
    } else {
      ref.current = node;
    }
  }
};

const TextAreaContainer = styled.textarea`
  
  border-radius: 4px;
  // ...rest styles
`;

const TextArea = ({ rows = 3,
                    cols = 20,
                    ...rest
                   } : Props,
                   ref: React.ForwardedRef<RefType>) => {

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <TextAreaContainer
      className="sc-textarea"
      rows={rows}
      cols={cols}
      {...rest}
      ref={(node) => {
        textareaRef.current = node;
        passRef(ref, node);
      }}
    />
  );
};

const TextAreaCustom = forwardRef<RefType, Props>(TextArea);

export default TextAreaCustom;