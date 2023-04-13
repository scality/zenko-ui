export const XDM_FEATURE = 'XDM';
export function getAppConfig() {
  return fetch('/config.json', {
    credentials: 'same-origin',
  })
    .then((response) => {
      return response.json();
    })
    .then((config) => {
      const {
        managementEndpoint,
        navbarConfigUrl,
        navbarEndpoint,
        stsEndpoint,
        zenkoEndpoint,
        iamEndpoint,
        iamInternalFQDN,
        s3InternalFQDN,
      } = config;

      if (
        !navbarEndpoint ||
        !managementEndpoint ||
        !stsEndpoint ||
        !zenkoEndpoint ||
        !iamEndpoint ||
        !iamInternalFQDN ||
        !s3InternalFQDN
      ) {
        throw new Error(
          'incorrect or missing mandatory configuration information(s). (i.e. managementEndpoint, navbarEndpoint, stsEndpoint, iamEndpoint, iamInternalFQDN, s3InternalFQDN and zenkoEndpoint)',
        );
      }

      return {
        managementEndpoint,
        navbarConfigUrl,
        navbarEndpoint,
        stsEndpoint,
        zenkoEndpoint,
        iamEndpoint,
        iamInternalFQDN,
        s3InternalFQDN,
        features: config.features || [],
      };
    });
}
