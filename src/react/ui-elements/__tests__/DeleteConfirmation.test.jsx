import DeleteConfirmation from '../DeleteConfirmation';
import React from 'react';
import { reduxMount } from '../../utils/test';

describe('DeleteConfirmation', () => {
    const TITLE_TEXT = 'Are you sure you want to delete bucket: test ?';
    const approveFn = jest.fn();
    const cancelFn = jest.fn();

    it('DeleteConfirmation should render', () => {
        const { component } = reduxMount(<DeleteConfirmation approve={approveFn} cancel={cancelFn} show={true}
            titleText={TITLE_TEXT}/>);

        expect(component.find(DeleteConfirmation).isEmptyRender()).toBe(false);
        expect(component.find('div.sc-modal-body').text()).toBe(TITLE_TEXT);
    });

    it('DeleteConfirmation should not render', () => {
        const { component } = reduxMount(<DeleteConfirmation approve={approveFn} cancel={cancelFn} show={false}
            titleText={TITLE_TEXT}/>);

        expect(component.find(DeleteConfirmation).isEmptyRender()).toBe(true);
    });

    it('should call approve function after clicking on delete button', () => {
        const { component } = reduxMount(<DeleteConfirmation approve={approveFn} cancel={cancelFn} show={true}
            titleText={TITLE_TEXT}/>);

        expect(component.find(DeleteConfirmation).isEmptyRender()).toBe(false);
        component.find('button[label="Delete"]').simulate('click');
        expect(approveFn).toHaveBeenCalledTimes(1);
    });

    it('should call cancel function after clicking on cancel button', () => {
        const { component } = reduxMount(<DeleteConfirmation approve={approveFn} cancel={cancelFn} show={true}
            titleText={TITLE_TEXT}/>);

        expect(component.find(DeleteConfirmation).isEmptyRender()).toBe(false);
        component.find('button[label="Cancel"]').simulate('click');
        expect(cancelFn).toHaveBeenCalledTimes(1);
    });
});
