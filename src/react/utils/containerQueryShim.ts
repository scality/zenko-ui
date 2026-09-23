/**
 * TODO(jsdom): delete once the test environment ships jsdom >= 23.
 *
 * jsdom 20 cannot parse `@container`; one unparseable at-rule makes it discard the entire
 * shared stylesheet rather than just that rule, silently dropping the `visibility: hidden`
 * that Accordion and Toggle rely on and making collapsed fields and inactive toggles
 * queryable. Stripping container queries in tests loses no coverage, since they need real
 * layout that jsdom does not do anyway.
 */

const stripContainerQueries = (css: string): string => {
  let out = css;
  for (;;) {
    const match = /@container[^{]*\{/i.exec(out);
    if (!match) return out;
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < out.length && depth > 0) {
      if (out[i] === '{') depth++;
      else if (out[i] === '}') depth--;
      i++;
    }
    out = out.slice(0, match.index) + out.slice(i);
  }
};

export const installContainerQueryShim = () => {
  const styleProto = window.HTMLStyleElement.prototype;

  let descriptor: PropertyDescriptor | undefined;
  for (let proto = styleProto as object | null; proto && !descriptor; proto = Object.getPrototypeOf(proto)) {
    descriptor = Object.getOwnPropertyDescriptor(proto, 'textContent');
  }

  if (descriptor?.get && descriptor?.set) {
    const { get, set } = descriptor;
    Object.defineProperty(styleProto, 'textContent', {
      configurable: true,
      get() {
        return get.call(this);
      },
      set(value) {
        set.call(this, typeof value === 'string' ? stripContainerQueries(value) : value);
      },
    });
  }

  // styled-components inserts each rule as a text node (`insertBefore(textNode,
  // nodes[i] || null)`) rather than assigning textContent, so sanitise the node
  // itself on both insertion paths.
  const sanitiseTextNode = (node: Node) => {
    if (node.nodeType === 3 && typeof node.textContent === 'string') {
      node.textContent = stripContainerQueries(node.textContent);
    }
    return node;
  };

  const originalAppendChild = styleProto.appendChild;
  styleProto.appendChild = function appendChild<T extends Node>(node: T): T {
    return originalAppendChild.call(this, sanitiseTextNode(node)) as T;
  };

  const originalInsertBefore = styleProto.insertBefore;
  styleProto.insertBefore = function insertBefore<T extends Node>(node: T, child: Node | null): T {
    return originalInsertBefore.call(this, sanitiseTextNode(node), child) as T;
  };

  // And the CSSOM path, used when styled-components runs in "speedy" mode.
  const sheetProto = window.CSSStyleSheet.prototype;
  const originalInsertRule = sheetProto.insertRule;
  sheetProto.insertRule = function insertRule(rule: string, index?: number) {
    if (/^\s*@container/i.test(rule)) return index ?? 0;
    return originalInsertRule.call(this, rule, index);
  };
};
