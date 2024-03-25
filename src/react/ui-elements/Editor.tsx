import React, { useContext, useEffect, useMemo, useState } from 'react';
import MonacoEditor, { EditorProps, loader } from '@monaco-editor/react';
import { useConfig } from '../next-architecture/ui/ConfigProvider';

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
}: Props) => {
  const config = useConfig();
  const { basePath } = config;
  const [theme, setTheme] = useState('');
  useEffect(() => {
    setTheme(localStorage.getItem('theme') === 'dark' ? 'vs-dark' : 'light');
  }, [localStorage.getItem('theme')]);

  useMemo(() => {
    loader.config({ paths: { vs: basePath + '/vs' } });
  }, []);

  return (
    <MonacoEditor
      height={height}
      width={width}
      defaultLanguage={language}
      value={value}
      theme={theme}
      loading="Initializing..."
      onChange={onChange}
      keepCurrentModel={true}
      saveViewState={false}
      options={{ readOnly, scrollBeyondLastLine: false }}
      {...rest}
    />
  );
};

export default Editor;
