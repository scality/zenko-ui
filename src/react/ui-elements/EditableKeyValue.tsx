import { Button } from '@scality/core-ui/dist/next';
import Input from './Input';
import React, { useCallback, useMemo } from 'react';
import { isEmptyItem } from '../utils';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
export const Container = styled.div`
  flex: 1;
`;
export const Items = styled.div`
  display: flex;
  flex-direction: column;
`;
export const Item = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-bottom: ${spacing.sp4};
  // For Select we adjust width of the sc-scrollbar div because in CoreUI.SelectV2
  // the first parent is .sc-scrollbar
  .sc-scrollbar {
    flex: 0 ${(props) => (props.isShrink ? '36%' : '53%')};
    width: ${(props) => (props.isShrink ? '36%' : '53%')};
    min-width: ${(props) => (props.isShrink ? '36%' : '53%')};
  }
`;
export const Header = styled.div`
  display: flex;
  flex-direction: row;
  width: calc(100% - 100px);
  margin-bottom: ${spacing.sp8};
`;
export const HeaderKey = styled.div`
  flex: 0 60%;
  padding-left: ${spacing.sp8};
`;
export const HeaderValue = styled.div`
  flex: 0 40%;
  padding-left: ${spacing.sp8};
`;
export const HeaderKeyTag = styled.div`
  flex: 0 50%;
  padding-left: ${spacing.sp8};
`;
export const HeaderValueTag = styled.div`
  flex: 0 50%;
  padding-left: ${spacing.sp8};
`;
export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;

  margin-bottom: ${spacing.sp4};
`;
export const Buttons = styled.div`
  display: flex;
  flex: 0 0 100px;
  & > * {
    margin-right: ${spacing.sp2};
  }
`;
export const Inputs = styled.div`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: space-between;

  margin-right: ${spacing.sp4};
`;
// NOTE: use for x-amz-meta extra key value
export const InputExtraKey = styled(Input)`
  flex: 0 28%;
  width: 28%;
  min-width: 28%;
`;
export const InputValue = styled(Input)`
  flex: 0 ${(props) => (props.isShrink ? '22%' : '39%')};
  width: ${(props) => (props.isShrink ? '22%' : '39%')};
  min-width: ${(props) => (props.isShrink ? '22%' : '39%')};
  background-color: ${(props) => props.theme.brand.backgroundLevel1};
`;
export const InputTag = styled(Input)`
  flex: 1 40%;
  &:first-child {
    margin-right: ${spacing.sp4};
  }
  width: 40%;
  min-width: 40%;
`;
export const Char = styled.div`
  flex: 0 2%;
  width: 2%;
  min-width: 2%;
  text-align: center;
`;
const CustomButton = styled(Button)`
  ${(props) =>
    !props.isVisible
      ? `
        display: none;
    `
      : ''}
`;
type AddButtonProps = {
  index: number;
  items: Array<any>;
  insertEntry: () => void;
  disabled?: boolean;
};
export const AddButton = ({
  index,
  items,
  insertEntry,
  disabled,
}: AddButtonProps) => {
  const itemsLength = items.length;
  const itemsIndex = items[index];
  const itemsIndexKey = items[index].key;
  const itemsIndexValue = items[index].value;

  const isDisabled = useMemo(() => {
    if (itemsIndex && (itemsIndexKey === '' || itemsIndexValue === '')) {
      return true;
    }
    return disabled || false;
  }, [itemsIndex, itemsIndexKey, itemsIndexValue, disabled]);

  const isVisible = useMemo(() => {
    return !(itemsLength > 0 && index !== itemsLength - 1);
  }, [itemsLength, index]);

  const onClickFn = useCallback(() => {
    if (!(itemsLength > 0 && index !== itemsLength - 1)) {
      insertEntry();
    }
  }, [itemsLength, index]);

  return (
    <>
      {!isVisible && <SpacedBox ml={16} />}
      <CustomButton
        isVisible={isVisible}
        type="button"
        variant="secondary"
        disabled={isDisabled}
        name={`addbtn${index}`}
        id={`addbtn${index}`}
        onClick={onClickFn}
        aria-label="Add"
        tooltip={{
          overlay: 'Add',
          placement: 'top',
        }}
        icon={<i className="fa fa-plus-square" />}
      />
    </>
  );
};
type SubButtonProps = {
  index: number;
  items: Array<any>;
  deleteEntry: (arg0: number) => void;
  disabled?: boolean;
};
export const SubButton = ({
  index,
  items,
  deleteEntry,
  disabled,
}: SubButtonProps) => {
  let isDisabled = disabled || false;

  if (items.length === 1 && isEmptyItem(items[0])) {
    isDisabled = true;
  }

  return (
    <Button
      variant="danger"
      disabled={isDisabled}
      type="button"
      aria-label="Remove"
      name={`delbtn${index}`}
      id={`delbtn${index}`}
      onClick={() => deleteEntry(index)}
      tooltip={{
        overlay: 'Remove',
        placement: 'top',
      }}
      icon={<i className="fa fa-minus-square" />}
    />
  );
};
