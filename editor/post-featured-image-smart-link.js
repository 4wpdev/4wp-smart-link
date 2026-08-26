/**
 * Post Featured Image block helpers for Smart Link lightbox.
 */

import { useSelect } from '@wordpress/data';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * @param {Record<string, unknown>} blockContext Block edit context.
 * @return {{ postId: number, postType: string }}
 */
export function usePostFeaturedImageContext( blockContext = {} ) {
	const { postId: contextPostId, postType: contextPostType } =
		blockContext || {};

	const postType = useSelect(
		( select ) => {
			if ( contextPostType && contextPostId ) {
				return contextPostType;
			}

			return select( editorStore ).getCurrentPostType();
		},
		[ contextPostType, contextPostId ]
	);

	const postId = useSelect(
		( select ) => {
			if ( contextPostId ) {
				return contextPostId;
			}

			return select( editorStore ).getCurrentPostId();
		},
		[ contextPostId, contextPostType ]
	);

	return { postId, postType };
}

/**
 * @param {Record<string, unknown>} blockContext Block edit context.
 * @return {number}
 */
export function useFeaturedImageAttachmentId( blockContext = {} ) {
	const { postId, postType } = usePostFeaturedImageContext( blockContext );

	const [ featuredMediaId ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);

	return featuredMediaId || 0;
}

/**
 * @param {Record<string, unknown>} blockContext Block edit context.
 * @return {boolean}
 */
export function usePostFeaturedImageCanUseLightbox( blockContext = {} ) {
	const attachmentId = useFeaturedImageAttachmentId( blockContext );
	const { postId } = usePostFeaturedImageContext( blockContext );

	return postId > 0 && attachmentId > 0;
}
