import { Provider } from 'react-redux';
import React from 'react';
import configureStore from 'redux-mock-store';
import { initialFullState } from '../reducers/initialConstants';
import { mount } from 'enzyme';

export const newTestStore = (state) => configureStore([])({
    ...initialFullState,
    ...(state || {}),
});

export const reduxMount = (component, testState) => {
    const store = newTestStore(testState);
    return {
        component: mount(
            <Provider store={store}>{component}</Provider>),
    };
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
