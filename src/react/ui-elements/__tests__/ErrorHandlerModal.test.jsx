import ErrorHandlerModal from '../ErrorHandlerModal';
import React from 'react';
import { reduxMount } from '../../utils/test';

describe('ErrorHandlerModal', () => {
    const errorMessage = 'test error message';

    it('ErrorHandlerModal should render', () => {
        const { component } = reduxMount(<ErrorHandlerModal/>, {
            uiErrors: {
                errorMsg: errorMessage,
                errorType: 'byModal',
            },
        });

        expect(component.find(ErrorHandlerModal).isEmptyRender()).toBe(false);
        expect(component.find('div.sc-modal-body').text()).toBe(errorMessage);
    });

    it('ErrorHandlerModal should not render if errorType is set to "byAuth"', () => {
        const { component } = reduxMount(<ErrorHandlerModal/>, {
            uiErrors: {
                errorMsg: errorMessage,
                errorType: 'byAuth',
            },
        });

        expect(component.find(ErrorHandlerModal).isEmptyRender()).toBe(true);
    });

    it('ErrorHandlerModal should not render if children errorType and errorMessage are set to null', () => {
        const { component } = reduxMount(<ErrorHandlerModal/>, {
            uiErrors: {
                errorMsg: null,
                errorType: null,
            },
        });

        expect(component.find(ErrorHandlerModal).isEmptyRender()).toBe(true);
    });
});
