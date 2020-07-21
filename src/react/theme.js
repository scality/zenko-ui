import {
    grayLight,
    grayLighter,
    green,
    warmRed,
    white,
    yellowOrange,
} from '@scality/core-ui/src/lib/style/theme';

export const theme = {
    name: 'Dark Theme',
    brand: {
        base: '#19161D',
        baseContrast1: '#26232A',
        primary: white,
        secondary: '#a7a7a7',
        success: green,
        info: '#007AFF',
        warning: yellowOrange,
        danger: warmRed,
        background: '#0a0a0b',
        backgroundContrast1: '#16161a',
        backgroundContrast2: '#08080A',
        text: '#ECECEC',
        textPrimary: grayLighter,
        textSecondary: grayLight,
        border: white,
    },
};
