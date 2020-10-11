// @flow
import { Button } from '@scality/core-ui';
import React from 'react';
import styled from 'styled-components';

export const Pairs = styled.div`
    display: flex;
    flex-direction: column;
`;

export const Pair = styled.div`
    display: flex;
    flex-direction: row;

    margin-bottom: 5px;
`;

export const Key = styled.div`
    flex: 0 0 auto;

    margin-right: 5px;
    min-width: ${props => props.isShrink ? '150px' : '240px'};
`;

// NOTE: use for x-amz-meta extra key value
export const ExtraKey = styled.div`
    flex: 0 0 auto;

    margin-right: 5px;
    width: 127px;
`;

export const Value = styled.div`
    flex: 0 0 auto;
    margin-right: 10px;

    width: ${props => props.isShrink ? '127px' : 'initial'};
`;

export const Row = styled.div`
    flex: 0 0 auto;
    margin-right: 5px;
`;

type AddButtonProps = {
    index: number,
    pairs: Array<{ key: string, value: string}>,
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
        <Row>
            <Button
                variant="info"
                title="Add"
                disabled={isDisabled}
                name="addbtn"
                id="addbtn"
                onClick={onClickFn}
                icon={<i className="fa fa-plus-square" />}
            />
        </Row>
    );
};

type SubButtonProps = {
    index: number,
    pairs: Array<{ key: string, value: string}>,
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
        <Row>
            <Button
                variant="danger"
                title="Remove"
                disabled={isDisabled}
                name={`delbtn${index}`}
                id={`delbtn${index}`}
                onClick={onClickFn}
                icon={<i className="fa fa-minus-square" />}
            />
        </Row>
    );
};
