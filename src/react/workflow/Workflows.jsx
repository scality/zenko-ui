// @noflow;

import { Button, Tabs } from '@scality/core-ui';
import { Head, HeadLeft } from '../ui-elements/Head';
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
// import styled from 'styled-components';

class Workflows extends React.Component{

    itemClicked(e) {
        if (e) {
            e.preventDefault();
        }
        console.log('CLICKEDDD!!!');
    }

    populateItems(){
        const items = []
        this.props.configuration.replicationStreams.forEach((i) => {
            items.push({
                // onClick: this.itemClicked,
                // selected: true,
                title: i.name,
            });
        });
        return items;
    }

    redirect = (e) => {
        if (e) {
            e.preventDefault();
        }
        return this.props.redirect('/workflow/replication/create');
    }

    render() {
        console.log('this.props.configuration!!!', this.props.configuration);
        const items = this.populateItems();
        return <div>
            <Head> <HeadLeft> hello </HeadLeft> coco2 </Head>
            <Button outlined onClick={this.redirect} size="default" text="Add" type="submit" />
            <Tabs
                items={items}
            >
                <div> Content </div>
            </Tabs>
        </div>;
    }
}

function mapStateToProps(state) {
    return {
        configuration: state.configuration.latest,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        redirect: path => dispatch(push(path)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Workflows);
