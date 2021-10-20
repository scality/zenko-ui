// @flow
import React from 'react';
import { Warning } from './ui-elements/Warning';
import { useLocation } from 'react-router-dom';

function NoMatch() {
  const { pathname } = useLocation();
  const title = `No match for "${pathname}"`;

  return (
    <Warning
      centered={true}
      iconClass="fas fa-5x fa-exclamation-triangle"
      title={title}
    />
  );
}

export default NoMatch;
