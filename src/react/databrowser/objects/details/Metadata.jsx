// @flow
import { AMZ_META, METADATA_SYSTEM_TYPE, METADATA_USER_TYPE, isEmptyItem, systemMetadata } from '../../../utils';
import { AddButton, Buttons, Char, Container, Footer, Header, HeaderKey, HeaderValue, InputExtraKey, InputValue, Inputs, Item, Items, SubButton } from '../../../ui-elements/EditableKeyValue';
import { Button, Select } from '@scality/core-ui';
import type { ListObjectsType, MetadataItem, MetadataItems, ObjectMetadata } from '../../../../types/s3';
import React, { useEffect, useMemo, useState } from 'react';
import { LIST_OBJECT_VERSIONS_S3_TYPE } from '../../../utils/s3';
import { padding } from '@scality/core-ui/dist/style/theme';
import { putObjectMetadata } from '../../../actions';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const EMPTY_ITEM = { key: '', value: '', type: '' };

const TableContainer = styled.div`
    overflow-y: auto;
    height: calc(100vh - 410px);
    margin-bottom: ${padding.smaller};
`;

const userMetadataOption = {
    value: AMZ_META,
    label: AMZ_META,
};

const selectOptions = systemMetadata.map(o => ({
    value: o.key,
    label: o.header,
})).concat([userMetadataOption]);

const isUserType = type => type === METADATA_USER_TYPE;
const isSystemType = type => type === METADATA_SYSTEM_TYPE;

const convertToAWSMetadata = (items: MetadataItems) => {
    const userMetadata = {};
    const systemMetadata = {};
    for (const item of items) {
        const { type, key, value } = item;
        if (isEmptyItem(item)) {
            continue;
        }
        if (isUserType(type)) {
            userMetadata[key] = value;
        } else if (isSystemType(type)) {
            systemMetadata[key] = value;
        }
    }
    return { systemMetadata, userMetadata };
};

type Props = {
    objectMetadata: ObjectMetadata,
    listType: ListObjectsType,
};
function Metadata({ objectMetadata, listType }: Props) {
    const dispatch = useDispatch();
    const { bucketName, objectKey, metadata } = objectMetadata;
    const [items, setItems] = useState([EMPTY_ITEM]);
    const isVersioningType = listType === LIST_OBJECT_VERSIONS_S3_TYPE;

    useEffect(() => {
        if (metadata.length > 0) {
            setItems(metadata);
        } else {
            setItems([EMPTY_ITEM]);
        }
    }, [metadata]);

    const options = useMemo(() => selectOptions.filter(option =>
        !items.find(item => item.key === option.value && isSystemType(item.type))
    ), [items]);

    // NOTE: invalid if at least one items is missing key or value but not both.
    const isValidItems = useMemo(() => {
        return !items.find(i => (i.key === '' && i.value !== '') || (i.value === '' && i.key !== ''));
    }, [items]);

    const handleSelectChange = (index: number) => (v) => {
        const temp = [...items];
        if (v.value === AMZ_META) {
            temp[index] = { key: '', value: '', type: METADATA_USER_TYPE };
        } else {
            temp[index] = { key: v.value, value: '', type: METADATA_SYSTEM_TYPE };
        }
        setItems(temp);
    };

    const handleKeyChange = (index: number) => (e: SyntheticInputEvent<HTMLInputElement>) => {
        const temp = [...items];
        if (!isUserType(temp[index].type)) {
            return;
        }
        temp[index] = { ...temp[index], key: e.target.value };
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
        const { systemMetadata, userMetadata } = convertToAWSMetadata(items);
        dispatch(putObjectMetadata(bucketName, objectKey, systemMetadata, userMetadata));
    };

    const selectValue = (metadata: MetadataItem) => {
        const { key, type } = metadata;
        if (isSystemType(type) && key) {
            return selectOptions.find(l => l.value === key);
        }
        if (isUserType(type)) {
            return userMetadataOption;
        }
        return '';
    };

    return (
        <Container>
            <Header>
                <HeaderKey> Key </HeaderKey>
                <HeaderValue> Value </HeaderValue>
            </Header>
            <TableContainer>
                <Items>
                    {
                        items.map((p, i) => {
                            const isUserMD = isUserType(p.type);
                            return <Item isShrink={isUserMD} key={i}>
                                <Inputs>
                                    <Select
                                        name='mdKeyType'
                                        options={options}
                                        onChange={handleSelectChange(i)}
                                        isDisabled={isVersioningType}
                                        value={selectValue(p)}
                                    />
                                    {
                                        isUserMD && <Char>-</Char>
                                    }
                                    {
                                        isUserMD && <InputExtraKey className='metadata-input-extra-key' value={p.key} onChange={handleKeyChange(i)} disabled={isVersioningType}/>
                                    }
                                    <Char>:</Char>
                                    <InputValue className='metadata-input-value' isShrink={isUserMD} value={p.value} onChange={handleValueChange(i)} disabled={isVersioningType} autoComplete='off'/>
                                </Inputs>
                                <Buttons>
                                    <SubButton disabled={isVersioningType} index={i} items={items} deleteEntry={deleteEntry}/>
                                    <AddButton disabled={isVersioningType} index={i} items={items} insertEntry={insertEntry}/>
                                </Buttons>
                            </Item>;
                        })
                    }
                </Items>
            </TableContainer>
            <Footer>
                <Button
                    id='metadata-button-save'
                    variant='buttonSecondary'
                    text='Save'
                    disabled={!isValidItems || isVersioningType}
                    onClick={save}
                    icon={<i className='fas fa-save' />}
                />
            </Footer>
        </Container>
    );
}

export default Metadata;
