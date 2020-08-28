import React, { useCallback, useEffect } from 'react';

function ListBuckets(){
    const { bucketList, redirect, configuration, selectedBucketName } = props;

    // useEffect(() => {
    //     props.listBuckets();
    // }, []);

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
                <Button outlined icon={<i className="fas fa-sync" />} text="&nbsp; Refresh" onClick={props.listBuckets} />
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
