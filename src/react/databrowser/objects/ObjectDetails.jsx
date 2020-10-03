// @flow
import { ContentSection } from '../../ui-elements/ListLayout2';
import { CustomTabs } from '../../ui-elements/Tabs';
import { List } from 'immutable';
import type { ObjectMetadata } from '../../../types/s3';
import Properties from './details/Properties';
import React from 'react';
import { Warning } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useQuery } from '../../utils/hooks';

type Props = {
    objectMetadata: ?ObjectMetadata,
    toggled: List<Object>,
};

const InfoWarning = ({ title }: { title: string}) => <Warning iconClass='fas fa-2x fa-info-circle' title={title} />;

function ObjectDetails({ objectMetadata, toggled }: Props) {
    const dispatch = useDispatch();
    const query = useQuery();
    const { pathname } = useLocation();

    const tabName = query.get('tab');

    const details = () => {
        if (toggled.size > 1) {
            return <InfoWarning title='Mutilple items selected.'/>;
        }
        if (!objectMetadata) {
            return <InfoWarning title='Select an object.'/>;
        }
        if (!tabName) {
            return <Properties objectMetadata={objectMetadata}/>;
        }
        return null;
    };

    return (
        <ContentSection>
            <CustomTabs
                items={[
                    {
                        onClick: () => dispatch(push(pathname)),
                        selected: !tabName,
                        title: 'Summary',
                    },
                    {
                        onClick: () => dispatch(push(`${pathname}?tab=tags`)),
                        selected: tabName === 'tags',
                        title: 'Tags',
                    },
                    {
                        onClick: () => dispatch(push(`${pathname}?tab=metadata`)),
                        selected: tabName === 'metadata',
                        title: 'Metadata',
                    },
                ]}
            >
                <div>
                    { details() }
                </div>
            </CustomTabs>
        </ContentSection>
    );
}

export default ObjectDetails;
