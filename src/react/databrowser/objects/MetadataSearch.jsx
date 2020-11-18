// @flow
import { Hint, Hints, HintsTitle } from '../../ui-elements/Input';
import React, { useRef, useState } from 'react';
import {
    STRING_METADATA_INPUT_PLACEHOLDER,
    STRING_METADATA_SEARCH_HINT_TITLE,
    STRING_SEARCH_BUTTON,
} from '../../../consts/strings';
import { SearchButton, SearchInputIcon, SearchMetadataContainer, SearchMetadataInput, SearchMetadataInputAndIcon, SearchValidationIcon } from '../../ui-elements/Table';
import { listObjects, newSearchListing } from '../../actions';
import type { Action } from '../../../types/actions';
import type { DispatchAPI } from 'redux';
import { METADATA_SEARCH_HINT_ITEMS } from '../../../consts';
import { useDispatch } from 'react-redux';
import { useOutsideClick } from '../../utils/hooks';

type Props = {
    bucketName: string,
    prefixWithSlash: string,
    isMetadataType: boolean,
    errorZenkoMsg: ?string,
};
const MetadataSearch = ({ isMetadataType, bucketName, prefixWithSlash, errorZenkoMsg }: Props) => {
    const [inputText, setInputText] = useState('');
    const [hintsShown, setHintsShown] = useState(false);
    const dispatch: DispatchAPI<Action> = useDispatch();

    // hide hints if clicked on outside of element.
    const suggestionsRef = useRef(null);
    const inputRef = useRef<SearchMetadataInput<> | null>(null);
    useOutsideClick(suggestionsRef, () => setHintsShown(false));

    const handleChange = (e) => {
        setInputText(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputText || prefixWithSlash) {
            return;
        }
        dispatch(newSearchListing(bucketName, inputText));
    };

    const reset = (e) => {
        e.stopPropagation();
        setHintsShown(false);
        setInputText('');
        dispatch(listObjects(bucketName, prefixWithSlash));
    };

    const handleHintClicked = (q) => {
        setInputText(q);
        setHintsShown(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleInputClicked = () => {
        if (inputText || hintsShown) {
            return;
        }
        setHintsShown(true);
    };

    return (
        <SearchMetadataContainer isHidden={prefixWithSlash ? 1 : 0} onSubmit={handleSubmit}>
            <SearchMetadataInputAndIcon>
                <SearchValidationIcon isMetadataType={isMetadataType} isError={!!errorZenkoMsg} />
                <SearchMetadataInput ref={inputRef} onChange={handleChange} placeholder={STRING_METADATA_INPUT_PLACEHOLDER} value={inputText} onClick={handleInputClicked} />
                <SearchInputIcon className="fas fa-times-circle" onClick={reset} isHidden={!isMetadataType && !errorZenkoMsg ? 1 : 0}></SearchInputIcon>
            </SearchMetadataInputAndIcon>
            {
                hintsShown && !inputText && <Hints ref={suggestionsRef}>
                    <HintsTitle>{STRING_METADATA_SEARCH_HINT_TITLE}</HintsTitle>
                    {
                        METADATA_SEARCH_HINT_ITEMS.map(h => {
                            return <Hint key={h.q} onClick={() => handleHintClicked(h.q)}> { h.descr } </Hint>;
                        })
                    }
                </Hints>
            }
            <SearchButton type="submit" text={STRING_SEARCH_BUTTON} disabled={!inputText}/>
        </SearchMetadataContainer>
    );
};

export default MetadataSearch;
