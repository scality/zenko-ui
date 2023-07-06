import {
  NFS_OPT_CONFLICT,
  NFS_V3_CONFLICTS,
  NFS_V3_OPTIONS,
  NFS_V4_CONFLICTS,
  NFS_V4_OPTIONS,
} from './constants';
const v3ConflictOpts = Object.assign({}, NFS_OPT_CONFLICT, NFS_V3_CONFLICTS);
const v4ConflictOpts = Object.assign({}, NFS_OPT_CONFLICT, NFS_V4_CONFLICTS);

function _getNFSTestOptions(version) {
  if (version === 'v3') {
    return {
      conflictMap: v3ConflictOpts,
      optionsMap: NFS_V3_OPTIONS,
    };
  }

  if (version === 'v4') {
    return {
      conflictMap: v4ConflictOpts,
      optionsMap: NFS_V4_OPTIONS,
    };
  }
}

function _checkNFSDetails(details) {
  if (!details.endpoint) {
    return {
      disable: true,
    };
  }

  const {
    protocol: scheme,
    host,
    pathname: path,
    search: query,
  } = new URL(details.endpoint);
  const [protocol, version] = scheme.slice(0, -1).split('+');

  if (protocol !== 'udp' && protocol !== 'tcp') {
    return {
      disable: true,
      errorMessage: `Error: Invalid NFS protocol "${protocol}"`,
    };
  }

  if (version !== 'v4' && version !== 'v3') {
    return {
      disable: true,
      errorMessage: `Error: Invalid NFS version "${version}"`,
    };
  }

  if (!host) {
    return {
      disable: true,
      errorMessage: '',
    }; // return no error, incomplete form
  }

  if (!path) {
    return {
      disable: true,
      errorMessage: 'Error: Invalid path',
    };
  }

  if (!query) {
    return null;
  }

  const options = query.slice(1);
  const optMap = {};

  const { conflictMap, optionsMap } = _getNFSTestOptions(version);

  for (const o of options.split(',')) {
    const [opt] = o.split('=');

    if (!optionsMap[opt]) {
      return {
        disable: true,
        errorMessage: `Error: Invalid NFS ${version} option "${opt}"`,
      };
    }

    const antiOpt = conflictMap[opt];

    if (optMap[antiOpt]) {
      return {
        disable: true,
        errorMessage: `Error: "${opt}" and "${antiOpt}" cannot be set together`,
      };
    }

    optMap[opt] = true;
  }

  return null;
}

function _checkLocationDetails(type, details) {
  switch (type) {
    case 'location-nfs-mount-v1':
      return _checkNFSDetails(details);

    default:
      return null;
  }
}

function _checkAdvancedOptions(options) {
  const { isSizeLimitChecked, sizeLimitGB } = options;

  if (!isSizeLimitChecked) {
    return null;
  }

  if (!sizeLimitGB) {
    return {
      disable: true,
      errorMessage: '',
    };
  }

  const val = parseInt(sizeLimitGB, 10);

  if (val <= 0 || isNaN(val)) {
    return {
      disable: true,
      errorMessage: 'Error: Size limit must be greater than 0.',
    };
  }

  return null;
}

function locationFormCheck(location) {
  const optionsError = _checkAdvancedOptions(location.options);

  const type = location.locationType;

  const locationError = _checkLocationDetails(type, location.details || {});

  return (
    locationError ||
    optionsError || {
      disable: false,
      errorMessage: '',
    }
  );
}

export default locationFormCheck;
