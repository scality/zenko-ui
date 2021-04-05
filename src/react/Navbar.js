//@flow
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../types/state';
import { ErrorBoundary } from 'react-error-boundary';
import { addOIDCUser } from './actions';

function useWebComponent(src?: string, customElementName: string) {
    const [hasFailed, setHasFailed] = useState(false);
    useLayoutEffect(() => {
        const body = document.body;
        // $flow-disable-line
        const element = [...(body?.querySelectorAll('script') || [])].find(
            // $flow-disable-line
            (scriptElement) => scriptElement.attributes.src?.value === src,
        );
        if (!element && body && src) {
            const scriptElement = document.createElement('script');
            scriptElement.src = src;
            scriptElement.onload = () => {
                customElements.whenDefined(customElementName).catch((e) => {
                    setHasFailed(true);
                });
            };
            scriptElement.onerror = (e) => {
                setHasFailed(true);
            };
            body.appendChild(scriptElement);
        }
    }, [src]);

    if (hasFailed) {
        throw new Error(`Failed to load component ${customElementName}`);
    }
}

type NavbarWebComponent = HTMLElement & { logOut: () => void };

function useLoginEffect(navbarRef: { current: NavbarWebComponent | null }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!navbarRef.current) {
            return;
        }

        const navbarElement = navbarRef.current;

        const onAuthenticated = (evt: Event) => {
            // $flow-disable-line
            if (evt.detail && evt.detail.profile) {
                dispatch(addOIDCUser(evt.detail));
            } else {
                setIsAuthenticated(false);
                // dispatch(addUser(null));
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

    return { isAuthenticated };
}

// function useLogoutEffect(
//     navbarRef: { current: NavbarWebComponent | null },
//     isAuthenticated: boolean,
// ) {
//     const user = useSelector((state: AppState) => state.oidc?.user);
//     // TODO: use useEffect
//     useLayoutEffect(() => {
//         if (!navbarRef.current) {
//             return;
//         }
//
//         if (isAuthenticated && !user) {
//             navbarRef.current.logOut();
//         }
//     }, [navbarRef, user, isAuthenticated]);
// }

function ErrorFallback({ error, resetErrorBoundary }) {
    //Todo redirect to a beautiful error page
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
    console.log('navbarEndpoint!!!', navbarEndpoint);
    // const navbarConfigUrl = useTypedSelector(
    //     (state) => state.config.api?.url_navbar_config,
    // );
    useWebComponent(navbarEndpoint, 'solutions-navbar');

    const navbarRef = useRef<NavbarWebComponent | null>(null);

    useLoginEffect(navbarRef);
    // useLogoutEffect(navbarRef, isAuthenticated);

    return (
        <solutions-navbar
            config-url={navbarConfigUrl}
            style={{ width: '100%' }}
            ref={
                // $flow-disable-line -- flow considers solutions-navbar as a row HTMLElement, TODO find if it is possible to extends JSX flow native definitions with custom element types
                navbarRef
            }
        />
    );
}
