//@flow
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { addOIDCUser, setTheme } from './actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../types/state';
import { ErrorBoundary } from 'react-error-boundary';

function useWebComponent(src?: string, customElementName: string) {
    const [hasFailed, setHasFailed] = useState(false);
    useLayoutEffect(() => {
        const body = document.body;
        const element = [...(body?.querySelectorAll('script') || [])].find(
            // eslint-disable-next-line flowtype-errors/show-errors
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
    }, [src]);

    if (hasFailed) {
        throw new Error(`Failed to load component ${customElementName}`);
    }
}

type NavbarWebComponent = HTMLElement;

function useLoginEffect(navbarRef: { current: NavbarWebComponent | null }) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!navbarRef.current) {
            return;
        }

        const navbarElement = navbarRef.current;

        const onAuthenticated = (evt: Event) => {
            // eslint-disable-next-line flowtype-errors/show-errors
            if (evt.detail && evt.detail.profile) {
                dispatch(addOIDCUser(evt.detail));
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
            // flow is not accepting CustomEvent type for listener arguments of {add,remove}EventListener https://github.com/facebook/flow/issues/7179
            // eslint-disable-next-line flowtype-errors/show-errors
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
    const navbarEndpoint = useSelector((state: AppState) => state.auth.config.navbarEndpoint);
    const navbarConfigUrl = useSelector((state: AppState) => state.auth.config.navbarConfigUrl);
    useWebComponent(navbarEndpoint, 'solutions-navbar');

    const navbarRef = useRef<NavbarWebComponent | null>(null);

    useLoginEffect(navbarRef);
    useThemeEffect(navbarRef);

    return (
        // Set font-size to be consitent with other UIs.
        <div style={{ fontSize: 'max(14px,calc(.2em + .8vw))' }}>
            <solutions-navbar
                config-url={navbarConfigUrl}
                style={{ width: '100%' }}
                ref={
                    navbarRef
                }
            />
        </div>
    );
}
