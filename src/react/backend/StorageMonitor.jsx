import { Head, HeadLeft } from '../ui-elements/Head';
import React, { useMemo } from 'react';
import { closeLocationDeleteDialog, deleteLocation, openLocationDeleteDialog, selectLocation } from '../actions';
import { Button } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { connect } from 'react-redux';
import { getLocationName } from '../utils/storageOptions';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { fontSize, padding } from '@scality/core-ui/dist/style/theme';

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  height: 210px;
`;

const Section = styled.div`
  display: flex;
  height: 100%;

  margin: ${padding.small};
  background-color: ${props => props.theme.brand.primary};
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
      padding: ${padding.base};
      .subtitle{
          margin-top: ${padding.smaller};
          font-size: ${padding.base};
      }
  }

  .bottom {
      padding: 0px ${padding.base};
      button{
          width: 80px;
          margin-bottom: ${padding.smaller};
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
    flex-basis: 130px;

    cursor: pointer;
    min-width: 130px;
    margin: ${padding.small} ${padding.smaller};
    padding: ${padding.small};
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
        word-break: break-all;
        .maintitle{
        }
        .subtitle {
            margin-top: ${padding.small};
            word-break: break-word;
            font-size: ${fontSize.small};
        }
    };
`;

function StorageMonitor(props) {
    const locations = useMemo(() => Object.keys(props.locations), [props.locations]);

    const deleteSelectedLocation = () => {
        props.deleteLocation(props.selectedLocationName);
    };

    // TODO: add specific tooltip message about why location can not be deleted
    const canDeleteLocation = (locationName) => {
        if (!locationName) {
            return false;
        }
        const isBuiltin = props.locations[locationName] && props.locations[locationName].isBuiltin;
        if (isBuiltin){
            return false;
        }
        const checkStreamLocations = props.replicationStreams.every(r => {
            // legacy $FlowFixMe
            if (r.destination.location) {
                return r.destination.location !== locationName;
            }
            return r.destination.locations.every(destLocation => {
                return destLocation.name !== locationName;
            });
        });
        if (!checkStreamLocations){
            return false;
        }
        const checkBucketLocations = props.buckets.every(bucket => bucket.location !== locationName);
        if (!checkBucketLocations) {
            return false;
        }
        const checkEndpointLocations = props.endpoints.every(e => e.locationName !== locationName);
        if (!checkEndpointLocations) {
            return false;
        }
        return true;
    };

    const canEditLocation = (locationName) => {
        if (!locationName){
            return false;
        }
        const isBuiltin = props.locations[locationName] && props.locations[locationName].isBuiltin;
        if (isBuiltin){
            return false;
        }
        return true;
    };

    const editLocation = () => {
        props.redirect(`/monitor/location/editor/${props.selectedLocationName}`);
    }

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
                        <Button outlined variant="buttonPrimary" text='EDIT' size='small' onClick={editLocation} disabled={!canEditLocation(props.selectedLocationName)}/>
                        <Button outlined variant="buttonDelete" disabled={!canDeleteLocation(props.selectedLocationName)} text="DELETE" size="small" onClick={props.openLocationDeleteDialog} />
                    </div>
                </SectionLeft>
                <SectionRight>
                    {
                        locations.map(l => {
                            return (<LocationContainer key={l} clicked={l === props.selectedLocationName} onClick={() => props.selectLocation(l)}>
                                <div className='title'>
                                    <div className='maintitle'> {l} </div>
                                    <div className='subtitle'> {getLocationName(props.locations[l].locationType)} </div>
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
        selectedLocationName: state.uiLocations.selectedLocationName,
        showDeleteLocation: state.uiLocations.showDeleteLocation,
        replicationStreams: state.configuration.latest.replicationStreams,
        buckets: state.stats.bucketList,
        endpoints: state.configuration.latest.endpoints,
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
