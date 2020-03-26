import { Button, ProgressBar } from '@scality/core-ui';
import { Head, HeadLeft } from '../ui-elements/Head';
import React, { useEffect } from 'react';
import TableContainer from '../ui-elements/TableContainer';
import { connect } from 'react-redux';
import {formatDate} from '../utils';
import { getLocationName } from '../utils/storageOptions';
import { listBuckets } from '../actions';
import { push } from 'connected-react-router';
import styled from 'styled-components';

const DataBrowserContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const HeadSection = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 200px;
  text-align: center;

  .title {
      font-size: 14px;
      margin: 10px 0px;
  }
`;

const BucketSection = styled.div`
  display: flex;
  flex-direction: column;

  background-color: #1c1c20;
  border-radius: 5px;
  padding: 1em;
`;

const BucketSectionTop = styled.div`
  display: flex;
  justify-content: flex-end;

  width: 100%;
`;

function DataBrowser(props){
    const { bucketList, stats, redirect, configuration } = props;

    useEffect(() => {
        console.log('useEffect!!!', bucketList);
        props.listBuckets();
    }, []);

    const createBucket = () => {
        redirect('/databrowser/create');
    };

    return <DataBrowserContainer>
        <Head>

            <HeadLeft>

                <div className='number'> {bucketList.length} </div>
                <div> bucket{bucketList.length > 1 && 's'} </div>

            </HeadLeft>

            <HeadSection>
                <div className="title"> ACCOUNT CONSUMPTION </div>
                <ProgressBar
                    bottomLeftLabel="50GB Used"
                    bottomRightLabel="50GB Free"
                    percentage={50}
                    size="smaller"
                    topLeftLabel="50%"
                    topRightLabel="100GB Total"
                />
            </HeadSection>

        </Head>

        <BucketSection>
            <BucketSectionTop>
                <Button outlined text="Create bucket" onClick={createBucket} />
            </BucketSectionTop>
            <TableContainer hide={props.bucketList.length === 0}>
                <table>
                    <tbody>
                        <tr>
                            <th> Name </th>
                            <th> Creation date </th>
                            <th> Location Constraint </th>
                        </tr>
                        {
                            props.bucketList.map(b =>
                                <tr key={b.Name}>
                                    <td> {b.Name} </td>
                                    <td> {formatDate(b.CreationDate)} </td>
                                    <td> {b.LocationConstraint || 'us-east-1'} / {getLocationName(b.LocationConstraint, configuration)} </td>
                                </tr>)
                        }
                    </tbody>
                </table>
            </TableContainer>
        </BucketSection>


    </DataBrowserContainer>;
}

function mapStateToProps(state) {
    return {
        bucketList: state.bucket.list,
        stats: state.stats.allStats,
        configuration: state.configuration.latest,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        redirect: path => dispatch(push(path)),
        listBuckets: () => dispatch(listBuckets()),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(DataBrowser);
