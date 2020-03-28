import { Head, HeadLeft } from '../ui-elements/Head';
import React, { useEffect } from 'react';
import { Row, TableContainer } from '../ui-elements/Table';
import { closeBucketDeleteDialog, deleteBucket, listBuckets, openBucketDeleteDialog, selectBucket } from '../actions';
import { Button } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { connect } from 'react-redux';
import {formatDate} from '../utils';
import { getLocationTypeFromName } from '../utils/storageOptions';
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

  background-color: ${props => props.theme.brand.backgroundContrast1};
  border-radius: 5px;
  padding: 1em;

  height: calc(100vh - 240px);
`;

const BucketSectionTop = styled.div`
  display: flex;
  justify-content: flex-end;

  width: 100%;
  button {
      margin-left: 5px;
  }
`;



function DataBrowser(props){
    const { bucketList, stats, redirect, configuration, selectedBucketName } = props;

    useEffect(() => {
        props.listBuckets();
    }, []);

    const createBucket = () => {
        redirect('/databrowser/create');
    };

    const deleteSelectedBucket = () => {
        props.deleteBucket(selectedBucketName);
    }

    // TODO: add HeadSection inside <HEAD>
    // <HeadSection>
    //     <div className="title"> ACCOUNT CONSUMPTION </div>
    //     <ProgressBar
    //         bottomLeftLabel="50GB Used"
    //         bottomRightLabel="50GB Free"
    //         percentage={50}
    //         size="smaller"
    //         topLeftLabel="50%"
    //         topRightLabel="100GB Total"
    //     />
    // </HeadSection>

    return <DataBrowserContainer>
        <DeleteConfirmation show={props.showDelete} cancel={props.closeBucketDeleteDialog} approve={deleteSelectedBucket} titleText={`Are you sure you want to delete bucket: ${selectedBucketName} ?`}/>
        <Head>

            <HeadLeft>

                <div className='number'> {bucketList.length} </div>
                <div> bucket{bucketList.length > 1 && 's'} </div>

            </HeadLeft>

        </Head>

        <BucketSection>
            <BucketSectionTop>
                <Button variant="danger" disabled={!selectedBucketName} icon={<i className="fa fa-trash" />} text="&nbsp; Delete bucket" onClick={props.openBucketDeleteDialog} />
                <Button outlined icon={<i className="fa fa-plus-circle" />} text="&nbsp; Create bucket" onClick={createBucket} />
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
                                <Row key={b.Name} selected={b.Name === selectedBucketName}  onClick={() => props.selectBucket(b.Name)}>
                                    <td> {b.Name} </td>
                                    <td> {formatDate(b.CreationDate)} </td>
                                    <td> {b.LocationConstraint || 'us-east-1'} / {getLocationTypeFromName(b.LocationConstraint, configuration)} </td>
                                </Row>)
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
        selectedBucketName: state.uiBucket.selectedBucketName,
        showDelete: state.uiBucket.showDelete,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        deleteBucket: bucketName => dispatch(deleteBucket(bucketName)),
        redirect: path => dispatch(push(path)),
        listBuckets: () => dispatch(listBuckets()),
        openBucketDeleteDialog: () => dispatch(openBucketDeleteDialog()),
        closeBucketDeleteDialog: () => dispatch(closeBucketDeleteDialog()),
        selectBucket: bucketName => dispatch(selectBucket(bucketName)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(DataBrowser);
