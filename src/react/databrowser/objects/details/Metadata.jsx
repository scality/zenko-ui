// @flow
import { AddButton, Buttons, Char, InputExtraKey, InputValue, Inputs, Item, Items, SubButton } from '../../../ui-elements/EditableKeyValue';
import { Button, Select } from '@scality/core-ui';
import type { MetadataItems, ObjectMetadata } from '../../../../types/s3';
import React, { useEffect, useMemo, useState } from 'react';
import { putObjectMetadata } from '../../../actions';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const TableContainer = styled.div`
    overflow-y: auto;
    height: calc(100vh - 360px);
`;
const HeadContainer = styled.div`
    display: flex;
    justify-content: flex-end;

    margin-bottom: 5px;
`;

const selectOptions = [
    {
        value: 'cache-control',
        label: 'cache-control',
        disabled: false,
    },
    {
        value: 'content-disposition',
        label: 'content-disposition',
        disabled: false,
    },
    {
        value: 'content-encoding',
        label: 'content-encoding',
        disabled: false,
    },
    {
        value: 'content-language',
        label: 'content-language',
        disabled: false,
    },
    {
        value: 'content-type',
        label: 'content-type',
        disabled: false,
    },
    {
        value: 'expires',
        label: 'expires',
        disabled: false,
    },
    {
        value: 'website-redirect-location',
        label: 'website-redirect-location',
        disabled: false,
    },
    {
        value: 'x-amz-meta',
        label: 'x-amz-meta',
        disabled: false,
    },
];

const makeMetadata = (arr: MetadataItems) => {
    const result = {};
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].key === 'x-amz-meta') {
            const metaKey: string = arr[i].metaKey ? arr[i].metaKey : '';
            result[`${arr[i].key}-${metaKey}`] = arr[i].value;
        } else {
            result[arr[i].key] = arr[i].value;
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
    const [items, setItems] = useState([{ key: '', value: '', metaKey: '' }]);

    useEffect(() => {
        if (metadata.length > 0) {
            setItems(metadata);
        } else {
            setItems([{ key: '', value: '', metaKey: '' }]);
        }
   }, [metadata])

    const isValidItems = useMemo(() => {
        return !items.find(i => i.key === '' || i.value === '');
    }, [items]);

    const handleKeyChange = index => (v) => {
        const temp = [...items];
        temp[index] = { key: v.value, value: '', metaKey: '' };
        setItems(temp);
    };

    const handleMetaKeyChange = index => (e) => {
        const temp = [...items];
        if (temp[index].key !== 'x-amz-meta') {
            return;
        }
        temp[index] = { ...temp[index], metaKey: e.target.value };
        setItems(temp);
    };

    const handleValueChange = index => (e: SyntheticInputEvent<HTMLInputElement>) => {
        const temp = [...items];
        temp[index] = { ...temp[index], value: e.target.value };
        setItems(temp);
    };

    const insertEntry = () => {
        const temp = [...items];
        temp.push({ key: '', value: '', metaKey: '' });
        setItems(temp);
    };

    const deleteEntry = (index) => {
        const temp = [...items];
        temp.splice(index, 1);
        setItems(temp);
    };

    const save = () => {
        const metadata = makeMetadata(items);
        if (!isValidItems) {
            return;
        }
        dispatch(putObjectMetadata(bucketName, prefixWithSlash, objectKey, metadata));
    };

    return (
        <div>
            <HeadContainer>
                <Button
                    variant='info'
                    text='Save'
                    disabled={!isValidItems}
                    onClick={save}
                    icon={<i className='fas fa-save' />}
                />
            </HeadContainer>
            <TableContainer>
                <Items>
                    {
                        items.map((p, i) => {
                            const isShrink = p.key === 'x-amz-meta';
                            return <Item isShrink={isShrink} key={i}>
                                <Inputs>
                                    <Select
                                        id='mdKeyType'
                                        name='mdKeyType'
                                        options={selectOptions}
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
                                    <InputValue isShrink={isShrink} value={p.value} onChange={handleValueChange(i)}/>
                                </Inputs>
                                <Buttons>
                                    <AddButton index={i} items={items} insertEntry={insertEntry}/>
                                    <SubButton index={i} items={items} deleteEntry={deleteEntry}/>
                                </Buttons>
                            </Item>;
                        })
                    }
                </Items>
            </TableContainer>
        </div>
    );
}

export default Properties;
