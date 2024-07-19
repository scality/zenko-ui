import { S3DeleteMarker, S3Version } from '../../types/s3';
export const LIST_OBJECTS_S3_TYPE = 's3';
export const LIST_OBJECTS_METADATA_TYPE = 'md';
export const LIST_OBJECT_VERSIONS_S3_TYPE = 'ver';
export const mergeSortedVersionsAndDeleteMarkers = (
  versions: Array<S3Version>,
  deleteMarkers: Array<S3DeleteMarker>,
) => {
  const sortedList = [];
  // Version index counter
  let vIdx = 0;
  // Delete Marker index counter
  let dmIdx = 0;

  while (vIdx < versions.length || dmIdx < deleteMarkers.length) {
    if (versions[vIdx] === undefined) {
      // versions list is empty, just need to merge remaining DM's
      sortedList.push(deleteMarkers[dmIdx++]);
    } else if (deleteMarkers[dmIdx] === undefined) {
      // DM's list is empty, just need to merge remaining versions
      sortedList.push(versions[vIdx++]);
    } else if (versions[vIdx].Key !== deleteMarkers[dmIdx].Key) {
      // 1. by Key name, alphabetical order sorted by ascii values
      const isVKeyNewer = versions[vIdx].Key < deleteMarkers[dmIdx].Key;

      if (isVKeyNewer) {
        sortedList.push(versions[vIdx++]);
      } else {
        sortedList.push(deleteMarkers[dmIdx++]);
      }
    } else {
      // NOTE: VersionId may be null
      const nullVersion =
        versions[vIdx].VersionId === 'null' ||
        deleteMarkers[dmIdx].VersionId === 'null';
      const isVersionVidNewer =
        versions[vIdx].VersionId < deleteMarkers[dmIdx].VersionId;

      // if there is a null version, handle accordingly
      if (nullVersion) {
        const isVersionLastModifiedNewer =
          new Date(versions[vIdx].LastModified) >
          new Date(deleteMarkers[dmIdx].LastModified);
        const isDMLastModifiedNewer =
          new Date(deleteMarkers[dmIdx].LastModified) >
          new Date(versions[vIdx].LastModified);

        // 2. by LastModified, find newer
        if (isVersionLastModifiedNewer) {
          sortedList.push(versions[vIdx++]);
        } else if (isDMLastModifiedNewer) {
          sortedList.push(deleteMarkers[dmIdx++]);
        } else {
          // 3. choose one randomly since all conditions match
          // TODO: to be fixed
          sortedList.push(versions[vIdx++]);
        }
      } else {
        // 4. by VersionId, lower number means newer
        if (isVersionVidNewer) {
          sortedList.push(versions[vIdx++]);
        } else {
          sortedList.push(deleteMarkers[dmIdx++]);
        }
      }
    }
  }

  return sortedList;
};
