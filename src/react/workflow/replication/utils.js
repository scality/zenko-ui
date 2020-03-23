export function generateStreamName(bucketName, destinationLocations) {
    const destinations = destinationLocations.length <= 1 ?
        destinationLocations[0].name :
        `${destinationLocations[0].name} and ${destinationLocations.length - 1} more`;
    return `${bucketName} ➜ ${destinations}`;
}

export function newReplicationForm() {
    return {
        streamName: '',
        streamVersion: 1,
        streamId: '',
        enabled: true,
        sourceBucket: '',
        sourcePrefix: '',
        destinationLocations: [],
        preferredReadLocation: null,
    };
}

function newReplicationStream() {
    return {
        streamId: '',
        name: '',
        version: 1,
        enabled: true,
        source: {
            prefix: null,
            bucketName: '',
        },
        destination: {
            locations: [],
            preferredReadLocation: null,
        },
    };
}

export function  convertToReplicationStream(r) {
    if (!r) {
        return newReplicationStream();
    }
    return {
        streamId: r.streamId || '',
        name: r.streamName || '',
        version: r.streamVersion || 1,
        enabled: true,
        source: {
            prefix: r.sourcePrefix || '',
            bucketName: r.sourceBucket || '',
        },
        destination: {
            locations: r.destinationLocations || [],
            preferredReadLocation: r.preferredReadLocation,
        },
    };
}
