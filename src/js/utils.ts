export function chunkArray(
  myArray: Array<any>,
  chunk_size: number,
): Array<any> {
  const tempArray = [];

  for (let index = 0; index < myArray.length; index += chunk_size) {
    const myChunk = myArray.slice(index, index + chunk_size);
    tempArray.push(myChunk);
  }

  return tempArray;
}
export function removeTrailingSlash(prefix: string): string {
  if (prefix.slice(-1) === '/') {
    return prefix.slice(0, -1);
  } else {
    return prefix;
  }
}