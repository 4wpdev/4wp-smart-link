/**
 * Cover block helpers for Smart Link media + lightbox destinations.
 */

import { useSelect } from '@wordpress/data';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

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
 * Query Loop Covers pass `postId` / `postType` via block context (same as core/cover).
 *
 * @param {Record<string, unknown>} coverAttributes Cover block attributes.
 * @param {Record<string, unknown>} blockContext    Block edit context (postId, postType).
 * @return {string}
 */
export function useCoverBackgroundMediaUrl(
	coverAttributes,
	blockContext = {}
) {
	const { id, url, useFeaturedImage, backgroundType } = coverAttributes || {};
	const { postId: contextPostId, postType: contextPostType } =
		blockContext || {};

	const resolvedPostType = useSelect(
		( select ) => {
			if ( contextPostType && contextPostId ) {
				return contextPostType;
			}

			return select( editorStore ).getCurrentPostType();
		},
		[ contextPostType, contextPostId ]
	);

	const resolvedPostId = useSelect(
		( select ) => {
			if ( contextPostId ) {
				return contextPostId;
			}

			return select( editorStore ).getCurrentPostId();
		},
		[ contextPostId, contextPostType ]
	);

	const [ featuredMediaId ] = useEntityProp(
		'postType',
		resolvedPostType,
		'featured_media',
		resolvedPostId
	);

	return useSelect(
		( select ) => {
			if ( backgroundType && 'image' !== backgroundType ) {
				return '';
			}

			if ( useFeaturedImage ) {
				if ( ! featuredMediaId ) {
					return '';
				}

				return (
					select( coreStore ).getMedia( featuredMediaId )?.source_url ||
					''
				);
			}

			if ( id ) {
				return select( coreStore ).getMedia( id )?.source_url || '';
			}

			return typeof url === 'string' ? url : '';
		},
		[ id, url, useFeaturedImage, backgroundType, featuredMediaId ]
	);
}
