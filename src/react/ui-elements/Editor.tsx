import MonacoEditor, { EditorProps, loader } from '@monaco-editor/react';
import React, { useMemo, useState } from 'react';

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
  const { themeMode } = window.shellHooks.useShellThemeSelector();

  useMemo(() => {
    setTheme(themeMode === 'dark' ? 'vs-dark' : 'light');
  }, [themeMode]);

  useMemo(() => {
    const path = process.env.NODE_ENV === 'development' ? '/zenko' : basePath;
    loader.config({ paths: { vs: path + '/vs' } });
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
