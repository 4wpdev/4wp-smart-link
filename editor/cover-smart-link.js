/**
 * Cover block helpers for Smart Link media + lightbox destinations.
 */

import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * @param {Record<string, unknown>} coverAttributes Cover block attributes.
 * @return {boolean}
 */
export function coverHasImageBackground( coverAttributes ) {
	const backgroundType = coverAttributes?.backgroundType;

	if ( backgroundType && 'image' !== backgroundType ) {
		return false;
	}

	return true;
}

/**
 * @param {Record<string, unknown>} coverAttributes Cover block attributes.
 * @return {boolean}
 */
export function coverCanUseImageLinkModes( coverAttributes ) {
	if ( ! coverHasImageBackground( coverAttributes ) ) {
		return false;
	}

	if ( coverAttributes?.id || coverAttributes?.url ) {
		return true;
	}

	if ( coverAttributes?.useFeaturedImage ) {
		return true;
	}

	return false;
}

/**
 * Resolved background image URL for editor previews (matches PHP resolver intent).
 *
 * @param {Record<string, unknown>} coverAttributes Cover block attributes.
 * @return {string}
 */
export function useCoverBackgroundMediaUrl( coverAttributes ) {
	const { id, url, useFeaturedImage, backgroundType } = coverAttributes || {};

	return useSelect(
		( select ) => {
			if ( backgroundType && 'image' !== backgroundType ) {
				return '';
			}

			if ( useFeaturedImage ) {
				const postType = select( coreStore ).getCurrentPostType();
				const postId = select( coreStore ).getCurrentPostId();

				if ( ! postType || ! postId ) {
					return '';
				}

				const record = select( coreStore ).getEditedEntityRecord(
					'postType',
					postType,
					postId
				);
				const featuredId = record?.featured_media;

				if ( ! featuredId ) {
					return '';
				}

				return (
					select( coreStore ).getMedia( featuredId )?.source_url || ''
				);
			}

			if ( id ) {
				return select( coreStore ).getMedia( id )?.source_url || '';
			}

			return typeof url === 'string' ? url : '';
		},
		[ id, url, useFeaturedImage, backgroundType ]
	);
}
