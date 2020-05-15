import {clearError, loadAPIs, loadInstanceLatestStatus, loadInstanceStats} from './actions';
import {
    jade,
    turquoise,
    yellowOrange,
    warmRed,
    white,
} from '@scality/core-ui/src/lib/style/theme';
import Activity from './ui-elements/Activity';
import React from 'react';
import Routes from './Routes';
import { ThemeProvider } from 'styled-components';
import { connect } from 'react-redux';


const theme = {
    name: "Dark Theme",
    brand: {
        // Navbar
        base: '#19161D',
        baseContrast1: '#26232A',
        // App
        // primary: "#111112",
        primary: white,
        secondary: '#a7a7a7',
        success: jade,
        info: turquoise,
        warning: yellowOrange,
        danger: warmRed,
        background: '#0a0a0b',
        backgroundContrast1: '#16161a',
        backgroundContrast2: '#08080A',
        text: white,
        border: white,
    },
};

class ZenkoUI extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            loaded: false,
        };
    }

    componentDidMount() {
        // TODO: move them to a gobal action
        this.props.dispatch(loadAPIs()).then(() => {
            this.setState({ loaded: true });
        });
        // this.refreshIntervalStatsUnit = setInterval(
        //     () => this.props.dispatch(loadInstanceLatestStatus()), 10000);
        // this.refreshIntervalStatsSeries = setInterval(
        //     () => this.props.dispatch(loadInstanceStats()), 10000);
    }

    componentWillUnmount() {
        clearInterval(this.refreshIntervalStatsUnit);
        clearInterval(this.refreshIntervalStatsSeries);
    }
    render(){
        return (
            <ThemeProvider theme={theme}>
                <div>
                    { this.state.loaded && <Routes/> }
                    <Activity/>
                </div>
            </ThemeProvider>
        );
    }
}

function mapStateToProps(state) {
    return {
        showError: !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byModal',
        errorMessage: state.uiErrors.errorMsg,
        // needReauth: state.networkActivity.authFailure,
        // isLoaded: !!(state.auth.clients && state.auth.clients.iamClient),
    };
}


export default connect(mapStateToProps)(ZenkoUI);
