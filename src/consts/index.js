export const METADATA_SEARCH_HINT_ITEMS = [
    { descr: 'files with extension ".pdf"', q: 'key like /pdf$/' },
    { descr: 'files bigger than 1MB', q: 'content-length > 1000000' },
    { descr: 'file names that contain scality (case insensitive)', q: 'key like /scality/i' },
    { descr: 'files with metadata field color set to green', q: 'x-amz-meta-color="green"' },
    { descr: 'files tagged with color blue', q: 'tags.color=blue' },
    { descr: 'PDF files (from content-type)', q: 'content-type=application/pdf' },
    { descr: 'file names that contain the word Report (case sensitive)', q: 'key like Report' },
    { descr: 'files waiting to be replicated', q: 'x-amz-meta-replication-status="PENDING"' },
];
export const NETWORK_START_ACTION_STARTING_SEARCH = 'Starting search';
export const NETWORK_START_ACTION_SEARCHING_OBJECTS = 'Searching objects';
export const NETWORK_START_ACTION_CONTINUE_SEARCH = 'Continue search';
