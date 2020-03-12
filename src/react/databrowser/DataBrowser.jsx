import React from 'react';
import TableContainer from '../ui-elements/TableContainer';
import { connect } from 'react-redux';
import styled from 'styled-components';

const DataBrowserContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const Head = styled.div`
  display: flex;

  color: #fff;
  margin: 10px;
  border-radius: 5px;
  height: 110px;
  background: repeating-radial-gradient(
    circle at 5% 5%,
    #212127,
    #212127 3px,
    #32323a 3px,
    #32323a 15px
  );
`;

const HeadLeft = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;


  width: 110px;
  background-color: #00000069;
  .number{
      font-size: 4em;
  }
`;

const BucketSection = styled.div`
  display: flex;

  background-color: #1c1c20;
  border-radius: 5px;
  padding: 1em;
`;


class DataBrowser extends React.Component{
    render() {
        return <DataBrowserContainer>
            <Head>

                <HeadLeft>

                    <div className='number'> {this.props.bucketList.length} </div>
                    <div> bucket{this.props.bucketList.length > 1 && 's'} </div>

                </HeadLeft>

            </Head>

            <BucketSection>

                <TableContainer hide={this.props.bucketList.length === 0}>
                    <table>
                        <tbody>
                            <tr>
                                <th> Name </th>
                            </tr>
                            {
                                this.props.bucketList.map(b =>
                                    <tr key={b.Name}>
                                        <td> {b.Name} </td>
                                    </tr>)
                            }
                        </tbody>
                    </table>
                </TableContainer>
            </BucketSection>


        </DataBrowserContainer>;
    }
}

function mapStateToProps(state) {
    return {
        bucketList: state.bucket.list,
    };
}

export default connect(mapStateToProps)(DataBrowser);
