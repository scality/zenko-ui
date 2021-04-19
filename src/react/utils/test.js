import { Provider } from 'react-redux';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { act } from 'react-dom/test-utils';
import configureStore from 'redux-mock-store';
import { initialFullState } from '../reducers/initialConstants';
import { mount } from 'enzyme';
import thunk from 'redux-thunk';

const theme = {
    name: 'Dark Rebrand Theme',
    brand: {
        // Dark Rebrand
        statusHealthy: '#0AADA6',
        statusWarning: '#F8F32B',
        statusCritical: '#E84855',
        selectedActive: '#037AFF',
        highlight: '#1A3C75',
        border: '#313131',
        buttonPrimary: '#2F4185',
        buttonSecondary: '#595A78',
        buttonDelete: '#3D0808',
        infoPrimary: '#8E8EAC',
        infoSecondary: '#333366',
        backgroundLevel1: '#121219',
        backgroundLevel2: '#323245',
        backgroundLevel3: '#232331',
        backgroundLevel4: '#171721',
        textPrimary: '#FFFFFF',
        textSecondary: '#EAEAEA',
        textTertiary: '#B5B5B5',
        textReverse: '#000000',
        textLink: '#71AEFF',
        // degraded colors
        alert: '#FFE508',
        base: '#7B7B7B',
        primary: '#1D1D1D',
        primaryDark1: '#171717',
        primaryDark2: '#0A0A0A',
        secondary: '#0F7FFF',
        secondaryDark1: '#1C3D59',
        secondaryDark2: '#1C2E3F',
        success: '#006F62',
        healthy: '#30AC26',
        healthyLight: '#69E44C',
        warning: '#FFC10A',
        danger: '#AA1D05',
        critical: '#BE321F',
        background: '#121212',
        backgroundBluer: '#192A41',
        borderLight: '#A5A5A5',
        info: '#434343',
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
