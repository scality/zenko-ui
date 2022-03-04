import {
  Head,
  HeadCenter,
  HeadLeft,
  HeadTitle,
  IconCircle,
} from '../ui-elements/ListLayout';
import React from 'react';
import { useParams } from 'react-router-dom';

function AccountHead() {
  const { accountName: accountNameParam } = useParams();
  return (
    <Head>
      <HeadLeft>
        {' '}
        <IconCircle className="fas fa-wallet"></IconCircle>{' '}
      </HeadLeft>
      <HeadCenter>
        <HeadTitle> {accountNameParam} </HeadTitle>
      </HeadCenter>
    </Head>
  );
}

export default AccountHead;