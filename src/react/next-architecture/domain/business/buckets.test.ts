describe('Buckets domain', () => {
  describe('useListBucketsForCurrentAccount', () => {
    it('should first list all buckets', () => {
      // TODO
    });

    it('should return an error if the list buckets fails', () => {
      // TODO
    });

    it('should return the location constraint for the first 20 buckets', () => {
      // TODO
    });

    it('should return an error if the location constraint fetching failed', () => {
      // TODO
    });

    it('should return the latest used capacity for the first 20 buckets', () => {
      // TODO
    });

    it('should return an error if the latest used capacity fetching failed', () => {
      // TODO
    });
  });

  describe('useBucketLocationConstraint', () => {
    it('should return the location constraint for a specific bucket', () => {
      // TODO
    });

    it('should return an error if the location constraint fetching failed', () => {
      // TODO
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the additional fetched information in case of success', () => {
      // TODO
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the error status and message in case of failure', () => {
      // TODO
    });
  });

  describe('useBucketLatestUsedCapacity', () => {
    it('should return the latest used capacity for a specific bucket', () => {
      // TODO
    });

    it('should return an error if the latest used capacity fetching failed', () => {
      // TODO
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the additional fetched information in case of success', () => {
      // TODO
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the error status and message in case of failure', () => {
      // TODO
    });
  });
});
