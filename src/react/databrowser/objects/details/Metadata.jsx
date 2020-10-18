// @flow
import { AddButton, Buttons, Char, Footer, Header, HeaderKey, HeaderValue, InputExtraKey, InputValue, Inputs, Item, Items, SubButton } from '../../../ui-elements/EditableKeyValue';
import { Button, Select } from '@scality/core-ui';
import type { MetadataItems, ObjectMetadata } from '../../../../types/s3';
import React, { useEffect, useMemo, useState } from 'react';
import { isEmptyItem } from '../../../utils';
import { putObjectMetadata } from '../../../actions';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const EMPTY_ITEM = { key: '', value: '' };

const OPTIONS = ['cache-control', 'content-disposition', 'content-encoding',
    'content-language', 'content-type', 'expires', 'website-redirect-location',
    'x-amz-meta'];

const META_WORD = 'x-amz-meta';

const TableContainer = styled.div`
    overflow-y: auto;
    height: calc(100vh - 395px);
    margin-bottom: 5px;
`;

const selectOptions = OPTIONS.map(o => ({
    value: o,
    label: o,
    disabled: false,
}));

const isMetaWord = word => word === META_WORD;

const convertToAWSMetadata = (items: MetadataItems) => {
    const result = {};
    for (let i = 0; i < items.length; i++) {
        if (isEmptyItem(items[i])) {
            continue;
        }
        if (isMetaWord(items[i].key)) {
            const metaKey = items[i].metaKey || '';
            result[`${items[i].key}-${metaKey}`] = items[i].value;
        } else {
            result[items[i].key] = items[i].value;
        }
    }
    return result;
};

type Props = {
    objectMetadata: ObjectMetadata,
};
function Properties({ objectMetadata }: Props) {
    const dispatch = useDispatch();
    const { bucketName, objectKey, metadata, prefixWithSlash } = objectMetadata;
    const [items, setItems] = useState([EMPTY_ITEM]);

    useEffect(() => {
        if (metadata.length > 0) {
            setItems(metadata);
        } else {
            setItems([EMPTY_ITEM]);
        }
    }, [metadata]);

    const options = useMemo(() => selectOptions.filter(option =>
        isMetaWord(option.value) ||
        !items.find(item => item.key === option.value)
    ), [items]);

    // NOTE: invalid if at least one items is missing key or value but not both.
    const isValidItems = useMemo(() => {
        return !items.find(i => (i.key === '' && i.value !== '') || (i.value === '' && i.key !== ''));
    }, [items]);

    const handleKeyChange = (index: number) => (v) => {
        const temp = [...items];
        temp[index] = { key: v.value, value: '' };
        setItems(temp);
    };

    const handleMetaKeyChange = (index: number) => (e: SyntheticInputEvent<HTMLInputElement>) => {
        const temp = [...items];
        if (!isMetaWord(temp[index].key)) {
            return;
        }
        temp[index] = { ...temp[index], metaKey: e.target.value };
        setItems(temp);
    };

    const handleValueChange = (index: number) => (e: SyntheticInputEvent<HTMLInputElement>) => {
        const temp = [...items];
        temp[index] = { ...temp[index], value: e.target.value };
        setItems(temp);
    };

    const insertEntry = () => {
        const temp = [...items];
        temp.push(EMPTY_ITEM);
        setItems(temp);
    };

    const deleteEntry = (index: number) => {
        let temp = [EMPTY_ITEM];
        if (items.length > 1) {
            temp = [...items];
            temp.splice(index, 1);
        }
        setItems(temp);
    };

    const save = () => {
        if (!isValidItems) {
            return;
        }
        const metadata = convertToAWSMetadata(items);
        dispatch(putObjectMetadata(bucketName, prefixWithSlash, objectKey, metadata));
    };

    return (
        <div>
            <Header>
                <HeaderKey> Key </HeaderKey>
                <HeaderValue> Value </HeaderValue>
            </Header>
            <TableContainer>
                <Items>
                    {
                        items.map((p, i) => {
                            const isShrink = isMetaWord(p.key);
                            return <Item isShrink={isShrink} key={i}>
                                <Inputs>
                                    <Select
                                        id='mdKeyType'
                                        name='mdKeyType'
                                        options={options}
                                        onChange={handleKeyChange(i)}
                                        isDisabled={false}
                                        value={p.key ? selectOptions.find(l => l.value === p.key): ''}
                                    />
                                    {
                                        isShrink && <Char>-</Char>
                                    }
                                    {
                                        isShrink && <InputExtraKey value={p.metaKey || ''} onChange={handleMetaKeyChange(i)}/>
                                    }
                                    <Char>:</Char>
                                    <InputValue isShrink={isShrink} value={p.value} onChange={handleValueChange(i)} autoComplete='off'/>
                                </Inputs>
                                <Buttons>
                                    <SubButton index={i} items={items} deleteEntry={deleteEntry}/>
                                    <AddButton index={i} items={items} insertEntry={insertEntry}/>
                                </Buttons>
                            </Item>;
                        })
                    }
                </Items>
            </TableContainer>
            <Footer>
                <Button
                    variant='info'
                    text='Save'
                    disabled={!isValidItems}
                    onClick={save}
                    icon={<i className='fas fa-save' />}
                />
            </Footer>
        </div>
    );
}

export default Properties;
