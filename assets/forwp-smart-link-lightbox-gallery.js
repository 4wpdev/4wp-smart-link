/**
 * Extends core/image lightbox: fill imageRef before overlay layout (Cover + carousel slides).
 *
 * @see wp-includes/js/dist/script-modules/interactivity/index.js (universalUnlock)
 */
import { store, getElement, getContext } from '@wordpress/interactivity';

const universalUnlock =
	'I acknowledge that using a private store means my plugin will inevitably break on the next store release.';

let state;
let actions;
let callbacks;

try {
	const imageStore = store( 'core/image', {}, { lock: universalUnlock } );
	state = imageStore.state;
	actions = imageStore.actions;
	callbacks = imageStore.callbacks;
} catch ( error ) {
	// eslint-disable-next-line no-console
	console.warn( '[4wp-smart-link] Lightbox gallery extension skipped.', error );
}

/**
 * @param {string} imageId Metadata key.
 * @return {string}
 */
function escapeImageId( imageId ) {
	if ( typeof CSS !== 'undefined' && CSS.escape ) {
		return CSS.escape( imageId );
	}

	return String( imageId ).replace( /\\/g, '\\\\' ).replace( /"/g, '\\"' );
}

/**
 * @param {string} imageId Metadata key.
 * @return {HTMLImageElement|null}
 */
function findImageElementForId( imageId ) {
	const safeId = escapeImageId( imageId );
	const keyed = document.querySelector( `[data-wp-key="${ safeId }"]` );

	if ( keyed ) {
		const region = keyed.closest( '[data-wp-interactive="core/image"]' );
		const scoped = region || keyed.parentElement;

		if ( scoped ) {
			const fromKey =
				scoped.querySelector( 'img.wp-block-cover__image-background' ) ||
				scoped.querySelector( 'figure.wp-lightbox-container img' ) ||
				scoped.querySelector( 'img' );

			if ( fromKey ) {
				return fromKey;
			}
		}
	}

	const regions = document.querySelectorAll(
		'[data-wp-interactive="core/image"]'
	);

	for ( const region of regions ) {
		const raw = region.getAttribute( 'data-wp-context' );

		if ( ! raw ) {
			continue;
		}

		let ctx;

		try {
			ctx = JSON.parse( raw );
		} catch {
			continue;
		}

		if ( ctx.imageId !== imageId ) {
			continue;
		}

		const img =
			region.querySelector( 'img.wp-block-cover__image-background' ) ||
			region.querySelector( 'figure.wp-lightbox-container img' ) ||
			region.querySelector( '.wp-lightbox-container img' ) ||
			region.querySelector( 'img' );

		if ( img ) {
			return img;
		}
	}

	return null;
}

/**
 * @param {string} imageId Metadata key.
 */
function ensureButtonRef( imageId ) {
	if ( ! imageId || ! state?.metadata?.[ imageId ] ) {
		return;
	}

	const entry = state.metadata[ imageId ];

	if ( entry.buttonRef ) {
		return;
	}

	const safeId = escapeImageId( imageId );
	const keyed = document.querySelector( `[data-wp-key="${ safeId }"]` );

	if ( ! keyed ) {
		return;
	}

	const trigger = keyed.querySelector( '.lightbox-trigger' );

	if ( trigger ) {
		entry.buttonRef = trigger;
	}
}

/**
 * @param {Record<string, unknown>} meta Image metadata entry.
 * @return {HTMLImageElement|null}
 */
function probeImageFromMetadata( meta ) {
	const src = meta?.uploadedSrc;

	if ( typeof src !== 'string' || '' === src ) {
		return null;
	}

	const probe = new Image();
	probe.src = src;

	if ( probe.naturalWidth > 0 && probe.naturalHeight > 0 ) {
		return probe;
	}

	return null;
}

/**
 * @param {string} imageId Metadata key.
 */
function ensureImageRef( imageId ) {
	if ( ! imageId || ! state?.metadata?.[ imageId ] ) {
		return;
	}

	const entry = state.metadata[ imageId ];

	if ( entry.imageRef?.complete ) {
		return;
	}

	const domImg = findImageElementForId( imageId );

	if ( domImg ) {
		entry.imageRef = domImg;
		entry.currentSrc = domImg.currentSrc || domImg.src;
		return;
	}

	const probe = probeImageFromMetadata( entry );

	if ( probe ) {
		entry.imageRef = probe;
		entry.currentSrc = srcFromMetadata( entry );
	}
}

/**
 * @param {Record<string, unknown>} meta Image metadata.
 * @return {string}
 */
function srcFromMetadata( meta ) {
	return typeof meta.uploadedSrc === 'string' ? meta.uploadedSrc : '';
}

function ensureGalleryImageRefs() {
	if ( ! state?.selectedGalleryId || ! state.metadata ) {
		return;
	}

	for ( const [ imageId, meta ] of Object.entries( state.metadata ) ) {
		if ( meta?.galleryId === state.selectedGalleryId ) {
			ensureImageRef( imageId );
		}
	}
}

/**
 * @param {Record<string, unknown>} meta Selected image metadata.
 */
function applyCenteredOverlayStyles( meta ) {
	const imageRef = meta.imageRef;
	const parsedWidth = parseFloat( meta.targetWidth );
	const parsedHeight = parseFloat( meta.targetHeight );
	const naturalWidth =
		meta.targetWidth &&
		meta.targetWidth !== 'none' &&
		! Number.isNaN( parsedWidth )
			? parsedWidth
			: imageRef?.naturalWidth || 1200;
	const naturalHeight =
		meta.targetHeight &&
		meta.targetHeight !== 'none' &&
		! Number.isNaN( parsedHeight )
			? parsedHeight
			: imageRef?.naturalHeight || 800;

	let imgMaxWidth = naturalWidth;
	let imgMaxHeight = naturalHeight;

	let horizontalPadding = 80;
	let verticalPadding = 160;

	if ( window.innerWidth > 960 ) {
		horizontalPadding = state.hasNavigation ? 320 : 80;
		verticalPadding = 80;
	} else if ( window.innerWidth <= 480 ) {
		horizontalPadding = 0;
		verticalPadding = 160;
	}

	const targetMaxWidth = Math.min(
		window.innerWidth - horizontalPadding,
		imgMaxWidth
	);
	const targetMaxHeight = Math.min(
		window.innerHeight - verticalPadding,
		imgMaxHeight
	);
	const imgRatio = imgMaxWidth / imgMaxHeight;
	const targetContainerRatio = targetMaxWidth / targetMaxHeight;
	let containerWidth = imgMaxWidth;
	let containerHeight = imgMaxHeight;

	if ( imgRatio > targetContainerRatio ) {
		containerWidth = targetMaxWidth;
		containerHeight = containerWidth / imgRatio;
	} else {
		containerHeight = targetMaxHeight;
		containerWidth = containerHeight * imgRatio;
	}

	const centerX = window.innerWidth / 2;
	const centerY = window.innerHeight / 2;

	state.overlayStyles = `
		--wp--lightbox-initial-top-position: ${ centerY }px;
		--wp--lightbox-initial-left-position: ${ centerX }px;
		--wp--lightbox-container-width: ${ containerWidth + 1 }px;
		--wp--lightbox-container-height: ${ containerHeight + 1 }px;
		--wp--lightbox-image-width: ${ containerWidth }px;
		--wp--lightbox-image-height: ${ containerHeight }px;
		--wp--lightbox-scale: 1;
		--wp--lightbox-scrollbar-width: ${
			window.innerWidth - document.documentElement.clientWidth
		}px;
	`;
}

/**
 * @param {Record<string, unknown>|undefined} meta Selected image metadata.
 * @return {boolean}
 */
function isCoverLightboxSlide( meta ) {
	const classNames = meta?.imgClassNames;

	return (
		typeof classNames === 'string' &&
		classNames.includes( 'wp-block-cover__image-background' )
	);
}

/**
 * @param {HTMLElement|null} img Cover background image.
 * @return {boolean}
 */
function isCoverLightboxImage( img ) {
	if ( ! img ) {
		return false;
	}

	return (
		img.classList.contains( 'wp-block-cover__image-background' ) ||
		img.classList.contains( 'forwp-smart-link-cover-lightbox__ref' )
	);
}

function runSetOverlayStyles( originalSetOverlayStyles ) {
	if ( ! state?.overlayEnabled ) {
		return;
	}

	ensureGalleryImageRefs();
	ensureImageRef( state.selectedImageId );

	const meta = state.selectedImage;

	if ( ! meta ) {
		return;
	}

	if ( ! meta.imageRef ) {
		const probe = probeImageFromMetadata( meta );

		if ( probe ) {
			meta.imageRef = probe;
			meta.currentSrc = srcFromMetadata( meta );
		}
	}

	if ( ! meta.imageRef ) {
		applyCenteredOverlayStyles( meta );
		return;
	}

	if ( isCoverLightboxSlide( meta ) ) {
		applyCenteredOverlayStyles( meta );
		return;
	}

	try {
		originalSetOverlayStyles.call( this );
	} catch ( error ) {
		applyCenteredOverlayStyles( meta );
	}
}

if ( callbacks?.setOverlayStyles && state ) {
	const originalSetOverlayStyles = callbacks.setOverlayStyles;

	callbacks.setOverlayStyles = function forwpSetOverlayStyles() {
		runSetOverlayStyles( originalSetOverlayStyles );
	};
}

/*
 * Cover: skip core setButtonStyles (wrong figure parent). Register imageRef only;
 * trigger position/visibility is CSS-only in forwp-smart-link-frontend.css.
 */
if ( callbacks?.setButtonStyles && state ) {
	const originalSetButtonStyles = callbacks.setButtonStyles;

	callbacks.setButtonStyles = function forwpSetButtonStyles() {
		const { ref } = getElement();

		if ( ! isCoverLightboxImage( ref ) ) {
			originalSetButtonStyles.call( this );
			return;
		}

		const { imageId } = getContext();

		if ( ! imageId || ! state.metadata?.[ imageId ] ) {
			return;
		}

		state.metadata[ imageId ].imageRef = ref;
		state.metadata[ imageId ].currentSrc = ref.currentSrc || ref.src;
	};
}

/*
 * After gallery navigation, buttonRef can be missing on Cover slides; core hideLightbox()
 * then throws on focus() and never clears selectedImageId — handleScroll locks scroll.
 */
if ( actions?.hideLightbox && state ) {
	actions.hideLightbox = function forwpHideLightbox() {
		if ( ! state.overlayEnabled ) {
			return;
		}

		state.overlayEnabled = false;

		setTimeout( function () {
			ensureButtonRef( state.selectedImageId );

			const buttonRef = state.selectedImage?.buttonRef;

			if ( buttonRef?.focus ) {
				try {
					buttonRef.focus( { preventScroll: true } );
				} catch {
					// Focus is optional; state reset below is required for scroll unlock.
				}
			}

			state.selectedImageId = null;
			state.selectedGalleryId = null;
		}, 450 );
	};
}

if ( actions?.handleScroll && state ) {
	const originalHandleScroll = actions.handleScroll;

	actions.handleScroll = function forwpHandleScroll() {
		if ( ! state.overlayEnabled ) {
			return;
		}

		originalHandleScroll.call( this );
	};
}

if ( actions?.showNextImage && state ) {
	const originalShowNextImage = actions.showNextImage;

	actions.showNextImage = function forwpShowNextImage( event ) {
		originalShowNextImage.call( this, event );
		ensureButtonRef( state.selectedImageId );
	};
}

if ( actions?.showPreviousImage && state ) {
	const originalShowPreviousImage = actions.showPreviousImage;

	actions.showPreviousImage = function forwpShowPreviousImage( event ) {
		originalShowPreviousImage.call( this, event );
		ensureButtonRef( state.selectedImageId );
	};
}
