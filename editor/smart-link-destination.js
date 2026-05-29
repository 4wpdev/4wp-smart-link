/**
 * Smart Link destination contract (editor + parity with PHP Smart_Link_Destination).
 */

export const SMART_LINK_DESTINATION = {
	CUSTOM: 'custom',
	POST: 'post',
	MEDIA: 'media',
	LIGHTBOX: 'lightbox',
};

export const SMART_LINK_CARD_DESTINATIONS = [
	SMART_LINK_DESTINATION.CUSTOM,
	SMART_LINK_DESTINATION.POST,
	SMART_LINK_DESTINATION.MEDIA,
];

export const SMART_LINK_BASE_ATTRIBUTES = {
	smartLinkDestination: {
		type: 'string',
		default: '',
	},
	smartLinkUrl: {
		type: 'string',
		default: '',
	},
	smartLinkNewTab: {
		type: 'boolean',
		default: false,
	},
	smartLinkRel: {
		type: 'string',
		default: '',
	},
	smartLinkAriaLabel: {
		type: 'string',
		default: '',
	},
	smartLinkToCurrentPost: {
		type: 'boolean',
		default: false,
	},
};

/** Cover-only: mirrors core/image `lightbox` attribute shape for core WP lightbox gallery. */
export const SMART_LINK_COVER_ATTRIBUTES = {
	smartLinkLightbox: {
		type: 'object',
		default: {},
	},
};

const KNOWN = new Set( Object.values( SMART_LINK_DESTINATION ) );

/**
 * @param {Record<string, unknown>} attributes Block attributes.
 * @return {string} Destination slug or empty string.
 */
export function resolveSmartLinkDestination( attributes ) {
	const stored =
		typeof attributes?.smartLinkDestination === 'string'
			? attributes.smartLinkDestination
			: '';

	if ( KNOWN.has( stored ) ) {
		return stored;
	}

	if ( attributes?.smartLinkToCurrentPost ) {
		return SMART_LINK_DESTINATION.POST;
	}

	if ( attributes?.smartLinkUrl ) {
		return SMART_LINK_DESTINATION.CUSTOM;
	}

	return '';
}

/**
 * @param {Record<string, unknown>} attributes Block attributes.
 * @return {boolean}
 */
export function isSmartLinkLightboxEnabled( attributes ) {
	if ( resolveSmartLinkDestination( attributes ) !== SMART_LINK_DESTINATION.LIGHTBOX ) {
		return false;
	}

	const lightbox = attributes?.smartLinkLightbox;

	if ( lightbox && typeof lightbox === 'object' && 'enabled' in lightbox ) {
		return !! lightbox.enabled;
	}

	return true;
}

/**
 * @param {Record<string, unknown>} attributes Block attributes.
 * @return {boolean}
 */
export function isSmartLinkActive( attributes ) {
	const destination = resolveSmartLinkDestination( attributes );

	if ( ! destination ) {
		return false;
	}

	if ( destination === SMART_LINK_DESTINATION.LIGHTBOX ) {
		return isSmartLinkLightboxEnabled( attributes );
	}

	return true;
}

/**
 * @param {Record<string, unknown>} attributes Block attributes.
 * @return {boolean}
 */
export function usesSmartLinkCardNavigation( attributes ) {
	return SMART_LINK_CARD_DESTINATIONS.includes(
		resolveSmartLinkDestination( attributes )
	);
}

/**
 * @param {Record<string, unknown>} attributes Block attributes.
 * @return {boolean}
 */
export function isSmartLinkLightboxMode( attributes ) {
	return (
		resolveSmartLinkDestination( attributes ) ===
			SMART_LINK_DESTINATION.LIGHTBOX &&
		isSmartLinkLightboxEnabled( attributes )
	);
}

/**
 * Whether this Cover lightbox joins the page-wide gallery (prev/next on the front end).
 *
 * @param {Record<string, unknown>} attributes Block attributes.
 * @return {boolean}
 */
export function isLightboxInPageGallery( attributes ) {
	if ( ! isSmartLinkLightboxMode( attributes ) ) {
		return false;
	}

	const lightbox = attributes?.smartLinkLightbox;

	if (
		lightbox &&
		typeof lightbox === 'object' &&
		'includeInPageGallery' in lightbox
	) {
		return !! lightbox.includeInPageGallery;
	}

	return true;
}

/**
 * @param {string} destination Destination slug or '' to reset.
 * @return {Record<string, unknown>}
 */
export function smartLinkDestinationPatch( destination ) {
	const patch = {
		smartLinkDestination: destination,
		smartLinkUrl: '',
		smartLinkNewTab: false,
		smartLinkRel: '',
		smartLinkAriaLabel: '',
		smartLinkToCurrentPost: false,
		smartLinkLightbox: {},
	};

	switch ( destination ) {
		case SMART_LINK_DESTINATION.CUSTOM:
			patch.smartLinkToCurrentPost = false;
			patch.smartLinkLightbox = { enabled: false };
			break;
		case SMART_LINK_DESTINATION.POST:
			patch.smartLinkLightbox = { enabled: false };
			break;
		case SMART_LINK_DESTINATION.MEDIA:
			patch.smartLinkToCurrentPost = false;
			patch.smartLinkLightbox = { enabled: false };
			break;
		case SMART_LINK_DESTINATION.LIGHTBOX:
			patch.smartLinkLightbox = {
				enabled: true,
				includeInPageGallery: true,
			};
			break;
		default:
			patch.smartLinkDestination = '';
			break;
	}

	return patch;
}

/**
 * One-time sync: persist smartLinkDestination for blocks saved before v1.2.
 *
 * @param {Record<string, unknown>} attributes Block attributes.
 * @return {Record<string, unknown>|null} Patch or null when nothing to do.
 */
export function legacyDestinationMigrationPatch( attributes ) {
	if ( attributes?.smartLinkDestination ) {
		return null;
	}

	const inferred = resolveSmartLinkDestination( attributes );

	if ( ! inferred ) {
		return null;
	}

	return { smartLinkDestination: inferred };
}
