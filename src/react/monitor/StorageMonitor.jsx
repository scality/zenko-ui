import { Head, HeadLeft } from '../ui-elements/Head';
import { closeLocationDeleteDialog, deleteLocation, openLocationDeleteDialog, selectLocation } from '../actions';
import { Button } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
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
  background-color: ${props => props.theme.brand.backgroundContrast1};
  /* background-color: blue; */
`;

const SectionLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;


  /* width: 130px; */
  flex-basis: 130px;
  flex-shrink: 0;

  .title {
      display: flex;
      flex-direction: column;
      padding: 15px;
      .subtitle{
          margin-top: 5px;
          font-size: 12px;
      }
  }

  .bottom {
      padding: 15px;
      button{
          width: 80px;
          margin-bottom: 5px;
      }
  }
`;

const SectionRight = styled.div`
    display: flex;
    overflow-x: auto;
`;

// horizontal scrolling: https://www.freecodecamp.org/news/horizontal-scrolling-using-flexbox-f9d16817f742/
const LocationContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex-shrink: 2;

    cursor: pointer;
    width: 130px;
    margin: 10px 5px;
    padding: 10px;
    border-radius: 5px;
    border: ${props => props.clicked ? '1px solid #32a1ce;' : '1px solid transparent;'};

    &:hover{
        border: 1px solid #32a1ce;
    };

    &:hover {
      border: 1px solid #32a1ce;
    }

    background-color: ${props => props.theme.brand.background};
    /* background-color: green; */
    .title{
        /* display: flex; */
        /* justify-content: space-between;
        align-items: baseline; */
    };
    .subtitle {
        margin-top: 5px;
        font-size: 12px;
    }
`;

function StorageMonitor(props) {
    const locations = Object.keys(props.locations);

    const deleteSelectedLocation = () => {
        props.deleteLocation(props.selectedLocationName);
    }

    // TODO: disable deleting location if used for bucket or lifecycle workflows.

    return <div>
        <DeleteConfirmation show={props.showDeleteLocation} cancel={props.closeLocationDeleteDialog} approve={deleteSelectedLocation} titleText={`Are you sure you want to delete location: ${props.selectedLocationName} ?`}/>
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
                        <Button outlined text="ADD" size="small" onClick={() => props.redirect('/monitor/location/editor')}/>
                        <Button variant="danger" disabled={!props.selectedLocationName} text="DELETE" size="small" onClick={props.openLocationDeleteDialog} />
                    </div>
                </SectionLeft>
                <SectionRight>
                    {
                        locations.map(l => {
                            return (<LocationContainer key={l} clicked={l === props.selectedLocationName} onClick={() => props.selectLocation(l)}>
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
        selectedLocationName: state.uiLocation.selectedLocationName,
        showDeleteLocation: state.uiLocation.showDeleteLocation,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        redirect: path => dispatch(push(path)),
        selectLocation: locationName => dispatch(selectLocation(locationName)),
        deleteLocation: locationName => dispatch(deleteLocation(locationName)),
        openLocationDeleteDialog: () => dispatch(openLocationDeleteDialog()),
        closeLocationDeleteDialog: () => dispatch(closeLocationDeleteDialog()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(StorageMonitor);
