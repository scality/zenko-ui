import React from 'react';
import UserBucket from './UserBucket';
import { connect } from 'react-redux';

class UserBuckets extends React.Component{
    render(){
        return <div>
            {
                this.props.buckets.map(bucket => {
                    return <UserBucket key={bucket.Name} bucket={bucket}/>;
                })
            }
        </div>;
    }
}

function mapStateToProps(state){
    return {
        buckets: state.bucket.list,
    };
}

export default connect(mapStateToProps)(UserBuckets);
