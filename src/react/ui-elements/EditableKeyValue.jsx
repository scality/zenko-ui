// @flow
import { Button } from '@scality/core-ui';
import Input from './Input';
import React from 'react';
import { isEmptyItem } from '../utils';
import styled from 'styled-components';

export const Container = styled.div`
    flex: 1;
`;

export const Items = styled.div`
    display: flex;
    flex-direction: column;
`;

export const Item = styled.div`
    display:flex;
    flex-direction:row;
    align-items: center;

    margin-bottom: 5px;

    // For Select we ajust width here becase in CoreUI.Select
    // props are not applied to the first parent element.
    .sc-select-container{
        flex: 0 ${props => props.isShrink ? '39%' : '59%'};
        width: ${props => props.isShrink ? '39%' : '59%'};
        min-width: ${props => props.isShrink ? '39%' : '59%'};
    }
`;

export const Header = styled.div`
    display:flex;
    flex-direction:row;
    width: calc(100% - 100px);
    margin-bottom: 7px;
`;

export const HeaderKey = styled.div`
    flex: 0 60%;
    padding-left: 10px;
`;

export const HeaderValue = styled.div`
    flex: 0 40%;
    padding-left: 10px;
`;

export const HeaderKeyTag = styled.div`
    flex: 0 50%;
    padding-left: 10px;
`;

export const HeaderValueTag = styled.div`
    flex: 0 50%;
    padding-left: 10px;
`;

export const Footer = styled.div`
    display: flex;
    justify-content: flex-end;

    margin-bottom: 5px;
`;

export const Buttons = styled.div`
    display: flex;
    flex: 0 0 100px;
    & > * {
        margin-right: 2px;
    }
`;

export const Inputs = styled.div`
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: space-between;

    margin-right: 5px;
`;

// NOTE: use for x-amz-meta extra key value
export const InputExtraKey = styled(Input)`
    flex: 0 28%;
    width: 28%;
    min-width: 28%;
`;

export const InputValue = styled(Input)`
    flex: 0 ${props => props.isShrink ? '29%' : '39%'};
    width: ${props => props.isShrink ? '29%' : '39%'};
    min-width: ${props => props.isShrink ? '29%' : '39%'};
`;

export const InputTag = styled(Input)`
    flex: 1 50%;
    &:first-child {
        margin-right: 5px;
    }
    width: 50%;
    min-width: 45%;
`;

export const Char = styled.div`
    flex: 0 2%;
    width: 2%;
    min-width: 2%;
    text-align: center;
`;

const CustomButton = styled(Button)`
    display: ${props => props.isVisible ? 'block' : 'none'};
`;

type AddButtonProps = {
    index: number,
    items: Array<any>,
    insertEntry: () => void,
    disabled?: boolean,
};
export const AddButton = ({ index, items, insertEntry, disabled }: AddButtonProps) => {
    let isVisible = true;
    let isDisabled = disabled || false;
    let onClickFn = () => insertEntry();

    if ((items.length > 0 && index !== items.length - 1)) {
        isVisible = false;
        onClickFn = () => {};
    }

    if (items[index] && (items[index].key === '' || items[index].value === '')) {
        isDisabled = true;
        onClickFn = () => {};
    }

    return (
        <CustomButton
            isVisible={isVisible}
            variant="info"
            title="Add"
            disabled={isDisabled}
            name={`addbtn${index}`}
            id={`addbtn${index}`}
            onClick={onClickFn}
            icon={<i className="fa fa-plus-square" />}
        />
    );
};

type SubButtonProps = {
    index: number,
    items: Array<any>,
    deleteEntry: (number) => void,
    disabled?: boolean,
};
export const SubButton = ({ index, items, deleteEntry, disabled }: SubButtonProps) => {
    let isDisabled = disabled || false;
    if (items.length === 1 && isEmptyItem(items[0])) {
        isDisabled = true;
    }
    return (
        <Button
            variant="danger"
            title="Remove"
            disabled={isDisabled}
            name={`delbtn${index}`}
            id={`delbtn${index}`}
            onClick={() => deleteEntry(index)}
            icon={<i className="fa fa-minus-square" />}
        />
    );
};
