import MonacoEditor, { type EditorProps, loader } from '@monaco-editor/react';
import { useCurrentApp, useShellHooks } from '@scality/module-federation';
import type React from 'react';
import { useMemo, useState } from 'react';

type Props = {
  width?: string;
  height?: string;
  language?: string;
  value?: string;
  readOnly?: boolean;
  onChange: (data: React.ChangeEvent) => void;
} & EditorProps;

const Editor = ({ height, width, language, value, onChange, readOnly, ...rest }: Props) => {
  const [theme, setTheme] = useState('');
  const { useShellThemeSelector } = useShellHooks();
  const { themeMode } = useShellThemeSelector();
  const { url } = useCurrentApp();

  useMemo(() => {
    setTheme(themeMode === 'dark' ? 'vs-dark' : 'light');
  }, [themeMode]);

  useMemo(() => {
    loader.config({ paths: { vs: `${url}/vs` } });
  }, [url]);

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
