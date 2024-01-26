/* eslint-disable */
import MiddleEllipsis, { ellipseNode } from '../MiddleEllipsis';
import React from 'react';
import { reduxMount } from '../../utils/testUtil';
describe('MiddleEllipsis', () => {
  const container = {
    offsetWidth: 50,
  };
  const sentence = 'My long long long long sentence';
  const txtNode = document.createTextNode(sentence);
  //@ts-expect-error fix this when you are working on it
  txtNode.offsetWidth = 100;

  //@ts-expect-error fix this when you are working on it
  txtNode.setAttribute = () => {};

  it('middle ellipsis event listener add/remove', () => {
    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'removeEventListener');
    const { component } = reduxMount(<MiddleEllipsis text={'text'} />);
    expect(window.addEventListener).toHaveBeenCalled();
    component.unmount();
    expect(window.removeEventListener).toHaveBeenCalled();
  });
  it('ellipseNode should middle truncate TextNode', () => {
    txtNode.textContent = sentence;
    //@ts-expect-error fix this when you are working on it
    const isEllipsized = ellipseNode(container, txtNode, sentence);
    expect(isEllipsized).toBeTruthy();
    expect(txtNode.textContent).toBe('My lon...entence');
  });
  it('ellipseNode with ellipsisText should display correctly', () => {
    txtNode.textContent = sentence;
    const ellipsisText = '&&&&';
    const isEllipsized = ellipseNode(
      //@ts-expect-error fix this when you are working on it
      container,
      txtNode,
      sentence,
      ellipsisText,
    );
    expect(isEllipsized).toBeTruthy();
    // search if ellipsisText is in textContent
    expect(txtNode.textContent.search(ellipsisText) === -1).toBeFalsy();
  });
  it('ellipseNode with trailingCharCount should display correctly', () => {
    txtNode.textContent = sentence;
    const ellipsisText = '...';
    const trailingCharCount = 3;
    const isEllipsized = ellipseNode(
      //@ts-expect-error fix this when you are working on it
      container,
      txtNode,
      sentence,
      ellipsisText,
      trailingCharCount,
    );
    expect(isEllipsized).toBeTruthy();
    const ellipsizedText = txtNode.textContent;
    const lengthAfterEllipsis = ellipsizedText.substr(
      ellipsizedText.indexOf(ellipsisText) + ellipsisText.length,
    ).length;
    expect(lengthAfterEllipsis).toBe(trailingCharCount);
  });
  it('should return false if passing null node', () => {
    expect(ellipseNode(null, null, null)).toBeFalsy();
  });
  it('ellipseNode should return false if text is empty', () => {
    const sentence = '';
    txtNode.textContent = sentence;
    const isEllipsized = ellipseNode(
      //@ts-expect-error fix this when you are working on it
      container,
      txtNode,
      sentence,
    );
    expect(isEllipsized).toBe(false);
  });
  it('ellipseNode should return false if text is undefined', () => {
    const sentence = undefined;
    txtNode.textContent = sentence;
    const isEllipsized = ellipseNode(
      //@ts-expect-error fix this when you are working on it
      container,
      txtNode,
      sentence,
    );
    expect(isEllipsized).toBe(false);
  });
});
