import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { addOIDCUser, setOIDCLogout, setTheme } from './actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../types/state';
import { ErrorBoundary } from 'react-error-boundary';
import type { OidcLogoutFunction } from '../types/auth';

function useWebComponent(src?: string, customElementName: string) {
  const [hasFailed, setHasFailed] = useState(false);
  useLayoutEffect(() => {
    const body = document.body;
    const element = [...(body?.querySelectorAll('script') || [])].find(
      (scriptElement) => scriptElement.attributes.src?.value === src,
    );

    if (!element && body && src) {
      const scriptElement = document.createElement('script');
      scriptElement.src = src;

      scriptElement.onload = () => {
        customElements.whenDefined(customElementName).catch(() => {
          setHasFailed(true);
        });
      };

      scriptElement.onerror = () => {
        setHasFailed(true);
      };

      body.appendChild(scriptElement);
    }
  }, [src, customElementName]);

  if (hasFailed) {
    throw new Error(`Failed to load component ${customElementName}`);
  }
}

type NavbarWebComponent = HTMLElement & {
  logOut: OidcLogoutFunction;
};

function useLoginEffect(navbarRef: { current: NavbarWebComponent | null }) {
  const dispatch = useDispatch();
  useEffect(() => {
    if (!navbarRef.current) {
      return;
    }

    const navbarElement = navbarRef.current;

    const onAuthenticated = (evt: Event) => {
      if (evt.detail && evt.detail.profile) {
        dispatch(addOIDCUser(evt.detail));
        dispatch(setOIDCLogout(navbarElement.logOut || null));
      }
    };

    navbarElement.addEventListener(
      'solutions-navbar--authenticated',
      onAuthenticated,
    );
    return () => {
      navbarElement.removeEventListener(
        'solutions-navbar--authenticated',
        onAuthenticated,
      );
    };
  }, [navbarRef, dispatch]);
}

function useThemeEffect(navbarRef: { current: NavbarWebComponent | null }) {
  const dispatch = useDispatch();
  useEffect(() => {
    if (!navbarRef.current) {
      return;
    }

    const navbarElement = navbarRef.current;

    const onThemeChanged = (evt: Event) => {
      if (evt.detail) {
        dispatch(setTheme(evt.detail));
      }
    };

    navbarElement.addEventListener(
      'solutions-navbar--theme-changed',
      onThemeChanged,
    );
    return () => {
      navbarElement.removeEventListener(
        'solutions-navbar--theme-changed',
        onThemeChanged,
      );
    };
  }, [navbarRef, dispatch]);
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

export function Navbar() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <InternalNavbar />
    </ErrorBoundary>
  );
}

function InternalNavbar() {
  const navbarEndpoint = useSelector(
    (state: AppState) => state.auth.config.navbarEndpoint,
  );
  const navbarConfigUrl = useSelector(
    (state: AppState) => state.auth.config.navbarConfigUrl,
  );
  useWebComponent(navbarEndpoint, 'solutions-navbar');
  const navbarRef = useRef(null);
  useLoginEffect(navbarRef);
  useThemeEffect(navbarRef);

  return (
    <solutions-navbar
      config-url={navbarConfigUrl} // Set font-size to be consitent with other UIs.
      style={{
        width: '100%',
        fontSize: 'max(14px, 0.972vw);',
      }}
      ref={navbarRef}
    />
  );
}
