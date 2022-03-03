import { Hint, Hints, HintsTitle } from '../../ui-elements/Input';
import React, { useRef, useState } from 'react';
import {
  SearchButton,
  SearchInputIcon,
  SearchMetadataContainer,
  SearchMetadataInput,
  SearchMetadataInputAndIcon,
  SearchValidationIcon,
} from '../../ui-elements/Table';
import type { Action } from '../../../types/actions';
import type { DispatchAPI } from 'redux';
import { useDispatch } from 'react-redux';
import {
  useOutsideClick,
  useQueryParams,
  usePrefixWithSlash,
} from '../../utils/hooks';
import { useLocation } from 'react-router';
import { push } from 'connected-react-router';
export const METADATA_SEARCH_HINT_ITEMS = [
  {
    descr: 'files with extension ".pdf"',
    q: 'key like /pdf$/',
  },
  {
    descr: 'files bigger than 1MB',
    q: 'content-length > 1000000',
  },
  {
    descr: 'file names that contain scality (case insensitive)',
    q: 'key like /scality/i',
  },
  {
    descr: 'files with metadata field color set to green',
    q: 'x-amz-meta-color="green"',
  },
  {
    descr: 'files tagged with color blue',
    q: 'tags.color=blue',
  },
  {
    descr: 'PDF files (from content-type)',
    q: 'content-type=application/pdf',
  },
  {
    descr: 'file names that contain the word Report (case sensitive)',
    q: 'key like Report',
  },
  {
    descr: 'files waiting to be replicated',
    q: 'replication-status="PENDING"',
  },
];
type Props = {
  isMetadataType: boolean;
  errorZenkoMsg: string | null | undefined;
};

const MetadataSearch = ({ isMetadataType, errorZenkoMsg }: Props) => {
  const [hintsShown, setHintsShown] = useState(false);
  const dispatch: DispatchAPI<Action> = useDispatch();
  const query = useQueryParams();
  const { pathname } = useLocation();
  const prefixWithSlash = usePrefixWithSlash();
  // hide hints if clicked on outside of element.
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  useOutsideClick(suggestionsRef, () => setHintsShown(false));
  const searchInput = query.get('metadatasearch');
  const [inputText, setInputText] = useState(searchInput || '');

  const handleChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inputText || prefixWithSlash) {
      return;
    }

    // Add metadatasearch in the query params
    query.set('metadatasearch', inputText);
    dispatch(push(`${pathname}?${query.toString()}`));
  };

  const reset = (e) => {
    e.stopPropagation();
    setHintsShown(false);
    setInputText('');
    // Remove the medatasearch from the query params
    query.delete('metadatasearch');
    dispatch(push(`${pathname}?${query.toString()}`));
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
    <SearchMetadataContainer
      isHidden={prefixWithSlash && !searchInput ? 1 : 0}
      onSubmit={handleSubmit}
    >
      <SearchMetadataInputAndIcon>
        <SearchValidationIcon
          isMetadataType={isMetadataType}
          isError={!!errorZenkoMsg}
        />
        <SearchMetadataInput
          disableToggle={true}
          ref={inputRef}
          onChange={handleChange}
          placeholder="Metadata Search"
          value={inputText}
          onClick={handleInputClicked}
        />
        <SearchInputIcon
          className="fas fa-times-circle"
          onClick={reset}
          isHidden={!isMetadataType && !errorZenkoMsg ? 1 : 0}
        />
      </SearchMetadataInputAndIcon>
      {hintsShown && !inputText && (
        <Hints ref={suggestionsRef}>
          <HintsTitle> Suggestions </HintsTitle>
          {METADATA_SEARCH_HINT_ITEMS.map((h) => {
            return (
              <Hint key={h.q} onClick={() => handleHintClicked(h.q)}>
                {' '}
                {h.descr}{' '}
              </Hint>
            );
          })}
        </Hints>
      )}
      <SearchButton
        variant="primary"
        type="submit"
        label="Search"
        disabled={!inputText}
      />
    </SearchMetadataContainer>
  );
};

export default MetadataSearch;
