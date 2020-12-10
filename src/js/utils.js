// @flow
export function chunkArray(myArray: Array<any>, chunk_size: number): Array<any> {
    const arrayLength = myArray.length;
    const tempArray = [];

    for (let index = 0; index < arrayLength; index += chunk_size) {
        const myChunk = myArray.slice(index, index+chunk_size);
        tempArray.push(myChunk);
    }

    return tempArray;
}
