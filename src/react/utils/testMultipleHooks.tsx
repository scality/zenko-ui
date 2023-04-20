import { render, waitFor } from '@testing-library/react';
import {
  FunctionComponent,
  PropsWithChildren,
  useState,
  useEffect,
} from 'react';
import { act } from 'react-dom/test-utils';

export function prepareRenderMultipleHooks(options: {
  wrapper: FunctionComponent<PropsWithChildren<Record<string, never>>>;
}): {
  renderAdditionalHook: (
    key: string,
    callback: () => unknown,
  ) => {
    result: { current: unknown; all: unknown[] };
    waitFor: (fn: () => Promise<unknown> | unknown) => Promise<unknown>;
  };
} {
  const RENDER_HOOK_EVENT = 'RENDER_HOOK_EVENT';

  function TestComponents({
    addValues,
  }: {
    addValues: (vals: { key: string; value: unknown }[]) => void;
  }) {
    const [components, setComponents] = useState<JSX.Element[]>([]);

    useEffect(() => {
      const listener = (
        e: CustomEvent<{ key: string; callback: () => unknown }>,
      ) => {
        function TestComponent() {
          const hook = e.detail.callback();

          useEffect(() => {
            addValues([{ key: e.detail.key, value: hook }]);
          });
          return <></>;
        }
        act(() => {
          setComponents((prev) => [...prev, <TestComponent />]);
        });
      };
      //eslint-disable-next-line
      //@ts-ignore
      window.addEventListener(RENDER_HOOK_EVENT, listener);
      return () => {
        //eslint-disable-next-line
        //@ts-ignore
        window.removeEventListener(RENDER_HOOK_EVENT, listener);
      };
    }, []);

    return (
      <>
        {components.map((c, i) => {
          return <div key={i}>{c}</div>;
        })}
      </>
    );
  }
  const values: { key: string; value: unknown }[] = [];
  render(
    //eslint-disable-next-line
    //@ts-ignore
    <options.wrapper>
      <TestComponents
        addValues={(vals) => {
          values.unshift(...vals);
        }}
      />
    </options.wrapper>,
  );

  return {
    //eslint-disable-next-line
    //@ts-ignore
    renderAdditionalHook: (key: string, callback: () => void) => {
      const event = new CustomEvent(RENDER_HOOK_EVENT, {
        detail: { key, callback },
      });
      //eslint-disable-next-line
      //@ts-ignore
      window.dispatchEvent(event);
      return {
        result: new Proxy(values, {
          get: (target, prop) => {
            if (prop === 'current') {
              return target.find((v) => v.key === key)?.value;
            }
            if (prop === 'all') {
              return target.filter((v) => v.key === key).map((v) => v.value);
            }
          },
        }),
        waitFor: waitFor,
      };
    },
  };
}
