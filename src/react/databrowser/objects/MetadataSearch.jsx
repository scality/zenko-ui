// @flow
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
import { listObjects, newSearchListing } from '../../actions';
import type { Action } from '../../../types/actions';
import type { DispatchAPI } from 'redux';
import { useDispatch } from 'react-redux';
import { useOutsideClick } from '../../utils/hooks';

export const METADATA_SEARCH_HINT_ITEMS = [
  { descr: 'files with extension ".pdf"', q: 'key like /pdf$/' },
  { descr: 'files bigger than 1MB', q: 'content-length > 1000000' },
  {
    descr: 'file names that contain scality (case insensitive)',
    q: 'key like /scality/i',
  },
  {
    descr: 'files with metadata field color set to green',
    q: 'x-amz-meta-color="green"',
  },
  { descr: 'files tagged with color blue', q: 'tags.color=blue' },
  { descr: 'PDF files (from content-type)', q: 'content-type=application/pdf' },
  {
    descr: 'file names that contain the word Report (case sensitive)',
    q: 'key like Report',
  },
  {
    descr: 'files waiting to be replicated',
    q: 'x-amz-meta-replication-status="PENDING"',
  },
];

type Props = {
  bucketName: string,
  prefixWithSlash: string,
  isMetadataType: boolean,
  errorZenkoMsg: ?string,
};
const MetadataSearch = ({
  isMetadataType,
  bucketName,
  prefixWithSlash,
  errorZenkoMsg,
}: Props) => {
  const [inputText, setInputText] = useState('');
  const [hintsShown, setHintsShown] = useState(false);
  const dispatch: DispatchAPI<Action> = useDispatch();

  // hide hints if clicked on outside of element.
  const suggestionsRef = useRef(null);
  const inputRef = useRef<SearchMetadataInput<> | null>(null);
  useOutsideClick(suggestionsRef, () => setHintsShown(false));

  const handleChange = e => {
    setInputText(e.target.value);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!inputText || prefixWithSlash) {
      return;
    }
    dispatch(newSearchListing(bucketName, inputText));
  };

  const reset = e => {
    e.stopPropagation();
    setHintsShown(false);
    setInputText('');
    dispatch(listObjects(bucketName, prefixWithSlash));
  };

  const handleHintClicked = q => {
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
      isHidden={prefixWithSlash ? 1 : 0}
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
          {METADATA_SEARCH_HINT_ITEMS.map(h => {
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
