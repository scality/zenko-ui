export function decodeEntities(input = ''): string {
  const entityMap: { [key: string]: string } = {
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&gt;': '>',
    // Add other entities if necessary
  };

  return input.replace(/&[a-z]+;|&#[0-9]+;/gi, (match) => {
    return entityMap[match] || match;
  });
}
