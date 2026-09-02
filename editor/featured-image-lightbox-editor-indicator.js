/**
 * Editor preview: lightbox trigger on Post Featured Image when Enlarge on click is on.
 */

import { useLayoutEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const MARKER = 'data-forwp-featured-image-lightbox-editor';

const LIGHTBOX_TRIGGER_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
	'<path fill="#fff" d="M2 0a2 2 0 0 0-2 2v2h1.5V2a.5.5 0 0 1 .5-.5h2V0H2Zm2 10.5H2a.5.5 0 0 1-.5-.5V8H0v2a2 2 0 0 0 2 2h2v-1.5ZM8 12v-1.5h2a.5.5 0 0 0 .5-.5V8H12v2a2 2 0 0 1-2 2H8Zm2-12a2 2 0 0 1 2 2v2h-1.5V2a.5.5 0 0 0-.5-.5H8V0h2Z" />' +
	'</svg>';

/**
 * @param {string} clientId Block client id.
 * @return {HTMLElement|null}
 */
function getFeaturedImageElement( clientId ) {
	const root = document.getElementById( `block-${ clientId }` );
	if ( ! root ) {
		return null;
	}
	return root.querySelector( '.wp-block-post-featured-image' );
}

/**
 * @param {HTMLElement} figureEl Featured Image root in the canvas.
 */
function mountLightboxIndicator( figureEl ) {
	figureEl.classList.add( 'forwp-smart-link-featured-image-has-lightbox' );
	figureEl.classList.add( 'wp-lightbox-container' );

	if ( figureEl.querySelector( `[${ MARKER }="true"]` ) ) {
		return;
	}

	const button = document.createElement( 'button' );
	button.type = 'button';
	button.className =
		'lightbox-trigger forwp-smart-link-featured-image-lightbox__trigger';
	button.setAttribute( MARKER, 'true' );
	button.setAttribute( 'aria-haspopup', 'dialog' );
	button.setAttribute(
		'aria-label',
		__( 'Enlarge on click', '4wp-smart-link' )
	);
	button.tabIndex = -1;
	button.innerHTML = LIGHTBOX_TRIGGER_SVG;

	figureEl.appendChild( button );
}

/**
 * @param {HTMLElement|null} figureEl Featured Image root in the canvas.
 */
function unmountLightboxIndicator( figureEl ) {
	if ( ! figureEl ) {
		return;
	}

	figureEl.classList.remove( 'forwp-smart-link-featured-image-has-lightbox' );
	figureEl.classList.remove( 'wp-lightbox-container' );
	figureEl
		.querySelectorAll( `[${ MARKER }="true"]` )
		.forEach( ( node ) => node.remove() );
}

/**
 * @param {Object} props
 * @param {string} props.clientId Block client id.
 * @param {boolean} props.enabled  Whether lightbox destination is active.
 * @param {string} props.syncKey   Changes when featured image may re-render.
 */
export function FeaturedImageLightboxEditorIndicator( {
	clientId,
	enabled,
	syncKey,
} ) {
	useLayoutEffect( () => {
		if ( ! enabled || ! clientId ) {
			const figure = getFeaturedImageElement( clientId );
			unmountLightboxIndicator( figure );
			return undefined;
		}

		const sync = () => {
			const figure = getFeaturedImageElement( clientId );
			if ( figure ) {
				mountLightboxIndicator( figure );
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
			unmountLightboxIndicator( getFeaturedImageElement( clientId ) );
		};
	}, [ clientId, enabled, syncKey ] );

	return null;
}
