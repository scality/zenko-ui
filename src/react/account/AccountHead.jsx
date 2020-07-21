// @flow
import { Head, HeadCenter, HeadLeft, HeadRight, HeadTitle, IconCircle} from '../ui-elements/ListLayout';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import React from 'react';
import { useSelector } from 'react-redux';

function AccountHead() {

    const account = useSelector((state: AppState) => state.account.display);

    if (!account.id) {
        return <Head/>;
    }

    return (
        <Head>
            <HeadLeft> <IconCircle className="fas fa-wallet"></IconCircle> </HeadLeft>
            <HeadCenter>
                <HeadTitle> {account.userName} </HeadTitle>
            </HeadCenter>
            <HeadRight>
                <Button icon={<i className="fas fa-trash" />} size="small" disabled={true} variant="danger" text='Delete account' />
            </HeadRight>
        </Head>
    );
}

export default AccountHead;
