/**
 * Editor preview: core/image-style lightbox trigger on Cover when Enlarge on click is on.
 */

import { useLayoutEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const MARKER = 'data-forwp-cover-lightbox-editor';

const LIGHTBOX_TRIGGER_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
	'<path fill="#fff" d="M2 0a2 2 0 0 0-2 2v2h1.5V2a.5.5 0 0 1 .5-.5h2V0H2Zm2 10.5H2a.5.5 0 0 1-.5-.5V8H0v2a2 2 0 0 0 2 2h2v-1.5ZM8 12v-1.5h2a.5.5 0 0 0 .5-.5V8H12v2a2 2 0 0 1-2 2H8Zm2-12a2 2 0 0 1 2 2v2h-1.5V2a.5.5 0 0 0-.5-.5H8V0h2Z" />' +
	'</svg>';

/**
 * @param {string} clientId Block client id.
 * @return {HTMLElement|null}
 */
function getCoverElement( clientId ) {
	const root = document.getElementById( `block-${ clientId }` );
	if ( ! root ) {
		return null;
	}
	return root.querySelector( '.wp-block-cover' );
}

/**
 * @param {HTMLElement} coverEl Cover root in the canvas.
 */
function mountLightboxIndicator( coverEl ) {
	coverEl.classList.add( 'forwp-smart-link-cover-has-lightbox' );

	if ( coverEl.querySelector( `[${ MARKER }="true"]` ) ) {
		return;
	}

	const container = document.createElement( 'span' );
	container.className =
		'wp-lightbox-container forwp-smart-link-cover-lightbox forwp-smart-link-cover-lightbox-editor';
	container.setAttribute( MARKER, 'true' );

	const button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'lightbox-trigger';
	button.setAttribute( 'aria-haspopup', 'dialog' );
	button.setAttribute(
		'aria-label',
		__( 'Enlarge on click', '4wp-smart-link' )
	);
	button.tabIndex = -1;
	button.innerHTML = LIGHTBOX_TRIGGER_SVG;

	container.appendChild( button );
	coverEl.appendChild( container );
}

/**
 * @param {HTMLElement|null} coverEl Cover root in the canvas.
 */
function unmountLightboxIndicator( coverEl ) {
	if ( ! coverEl ) {
		return;
	}

	coverEl.classList.remove( 'forwp-smart-link-cover-has-lightbox' );
	coverEl
		.querySelectorAll( `[${ MARKER }="true"]` )
		.forEach( ( node ) => node.remove() );
}

/**
 * @param {Object} props
 * @param {string} props.clientId   Cover block client id.
 * @param {boolean} props.enabled   Whether lightbox destination is active.
 * @param {string} props.syncKey    Changes when cover media/layout may re-render.
 */
export function CoverLightboxEditorIndicator( { clientId, enabled, syncKey } ) {
	useLayoutEffect( () => {
		if ( ! enabled || ! clientId ) {
			const cover = getCoverElement( clientId );
			unmountLightboxIndicator( cover );
			return undefined;
		}

		const sync = () => {
			const cover = getCoverElement( clientId );
			if ( cover ) {
				mountLightboxIndicator( cover );
			}
		};

		sync();
		const raf = window.requestAnimationFrame( sync );

		const root = document.getElementById( `block-${ clientId }` );
		const observer =
			root &&
			new MutationObserver( () => {
				window.requestAnimationFrame( sync );
			} );

		if ( observer && root ) {
			observer.observe( root, { childList: true, subtree: true } );
		}

		return () => {
			window.cancelAnimationFrame( raf );
			if ( observer ) {
				observer.disconnect();
			}
			unmountLightboxIndicator( getCoverElement( clientId ) );
		};
	}, [ clientId, enabled, syncKey ] );

	return null;
}
