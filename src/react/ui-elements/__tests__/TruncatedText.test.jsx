import React from 'react';
import TruncatedText from '../TruncatedText';
import { reduxMount } from '../../utils/test';

describe('TruncatedText', () => {
    it('TruncatedText should render with a truncated-end text', () => {
        const { component } = reduxMount(<TruncatedText text="This is a really really really long sentence." trailingCharCount={ 7 }/>);

        const truncatedEnd = component.find('div.truncated-end');
        expect(truncatedEnd.text()).toContain('ntence.');
        expect(truncatedEnd).toHaveLength(1);
        expect(component.find('div.sc-tooltip')).toHaveLength(1);
    });

    it('TruncatedText should render without a truncated-end text', () => {
        const { component } = reduxMount(<TruncatedText text="Tiny sentence" trailingCharCount={ 30 }/>);

        expect(component.find('div.truncated-end')).toHaveLength(0);
        expect(component.find('div.sc-tooltip')).toHaveLength(0);
    });

    it('TruncatedText with trailingCharCount length of text', () => {
        const text = 'A sentence';
        const { component } = reduxMount(<TruncatedText text={ text } trailingCharCount={ text.length }/>);

        expect(component.find('div.truncated-end')).toHaveLength(0);
        expect(component.find('div.sc-tooltip')).toHaveLength(0);
    });
});
