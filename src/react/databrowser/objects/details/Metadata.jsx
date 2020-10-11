// @flow
import { AddButton, ExtraKey, Key, Pair, Pairs, SubButton, Value } from '../../../ui-elements/EditableKeyValue';
import { Button, Select } from '@scality/core-ui';
import type { MetadataItems, ObjectMetadata } from '../../../../types/s3';
import React, { useState } from 'react';
import Input from '../../../ui-elements/Input';
import { putObjectMetadata } from '../../../actions';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const TableContainer = styled.div`
    // display: block;
    overflow-y: auto;
    height: calc(100vh - 340px);
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
    const { bucketName, objectKey, metadata } = objectMetadata;
    const [pairs, setPairs] = useState(metadata.length > 0 ? metadata: [{ key: '', value: '' }]);

    const handleKeyChange = index => (v) => {
        const temp = [...pairs];
        temp[index] = { key: v.value, value: '' };
        setPairs(temp);
    };

    const handleMetaKeyChange = index => (e) => {
        const temp = [...pairs];
        if (temp[index].key !== 'x-amz-meta') {
            return;
        }
        temp[index] = { ...temp[index], metaKey: e.target.value };
        setPairs(temp);
    };

    const handleValueChange = index => (e: SyntheticInputEvent<HTMLInputElement>) => {
        const temp = [...pairs];
        temp[index] = { ...temp[index], value: e.target.value };
        setPairs(temp);
    };

    const insertEntry = () => {
        const temp = [...pairs];
        temp.push({ key: '', value: '' });
        setPairs(temp);
    };

    const deleteEntry = (index) => {
        const temp = [...pairs];
        temp.splice(index, 1);
        setPairs(temp);
    };

    const save = () => {
        const metadata = makeMetadata(pairs);
        console.log('metadata!!!', metadata);
        // dispatch(putObjectMetadata(bucketName, objectKey, metadata));
    };

    return (
        <TableContainer>
            <Button
                variant='info'
                text='Save'
                disabled={false}
                onClick={save}
            />
            <Pairs>
                {
                    pairs.map((p, i) => {
                        const isShrink = p.key === 'x-amz-meta';
                        return <Pair key={i}>
                            <Key isShrink={isShrink} >
                                <Select
                                    id='mdKeyType'
                                    name='mdKeyType'
                                    options={selectOptions}
                                    onChange={handleKeyChange(i)}
                                    isDisabled={false}
                                    value={p.key ? selectOptions.find(l => l.value === p.key): ''}
                                />
                            </Key>
                            {
                                isShrink && <ExtraKey>
                                    <Input value={p.metaKey || ''} onChange={handleMetaKeyChange(i)}/>
                                </ExtraKey>
                            }
                            <Value isShrink={isShrink}>
                                <Input value={p.value} onChange={handleValueChange(i)}/>
                            </Value>
                            <AddButton index={i} pairs={pairs} insertEntry={insertEntry}/>
                            <SubButton index={i} pairs={pairs} deleteEntry={deleteEntry}/>
                        </Pair>;
                    })
                }
            </Pairs>
        </TableContainer>
    );
}

export default Properties;
