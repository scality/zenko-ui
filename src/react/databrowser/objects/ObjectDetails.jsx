// @flow
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { ContentSection } from '../../ui-elements/ListLayout2';
import { CustomTabs } from '../../ui-elements/Tabs';
import { List } from 'immutable';
import type { ListObjectsType } from '../../../types/s3';
import Metadata from './details/Metadata';
import type { Node } from 'react';
import Properties from './details/Properties';
import React from 'react';
import Tags from './details/Tags';
import { Warning } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import { useLocation } from 'react-router-dom';
import { useQuery } from '../../utils/hooks';

export const MULTIPLE_ITEMS_SELECTED_MESSAGE = 'Multiple items selected';
export const SELECT_AN_OBJECT_MESSAGE = 'Select an object';

type Props = {
    toggled: List<Object>,
    listType: ListObjectsType,
};

export const InfoWarning = ({ title }: { title: Node }) => <Warning iconClass='fas fa-2x fa-info-circle' title={title} />;

const warningTitle = (toggled: List<Object>): Node => {
    if (toggled.size === 1) {
        const firstObject = toggled.first();
        const { isDeleteMarker, isFolder } = firstObject;
        if (isDeleteMarker) {
            return 'A "Delete Marker" is selected';
        }
        if (isFolder) {
            return 'A "Folder" is selected';
        }
    }
    return SELECT_AN_OBJECT_MESSAGE;
};

function ObjectDetails({ toggled, listType }: Props) {
    const dispatch = useDispatch();
    const query = useQuery();
    const { pathname } = useLocation();
    const objectMetadata = useSelector((state: AppState) => state.s3.objectMetadata);
    const theme = useSelector((state: AppState) => state.uiConfig.theme);

    const tabName = query.get('tab');

    const details = () => {
        if (toggled.size > 1) {
            return <InfoWarning title={MULTIPLE_ITEMS_SELECTED_MESSAGE}/>;
        }
        if (!objectMetadata) {
            return <InfoWarning title={warningTitle(toggled)}/>;
        }
        if (!tabName) {
            return <Properties objectMetadata={objectMetadata}/>;
        }
        if (tabName === 'metadata') {
            return <Metadata objectMetadata={objectMetadata} listType={listType}/>;
        }
        if (tabName === 'tags') {
            return <Tags objectMetadata={objectMetadata}/>;
        }
        return null;
    };

    return (
        <ContentSection>
            <CustomTabs
                activeTabColor={ theme.brand.backgroundLevel4 }
                items={[
                    {
                        onClick: () => dispatch(push(pathname)),
                        selected: !tabName,
                        title: 'Summary',
                    },
                    {
                        onClick: () => dispatch(push(`${pathname}?tab=metadata`)),
                        selected: tabName === 'metadata',
                        title: 'Metadata',
                    },
                    {
                        onClick: () => dispatch(push(`${pathname}?tab=tags`)),
                        selected: tabName === 'tags',
                        title: 'Tags',
                    },
                ]}
            >
                { details() }
            </CustomTabs>
        </ContentSection>
    );
}

export default ObjectDetails;
