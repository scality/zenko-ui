import { Tooltip } from '@scality/core-ui';
import { spacing } from '@scality/core-ui/dist/spacing';
import { useId } from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

type RadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  disabledReason?: ReactNode;
};

type RadioGroupProps = {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  direction?: 'horizontal' | 'vertical';
  disabled?: boolean;
};

const RadioContainer = styled.div<{ $direction: 'horizontal' | 'vertical' }>`
  display: flex;
  flex-direction: ${(props) => (props.$direction === 'horizontal' ? 'row' : 'column')};
  gap: ${spacing.r8};
`;

const RadioWrapper = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${spacing.r8};
  cursor: pointer;
  padding: ${spacing.r4};
  padding-left: 0;
  padding-bottom: ${spacing.r8};
  border-radius: 4px;

  &[data-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

const RadioInput = styled.input`
  margin-top: 4px;
  margin-left: 0;
  cursor: inherit;
  width: ${spacing.r14};
  height: ${spacing.r14};
  position: relative;

  &:checked {
    appearance: none;
    width: ${spacing.r14};
    height: ${spacing.r14};
    border-radius: 50%;
    outline: none;
    position: relative;
    box-shadow: 0 0 0 1px rgba(74, 144, 226, 1);
    background-color: #ffffff;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${spacing.r8};
      height: ${spacing.r8};
      background-color: rgba(74, 144, 226, 1);
      border-radius: 50%;
      display: block;
    }
  }

  &:checked:disabled {
    appearance: none;
    width: ${spacing.r14};
    height: ${spacing.r14};
    border-radius: 50%;
    outline: none;
    position: relative;
    box-shadow: 0 0 0 1px rgba(74, 144, 226, 0.4);
    background-color: #f0f8ff;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${spacing.r8};
      height: ${spacing.r8};
      background-color: rgba(74, 144, 226, 0.7);
      border-radius: 50%;
      display: block;
    }
  }
`;

const RadioContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.r4};
`;

const RadioLabel = styled.label`
  color: ${(props) => props.theme.textPrimary};
  font-weight: 500;
`;

const RadioDescription = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: 0.875rem;
`;

export const RadioGroup = ({
  options,
  value,
  onChange,
  name,
  direction = 'vertical',
  disabled = false,
}: RadioGroupProps) => {
  const groupId = useId();
  const groupName = name || groupId;

  return (
    <RadioContainer $direction={direction}>
      {options.map((option) => {
        const optionId = `${groupName}-${option.value}`;

        const radioInputAndContent = (
          <>
            <RadioInput
              type="radio"
              id={optionId}
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled || option.disabled}
            />
            <RadioContent>
              <RadioLabel htmlFor={optionId}>{option.label}</RadioLabel>
              {option.description && <RadioDescription>{option.description}</RadioDescription>}
            </RadioContent>
          </>
        );

        return option.disabled && option.disabledReason ? (
          <Tooltip key={option.value} overlay={option.disabledReason}>
            <RadioWrapper data-disabled={disabled || option.disabled}>{radioInputAndContent}</RadioWrapper>
          </Tooltip>
        ) : (
          <RadioWrapper key={option.value} data-disabled={disabled || option.disabled}>
            {radioInputAndContent}
          </RadioWrapper>
        );
      })}
    </RadioContainer>
  );
};
