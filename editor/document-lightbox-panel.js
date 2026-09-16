/**
 * Post sidebar — Smart Image Gallery (stats + bulk lightbox).
 */

import { registerPlugin } from '@wordpress/plugins';
import {
	PluginDocumentSettingPanel,
	store as editorStore,
} from '@wordpress/editor';
import { ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const PAGE_GALLERY_META = 'forwp_smart_link_body_page_gallery';

/**
 * @param {Array} blocks
 * @return {Array}
 */
function collectBodyImages( blocks ) {
	const images = [];

	function walk( list, insideGallery ) {
		if ( ! Array.isArray( list ) ) {
			return;
		}
		list.forEach( ( block ) => {
			const inGallery =
				insideGallery || block.name === 'core/gallery';
			if ( block.name === 'core/image' && ! inGallery ) {
				images.push( block );
			}
			if ( block.innerBlocks?.length ) {
				walk( block.innerBlocks, inGallery );
			}
		} );
	}

	walk( blocks, false );
	return images;
}

function isEnlarge( attributes ) {
	return attributes?.lightbox?.enabled === true;
}

function isMediaFile( attributes ) {
	return attributes?.linkDestination === 'media';
}

function isPlain( attributes ) {
	const dest = attributes?.linkDestination || 'none';
	return ! isEnlarge( attributes ) && ( dest === 'none' || dest === '' );
}

function summarizeImages( images ) {
	let enlarge = 0;
	let mediaFile = 0;
	let plain = 0;

	images.forEach( ( block ) => {
		const attrs = block.attributes || {};
		if ( isEnlarge( attrs ) ) {
			enlarge += 1;
		} else if ( isMediaFile( attrs ) ) {
			mediaFile += 1;
		} else if ( isPlain( attrs ) ) {
			plain += 1;
		} else {
			plain += 1;
		}
	} );

	return {
		total: images.length,
		plain,
		enlarge,
		mediaFile,
	};
}

function StatRow( { label, value } ) {
	return (
		<div className="forwp-smart-image-gallery__stat">
			<span className="forwp-smart-image-gallery__stat-label">
				{ label }
			</span>
			<span className="forwp-smart-image-gallery__stat-value">
				{ value }
			</span>
		</div>
	);
}

function SmartImageGalleryPanel() {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { editPost } = useDispatch( editorStore );

	const { images, stats, organizeGallery } = useSelect( ( select ) => {
		const list = collectBodyImages(
			select( blockEditorStore ).getBlocks()
		);
		const meta =
			select( editorStore ).getEditedPostAttribute( 'meta' ) || {};
		const organize = meta[ PAGE_GALLERY_META ];
		return {
			images: list,
			stats: summarizeImages( list ),
			organizeGallery: organize !== false && organize !== 0,
		};
	}, [] );

	const allEnlarge =
		stats.total > 0 && stats.enlarge === stats.total;

	const setAllEnlarge = ( enabled ) => {
		images.forEach( ( block ) => {
			const patch = {
				lightbox: { enabled },
			};
			if ( enabled ) {
				patch.linkDestination = 'none';
				patch.href = '';
			}
			updateBlockAttributes( block.clientId, patch );
		} );
	};

	const setOrganizeGallery = ( enabled ) => {
		editPost( {
			meta: {
				[ PAGE_GALLERY_META ]: !! enabled,
			},
		} );
	};

	if ( stats.total === 0 ) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel
			name="forwp-smart-link-post-lightbox"
			title={ __( 'Smart Image Gallery', '4wp-smart-link' ) }
			className="forwp-smart-image-gallery-panel"
		>
			<div className="forwp-smart-image-gallery__stats">
				<StatRow
					label={ __( 'Images on page', '4wp-smart-link' ) }
					value={ stats.total }
				/>
				<StatRow
					label={ __( 'No clickable', '4wp-smart-link' ) }
					value={ stats.plain }
				/>
				<StatRow
					label={ __( 'Open: Enlarge', '4wp-smart-link' ) }
					value={ stats.enlarge }
				/>
				<StatRow
					label={ __( 'Open: Media file', '4wp-smart-link' ) }
					value={ stats.mediaFile }
				/>
			</div>

			<div className="forwp-smart-image-gallery__toggles">
				<ToggleControl
					label={ __( 'Enlarge for all', '4wp-smart-link' ) }
					checked={ allEnlarge }
					onChange={ setAllEnlarge }
					__nextHasNoMarginBottom
				/>
				<ToggleControl
					label={ __(
						'Organize in lightbox',
						'4wp-smart-link'
					) }
					checked={ organizeGallery }
					onChange={ setOrganizeGallery }
					__nextHasNoMarginBottom
				/>
			</div>
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'forwp-smart-link-post-lightbox', {
	render: SmartImageGalleryPanel,
} );
