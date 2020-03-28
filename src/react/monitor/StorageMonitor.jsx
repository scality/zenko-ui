import { Head, HeadLeft } from '../ui-elements/Head';
import { Button } from '@scality/core-ui';
import React from 'react';
import { connect } from 'react-redux';
import { getLocationType } from '../utils/storageOptions';
import { push } from 'connected-react-router';
import styled from 'styled-components';

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  height: 150px;
`;

const Section = styled.div`
  display: flex;
  height: 100%;

  margin: 10px;
  border-radius: 5px;
  /* background-color: ${props => props.theme.brand.backgroundContrast1}; */
  background-color: blue;
`;

const SectionLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;


  width: 130px;

  .title {
      display: flex;
      flex-direction: column;
      padding: 15px;
      .subtitle{
          margin-top: 5px;
          font-size: 15px;
      }
  }

  .bottom {
      padding: 15px;
  }
`;

const SectionRight = styled.div`
    display: flex;
    /* flex-wrap: wrap; */

    height: calc(100% - 40px);
`;

const LocationContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex-shrink: 2;

    height: 100%;
    width: 130px;
    margin: 10px 5px;
    padding: 10px;
    border-radius: 5px;
    /* background-color: ${props => props.theme.brand.background}; */
    background-color: green;
    .title{
        /* display: flex; */
        /* justify-content: space-between;
        align-items: baseline; */
    };
    .subtitle {
        margin-top: 5px;
        font-size: 10px;
    }
`;

function StorageMonitor(props) {
    const locations = Object.keys(props.locations);
    return <div>
        <Head>
            <HeadLeft> <div className="title"> GLOBAL HEALTH </div> </HeadLeft>
        </Head>
        <Sections>
            <Section>
                <SectionLeft>
                    <div className='title'>
                        <div className='maintitle'> Storage </div>
                        <div className='subtitle'> {locations.length} Location{locations.length > 1 && 's'} </div>
                    </div>
                    <div className='bottom'>
                        <Button outlined text="ADD" onClick={() => props.redirect('/monitor/location/editor')}/>
                    </div>
                </SectionLeft>
                <SectionRight>
                    {
                        locations.map(l => {
                            return (<LocationContainer key={l}>
                                <div className='title'>
                                    <div> {l} </div>
                                    <div className='subtitle'> {getLocationType(props.locations[l].locationType)} </div>
                                </div>
                            </LocationContainer>);
                        })
                    }
                </SectionRight>
            </Section>
        </Sections>
    </div>;
}

const mapStateToProps = state => {
    return {
        locations: state.configuration.latest.locations,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        redirect: path => dispatch(push(path)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(StorageMonitor);
