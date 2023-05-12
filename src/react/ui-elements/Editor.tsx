import React from 'react';
import MonacoEditor, { EditorProps, loader } from '@monaco-editor/react';
loader.config({ paths: { vs: '/vs' } });

type Props = {
  width?: string;
  height?: string;
  language?: string;
  value?: string;
  readOnly?: boolean;
  onChange: (data: React.ChangeEvent) => void;
} & EditorProps;

const Editor = ({
  height,
  width,
  language,
  value,
  onChange,
  readOnly,
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
    options={{ readOnly, scrollBeyondLastLine: false }}
    {...rest}
  />
);

export default Editor;
