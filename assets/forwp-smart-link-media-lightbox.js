/**
 * Media lightbox: image, video file or YouTube embed in a fullscreen overlay.
 *
 * Trigger: <button data-forwp-media-lightbox="image|video|youtube" data-src data-format data-title>.
 * A click on an image inside [data-forwp-media-lightbox-host] opens the host's trigger.
 */
( function () {
	'use strict';

	var i18n = window.forwpMediaLightbox || { close: 'Close', label: 'Media' };
	var CLOSE_ICON =
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

	/**
	 * Pause media playing in the page next to the trigger.
	 *
	 * @param {Element} host Media wrapper.
	 * @return {number} Current time of a native video (0 — none).
	 */
	function pauseInPage( host ) {
		var time = 0;
		if ( ! host ) {
			return time;
		}
		host.querySelectorAll( 'video' ).forEach( function ( video ) {
			time = video.currentTime || 0;
			video.pause();
		} );
		host.querySelectorAll( 'iframe' ).forEach( function ( frame ) {
			try {
				frame.contentWindow.postMessage(
					JSON.stringify( { event: 'command', func: 'pauseVideo', args: '' } ),
					'*'
				);
			} catch ( e ) {}
		} );
		return time;
	}

	function youtubeSrc( src ) {
		try {
			var url = new URL( src, window.location.href );
			url.searchParams.set( 'autoplay', '1' );
			url.searchParams.set( 'playsinline', '1' );
			url.searchParams.set( 'rel', '0' );
			url.searchParams.delete( 'enablejsapi' );
			return url.toString();
		} catch ( e ) {
			return src;
		}
	}

	function buildMedia( type, src, title, time ) {
		var node;
		if ( 'image' === type ) {
			node = document.createElement( 'img' );
			node.src = src;
			node.alt = title || '';
			node.decoding = 'async';
		} else if ( 'video' === type ) {
			node = document.createElement( 'video' );
			node.src = src;
			node.controls = true;
			node.autoplay = true;
			node.playsInline = true;
			if ( time > 0 ) {
				node.addEventListener(
					'loadedmetadata',
					function () {
						node.currentTime = time;
					},
					{ once: true }
				);
			}
		} else {
			node = document.createElement( 'iframe' );
			node.src = youtubeSrc( src );
			node.title = title || i18n.label;
			node.allow =
				'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
			node.referrerPolicy = 'strict-origin-when-cross-origin';
			node.allowFullscreen = true;
		}
		node.className = 'forwp-media-lightbox__media';
		return node;
	}

	function open( trigger ) {
		var type = trigger.getAttribute( 'data-forwp-media-lightbox' );
		var src = trigger.getAttribute( 'data-src' );
		if ( ! src ) {
			return;
		}
		var format = trigger.getAttribute( 'data-format' ) || '';
		var title = trigger.getAttribute( 'data-title' ) || '';
		var host = trigger.closest( '[data-forwp-media-lightbox-host]' ) || trigger.parentElement;
		var time = 'image' === type ? 0 : pauseInPage( host );

		var overlay = document.createElement( 'div' );
		overlay.className =
			'forwp-media-lightbox is-' + type + ( format ? ' is-' + format : '' );
		overlay.setAttribute( 'role', 'dialog' );
		overlay.setAttribute( 'aria-modal', 'true' );
		overlay.setAttribute( 'aria-label', title || i18n.label );

		var bar = document.createElement( 'div' );
		bar.className = 'forwp-media-lightbox__bar';
		var caption = document.createElement( 'span' );
		caption.className = 'forwp-media-lightbox__title';
		caption.textContent = title;
		var close = document.createElement( 'button' );
		close.type = 'button';
		close.className = 'forwp-media-lightbox__close';
		close.setAttribute( 'aria-label', i18n.close );
		close.title = i18n.close;
		close.innerHTML = CLOSE_ICON;
		bar.appendChild( caption );
		bar.appendChild( close );

		var stage = document.createElement( 'div' );
		stage.className = 'forwp-media-lightbox__stage';
		var frame = document.createElement( 'div' );
		frame.className = 'forwp-media-lightbox__frame';
		frame.appendChild( buildMedia( type, src, title, time ) );
		stage.appendChild( frame );

		overlay.appendChild( bar );
		overlay.appendChild( stage );

		var previousOverflow = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		document.body.appendChild( overlay );
		close.focus();

		function shut() {
			document.removeEventListener( 'keydown', onKey );
			overlay.remove();
			document.documentElement.style.overflow = previousOverflow;
			trigger.focus( { preventScroll: true } );
		}

		function onKey( event ) {
			if ( 'Escape' === event.key ) {
				shut();
			} else if ( 'Tab' === event.key ) {
				// Keep focus inside the dialog.
				event.preventDefault();
				close.focus();
			}
		}

		close.addEventListener( 'click', shut );
		stage.addEventListener( 'click', function ( event ) {
			if ( event.target === stage ) {
				shut();
			}
		} );
		document.addEventListener( 'keydown', onKey );
	}

	document.addEventListener( 'click', function ( event ) {
		var target = event.target instanceof Element ? event.target : null;
		if ( ! target ) {
			return;
		}
		var trigger = target.closest( '[data-forwp-media-lightbox]' );
		if ( ! trigger ) {
			var host = target.closest( '[data-forwp-media-lightbox-host]' );
			if ( host && target.closest( 'img' ) ) {
				trigger = host.querySelector( '[data-forwp-media-lightbox]' );
			}
		}
		if ( trigger ) {
			event.preventDefault();
			open( trigger );
		}
	} );
} )();
