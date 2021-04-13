export function setTheme(theme: Theme): SetThemeAction {
    return {
        type: 'SET_THEME',
        theme,
    };
};