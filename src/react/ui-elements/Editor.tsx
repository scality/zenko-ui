import React from 'react';
import MonacoEditor from '@monaco-editor/react';

type Props = {
  width?: string;
  height?: string;
  language?: string;
  value?: string;
  onChange: (data: React.ChangeEvent) => void;
};

const Editor = ({
  height,
  width,
  language,
  value,
  onChange,
  ...rest
}: Props) => (
  <MonacoEditor
    height={height}
    width={width}
    defaultLanguage={language}
    value={value}
    theme="vs-dark"
    loading="Initializing..."
    onChange={onChange}
    keepCurrentModel={true}
    saveViewState={false}
    {...rest}
  />
);

export default Editor;
