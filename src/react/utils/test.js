import { Provider } from 'react-redux';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { act } from 'react-dom/test-utils';
import configureStore from 'redux-mock-store';
import { initialFullState } from '../reducers/initialConstants';
import { mount } from 'enzyme';
import thunk from 'redux-thunk';

const theme = {
    name: 'Dark Theme',
    brand: {
        base: '#19161D',
        baseContrast1: '#26232A',
        primary: '#19161D',
        secondary: '#a7a7a7',
        success: '#19161D',
        info: '#007AFF',
        warning: '#19161D',
        danger: '#19161D',
        background: '#0a0a0b',
        backgroundContrast1: '#16161a',
        backgroundContrast2: '#08080A',
        text: '#ECECEC',
        textPrimary: '#19161D',
        textSecondary: '#19161D',
        border: '#19161D',
    },
};

export const newTestStore = (state) => configureStore([thunk])({
    ...initialFullState,
    ...(state || {}),
});

export const reduxMount = (component, testState) => {
    const store = newTestStore(testState);
    return {
        component: mount(
            <ThemeProvider theme={theme}>
                <Provider store={store}>
                    {component}
                </Provider>
            </ThemeProvider>
        ),
    };
};

export async function reduxMountAct(component, testState) {
    const store = newTestStore(testState);
    let wrapper = null;

    await act(async () => {
        wrapper = mount(
            <ThemeProvider theme={theme}>
                <Provider store={store}>
                    {component}
                </Provider>
            </ThemeProvider>,
        );
    });

    return wrapper;
}

export const themeMount = component => {
    return mount(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

export function updateInputText(component, name, value) {
    component.find(`input[name="${name}"]`).simulate('change', {
        target: {
            name,
            value,
        },
    });
}

export function checkBox(component, name, checked) {
    component.find(`input[name="${name}"]`).simulate('change', {
        target: {
            name,
            checked,
            type: 'checkbox',
        },
    });
}

export function editListEntry(component, value, index) {
    const wrapper = component.find('InputList').find(`input[name="entry${index}"]`);
    wrapper.simulate('change', { target: { value } });
}

export function addListEntry(component) {
    const btnWrapper = component.find('InputList').find('button[name="addbtn"]');
    btnWrapper.simulate('click');
}

export function delListEntry(component, index) {
    const btnWrapper = component.find('InputList').find(`button#delbtn${index}`);
    btnWrapper.simulate('click');
}
