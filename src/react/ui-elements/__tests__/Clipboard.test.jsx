import { Clipboard, IconCopy, IconSuccess } from '../Clipboard';
import { OWNER_NAME } from '../../actions/__tests__/utils/testUtil';
import React from 'react';
import { reduxMount } from '../../utils/test';

describe('Clipboard', () => {
    it('Clipboard should render with copy icon', () => {
        const { component } = reduxMount(<Clipboard text={OWNER_NAME}/>);

        expect(component.find(Clipboard)).toHaveLength(1);
        expect(component.find(IconCopy)).toHaveLength(1);
    });

    it('Clipboard should render with success icon', () => {
        const writeTextFn = jest.fn();

        global.navigator.clipboard = { writeText: writeTextFn };

        const { component } = reduxMount(<Clipboard text={OWNER_NAME}/>);

        expect(component.find(Clipboard)).toHaveLength(1);
        expect(component.find(IconCopy)).toHaveLength(1);
        component.find(IconCopy).simulate('click');
        expect(writeTextFn).toHaveBeenCalledTimes(1);
        expect(component.find(IconSuccess)).toHaveLength(1);
        expect(component.find(IconCopy)).toHaveLength(0);
    });
});
