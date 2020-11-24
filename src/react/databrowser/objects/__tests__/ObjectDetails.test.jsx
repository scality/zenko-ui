import * as hooks from '../../../utils/hooks';
import { FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT } from './utils/testUtil';
import ObjectDetails, {
    InfoWarning,
    MULTIPLE_ITEMS_SELECTED_MESSAGE,
    SELECT_AN_OBJECT_MESSAGE,
} from '../ObjectDetails';
import { List } from 'immutable';
import { OBJECT_METADATA } from '../../../actions/__tests__/utils/testUtil';
import Properties from '../details/Properties';
import React from 'react';
import { reduxMount } from '../../../utils/test';
import router from 'react-router';

describe('ObjectDetails', () => {
    beforeAll(() => {
        jest.spyOn(router, 'useLocation').mockReturnValue({ pathname: '/buckets/test/objects' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should display "Summary" tab when there is one toggled object', async () => {
        const { component } = reduxMount(<ObjectDetails toggled={List([FIRST_FORMATTED_OBJECT])}/>, {
            s3: {
                objectMetadata: OBJECT_METADATA,
            },
        });

        expect(component.find(Properties)).toHaveLength(1);
    });

    it('should display nothing in "Tags" tab when there is one toggled object', () => {
        jest.spyOn(hooks, 'useQuery').mockReturnValue(new URLSearchParams('?tab=tags'));

        const { component } = reduxMount(<ObjectDetails toggled={List([FIRST_FORMATTED_OBJECT])}/>, {
            s3: {
                objectMetadata: OBJECT_METADATA,
            },
        });

        expect(component.find(Properties)).toHaveLength(0);
        expect(component.find(InfoWarning)).toHaveLength(0);
    });

    it('should display nothing in "Metadata" tab when there is one toggled object', () => {
        jest.spyOn(hooks, 'useQuery').mockReturnValue(new URLSearchParams('?tab=metadata'));

        const { component } = reduxMount(<ObjectDetails toggled={List([FIRST_FORMATTED_OBJECT])}/>, {
            s3: {
                objectMetadata: OBJECT_METADATA,
            },
        });

        expect(component.find(Properties)).toHaveLength(0);
        expect(component.find(InfoWarning)).toHaveLength(0);
    });

    it(`should display "${MULTIPLE_ITEMS_SELECTED_MESSAGE}" message in "Summary" tab when there are more than one toggled object`, async () => {
        const { component } = reduxMount(<ObjectDetails
            toggled={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}/>);

        expect(component.find(InfoWarning)).toHaveLength(1);
        expect(component.find(InfoWarning).prop('title')).toBe(MULTIPLE_ITEMS_SELECTED_MESSAGE);
    });

    it(`should display "${MULTIPLE_ITEMS_SELECTED_MESSAGE}" message in "Tabs" tab when there are more than one toggled object`, () => {
        jest.spyOn(hooks, 'useQuery').mockReturnValue(new URLSearchParams('?tab=tags'));

        const { component } = reduxMount(<ObjectDetails
            toggled={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}/>);

        expect(component.find(InfoWarning)).toHaveLength(1);
        expect(component.find(InfoWarning).prop('title')).toBe(MULTIPLE_ITEMS_SELECTED_MESSAGE);
    });

    it(`should display "${MULTIPLE_ITEMS_SELECTED_MESSAGE}" message in "Metadata" tab when there are more than one toggled object`, () => {
        jest.spyOn(hooks, 'useQuery').mockReturnValue(new URLSearchParams('?tab=metadata'));

        const { component } = reduxMount(<ObjectDetails
            toggled={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}/>);

        expect(component.find(InfoWarning)).toHaveLength(1);
        expect(component.find(InfoWarning).prop('title')).toBe(MULTIPLE_ITEMS_SELECTED_MESSAGE);
    });

    it(`should display "${SELECT_AN_OBJECT_MESSAGE}" message in "Summary" tab if no object has been toggled`, async () => {
        const { component } = reduxMount(<ObjectDetails toggled={List()}/>);

        expect(component.find(InfoWarning)).toHaveLength(1);
        expect(component.find(InfoWarning).prop('title')).toBe(SELECT_AN_OBJECT_MESSAGE);
    });

    it(`should display "${SELECT_AN_OBJECT_MESSAGE}" message in "Tabs" tab if no object has been toggled`, () => {
        jest.spyOn(hooks, 'useQuery').mockReturnValue(new URLSearchParams('?tab=tags'));

        const { component } = reduxMount(<ObjectDetails toggled={List()}/>);

        expect(component.find(InfoWarning)).toHaveLength(1);
        expect(component.find(InfoWarning).prop('title')).toBe(SELECT_AN_OBJECT_MESSAGE);
    });

    it(`should display "${SELECT_AN_OBJECT_MESSAGE}" message in "Metadata" tab if no object has been toggled`, () => {
        jest.spyOn(hooks, 'useQuery').mockReturnValue(new URLSearchParams('?tab=metadata'));

        const { component } = reduxMount(<ObjectDetails toggled={List()}/>);

        expect(component.find(InfoWarning)).toHaveLength(1);
        expect(component.find(InfoWarning).prop('title')).toBe(SELECT_AN_OBJECT_MESSAGE);
    });
});
