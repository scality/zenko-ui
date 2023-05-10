Replace Error by window.Error

Change

```
/**
     * Get storage consumption metrics for an account
     * @param {string} uuid
     * @param {string} accountCanonicalId the requested account canonical id to get storage consumption metrics
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getStorageConsumptionMetricsForAccount(
      uuid: string,
      accountCanonicalId: string,
      options?: any,
    ): (
      fetch?: FetchAPI,
      basePath?: string,
    ) => Promise<StorageConsumptionMetricItemV1> {
      const localVarFetchArgs = UiFacingApiFetchParamCreator(
        configuration,
      ).getStorageConsumptionMetricsForAccount(
        uuid,
        accountCanonicalId,
        options,
      );
      return (
        fetch: FetchAPI = portableFetch,
        basePath: string = BASE_PATH,
      ) => {
        return fetch(
          basePath + localVarFetchArgs.url,
          localVarFetchArgs.options,
        ).then((response) => {
          if (response.status >= 200 && response.status < 300) {
            return response.json();
          } else {
            throw response;
          }
        });
      };
    },
```

To

```
/**
     * Get storage consumption metrics for an account
     * @param {string} uuid
     * @param {string} accountCanonicalId the requested account canonical id to get storage consumption metrics
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getStorageConsumptionMetricsForAccount(
      uuid: string,
      accountCanonicalId: string,
      options?: any,
    ): (
      fetch?: FetchAPI,
      basePath?: string,
    ) => Promise<StorageConsumptionMetricItemV1> {
      const localVarFetchArgs = UiFacingApiFetchParamCreator(
        configuration,
      ).getStorageConsumptionMetricsForAccount(
        uuid,
        accountCanonicalId,
        options,
      );
      return (
        fetch: FetchAPI = portableFetch,
        basePath: string = BASE_PATH,
      ) => {
        return fetch(
          basePath + localVarFetchArgs.url,
          localVarFetchArgs.options,
        ).then((response) => {
          if (response.status >= 200 && response.status < 300) {
            if (response.status === 204) {
                return {}
            }
            return response.json();
          } else {
            throw response;
          }
        });
      };
    },
```
