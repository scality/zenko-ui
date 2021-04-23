// @flow
import { AddButton, Buttons, Container, Footer, Header, HeaderKeyTag, HeaderValueTag, InputTag, Inputs, Item, Items, SubButton } from '../../../ui-elements/EditableKeyValue';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@scality/core-ui';
import type { ObjectMetadata } from '../../../../types/s3';
import { padding } from '@scality/core-ui/dist/style/theme';
import { putObjectTagging } from '../../../actions';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const EMPTY_ITEM = { key: '', value: '' };

const TableContainer = styled.div`
    overflow-y: auto;
    height: calc(100vh - 410px);
    margin-bottom: ${padding.smaller};
`;

const convertToAWSTags = tags => tags.filter(tag => tag.key !== '' && tag.value !== '')
    .map(tag => ({ Key: tag.key, Value: tag.value }));

type Props = {
    objectMetadata: ObjectMetadata,
};
function Properties({ objectMetadata }: Props) {
    const dispatch = useDispatch();
    const { bucketName, objectKey, tags, versionId } = objectMetadata;
    const [items, setItems] = useState([EMPTY_ITEM]);

    useEffect(() => {
        if (tags.length > 0) {
            setItems(tags);
        } else {
            setItems([EMPTY_ITEM]);
        }
    }, [tags]);

    // NOTE: invalid if at least one items is missing key or value but not both.
    const isValidItems = useMemo(() => {
        return !items.find(i => (i.key === '' && i.value !== '') || (i.value === '' && i.key !== ''));
    }, [items]);

    const handleChange = (index: number) => (e: SyntheticInputEvent<HTMLInputElement>) => {
        const temp = [...items];
        temp[index] = { ...temp[index], [e.target.name]: e.target.value };
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
        const tags = convertToAWSTags(items);
        dispatch(putObjectTagging(bucketName, objectKey, tags, versionId));
    };

    return (
        <Container>
            <Header>
                <HeaderKeyTag> Key </HeaderKeyTag>
                <HeaderValueTag> Value </HeaderValueTag>
            </Header>
            <TableContainer>
                <Items>
                    {
                        items.map((p, i) => {
                            return <Item key={i}>
                                <Inputs>
                                    <InputTag className='tags-input-key' value={p.key} name='key' onChange={handleChange(i)} autoComplete='off'/>
                                    <InputTag className='tags-input-value' value={p.value} name='value' onChange={handleChange(i)} autoComplete='off'/>
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
                    id='tags-button-save'
                    variant='buttonSecondary'
                    text='Save'
                    disabled={!isValidItems}
                    onClick={save}
                    icon={<i className='fas fa-save' />}
                />
            </Footer>
        </Container>
    );
}

export default Properties;
