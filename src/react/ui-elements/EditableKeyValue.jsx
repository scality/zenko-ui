// @flow
import { Button } from '@scality/core-ui';
import Input from './Input';
import React from 'react';
import styled from 'styled-components';

export const Pairs = styled.div`
    display: flex;
    flex-direction: column;
`;

export const Pair = styled.div`
    display:flex;
    flex-direction:row;
    align-items: baseline;

    margin-bottom: 5px;

    // For Select we ajust width here becase in CoreUI.Select
    // props are not applied to the first parent element.
    .sc-select-container{
        flex: 0 ${props => props.isShrink ? '39%' : '59%'};
        width: ${props => props.isShrink ? '39%' : '59%'};
    }
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
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;

    margin-right: 5px;
`;

// export const InputKey = styled(Select)`
//     flex: 0 ${props => props.isShrink ? '39%' : '59%'};
//     width: ${props => props.isShrink ? '39%' : '59%'};
// `;

// NOTE: use for x-amz-meta extra key value
export const InputExtraKey = styled(Input)`
    flex: 0 28%;
    width: 28%;
`;

export const InputValue = styled(Input)`
    flex: 0 ${props => props.isShrink ? '29%' : '39%'};
    width: ${props => props.isShrink ? '29%' : '39%'};
`;

export const Char = styled.div`
    flex: 0 2%;
    width: 2%;
    text-align: center;
`;

type AddButtonProps = {
    index: number,
    pairs: Array<any>,
    insertEntry: () => void,
};
export const AddButton = ({ index, pairs, insertEntry }: AddButtonProps) => {
    // let isVisible = 'invisible';
    let isDisabled = false;
    let onClickFn = () => {};
    if (index === pairs.length - 1 || pairs.length === 0) {
        // isVisible = 'visible';
        onClickFn = () => insertEntry();
    }
    if (pairs[index] && (pairs[index].key === '' || pairs[index].value === '')) {
        isDisabled = true;
        onClickFn = () => {};
    }

    return (
        <Button
            variant="info"
            title="Add"
            disabled={isDisabled}
            name="addbtn"
            id="addbtn"
            onClick={onClickFn}
            icon={<i className="fa fa-plus-square" />}
        />
    );
};

type SubButtonProps = {
    index: number,
    pairs: Array<any>,
    deleteEntry: (number) => void,
};
export const SubButton = ({ index, pairs, deleteEntry }: SubButtonProps) => {
    let isDisabled = true;
    let onClickFn = () => {};
    if (pairs.length > 1) {
        isDisabled = false;
        onClickFn = () => deleteEntry(index);
    }
    return (
        <Button
            variant="danger"
            title="Remove"
            disabled={isDisabled}
            name={`delbtn${index}`}
            id={`delbtn${index}`}
            onClick={onClickFn}
            icon={<i className="fa fa-minus-square" />}
        />
    );
};
