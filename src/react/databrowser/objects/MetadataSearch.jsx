// @flow
import React, { useEffect, useRef, useState } from 'react';
import { SearchButton, SearchInput, SearchInputIcon, SearchMetadataContainer, SearchMetadataInputAndIcon } from '../../ui-elements/Table';
import { listObjects, newSearchListing } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../../types/actions';
import type { AppState } from '../../../types/state';
import type { DispatchAPI } from 'redux';
import { LIST_OBJECTS_METADATA_TYPE } from '../../utils';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { useOutsideClick } from '../../utils/hooks';

const hints = [
    { descr: 'files with extension ".pdf"', q: 'key like /pdf$/' },
    { descr: 'files bigger than 1MB', q: 'content-length > 1000000' },
    { descr: 'file names that contain scality (case insensitive)', q: 'key like /scality/i' },
    { descr: 'files with metadata field color set to green', q: 'x-amz-meta-color="green"' },
    { descr: 'files tagged with color blue', q: 'tags.color=blue' },
    { descr: 'PDF files (from content-type)', q: 'content-type=application/pdf' },
    { descr: 'file names that contain the word Report (case sensitive)', q: 'key like Report' },
    { descr: 'files waiting to be replicated', q: 'x-amz-meta-replication-status="PENDING"' },
];

const Hints = styled.div`
  position: absolute;
  z-index: 1;
  background-color: ${props => props.theme.brand.background};
  left: 20px;
  margin-top: 40px;
  padding: 10px;
`;

const HintsTitle = styled.div`
  font-style: italic;
  padding: 2px 0px 5px 5px;
  color: ${props => props.theme.brand.textSecondary};
`;

const Hint = styled.div`
  padding: 5px;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.brand.secondaryDark1};
  }
`;

const _getSearchUrl = (bucketName: string, prefixWithSlash: string, q: string) => {
    let qQuery = `/buckets/${bucketName}/objects/${prefixWithSlash}`
    if (q) {
        qQuery = `${qQuery}?q=${encodeURIComponent(q)}`
    }
    return qQuery;
}

type Props = {
    bucketName: string,
    prefixWithSlash: string,
};
const MetadataSearch = ({ bucketName, prefixWithSlash, q }: Props) => {
    const [inputText, setInputText] = useState('');
    const [hintsShown, setHintsShown] = useState(false);
    const dispatch: DispatchAPI<Action> = useDispatch();

    const listType = useSelector((state: AppState) => state.s3.listObjectsType);
    const isMetadataType = listType === LIST_OBJECTS_METADATA_TYPE;

    // hide hints if clicked on outside of element.
    const suggestionsRef = useRef(null);
    useOutsideClick(suggestionsRef, () => setHintsShown(false));
    useEffect(() => {
        console.log('q!!!', q);
        setInputText(q);
    }, [q]);

    const handleChange = (e) => {
        setInputText(e.target.value);
    };

    const navigateToSearch = (q: string) => {
        dispatch(push(_getSearchUrl(bucketName, prefixWithSlash, q)));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputText) {
            return;
        }
        navigateToSearch(inputText);
    };

    const reset = (e) => {
        e.stopPropagation();
        setHintsShown(false);
        setInputText('');
        navigateToSearch();
    };

    const handleHintClicked = (q) => {
        setInputText(q);
        navigateToSearch(q);
        setHintsShown(false);
    };

    const handleInputClicked = () => {
        if (inputText || hintsShown) {
            return;
        }
        setHintsShown(true);
    };

    return (
        <SearchMetadataContainer onSubmit={handleSubmit}>
            <SearchMetadataInputAndIcon>
                <SearchInput onChange={handleChange} placeholder='Metadata Search' value={inputText} onClick={handleInputClicked} active={isMetadataType} />
                <SearchInputIcon className="fas fa-times-circle" onClick={reset} visibility={isMetadataType}></SearchInputIcon>
            </SearchMetadataInputAndIcon>
            {
                hintsShown && !inputText && <Hints ref={suggestionsRef}>
                    <HintsTitle> Suggestions </HintsTitle>
                    {
                        hints.map(h => {
                            return <Hint key={h.q} onClick={() => handleHintClicked(h.q)}> { h.descr } </Hint>;
                        })
                    }
                </Hints>
            }
            <SearchButton type="submit" text="Search" disabled={!inputText}/>
        </SearchMetadataContainer>
    );
};

export default MetadataSearch;
