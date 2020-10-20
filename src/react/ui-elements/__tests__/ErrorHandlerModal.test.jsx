import ErrorHandlerModal from '../ErrorHandlerModal';
import React from 'react';
import { reduxMount } from '../../utils/test';

describe('ErrorHandlerModal', () => {
    const closeFn = jest.fn();

    it('ErrorHandlerModal should render', () => {
        const { component } = reduxMount(<ErrorHandlerModal show={true} close={closeFn}>
            <div id='child'>Message</div>
        </ErrorHandlerModal>);

        expect(component.find(ErrorHandlerModal).isEmptyRender()).toBe(false);
        expect(component.find('div#child').text()).toBe('Message');
    });

    it('ErrorHandlerModal should not render if show is false', () => {
        const { component } = reduxMount(<ErrorHandlerModal show={false} close={closeFn}>
            <div id='child'>Message</div>
        </ErrorHandlerModal>);

        expect(component.find(ErrorHandlerModal).isEmptyRender()).toBe(true);
    });

    it('ErrorHandlerModal should not render if children is null', () => {
        const { component } = reduxMount(<ErrorHandlerModal show={true} close={closeFn}/>);

        expect(component.find(ErrorHandlerModal).isEmptyRender()).toBe(true);
    });

    it('should call close function after clicking on close button', () => {
        const { component } = reduxMount(<ErrorHandlerModal show={true} close={closeFn}>
            <div id='child'>Message</div>
        </ErrorHandlerModal>);

        expect(component.find(ErrorHandlerModal).isEmptyRender()).toBe(false);
        component.find('Button[text="Close"]').simulate('click');
        expect(closeFn).toHaveBeenCalledTimes(1);
    });
});
