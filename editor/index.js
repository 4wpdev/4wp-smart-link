import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	InspectorControls,
	LinkControl,
	URLInput,
	URLPopover,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Dropdown,
	ToolbarButton,
	ToolbarGroup,
	PanelBody,
	ToggleControl,
	TextControl,
	Button,
	MenuItem,
	NavigableMenu,
	CheckboxControl,
	Popover,
	Notice,
	Icon,
} from '@wordpress/components';
import {
	link as linkIcon,
	postFeaturedImage,
	image as imageIcon,
	fullscreen as fullscreenIcon,
	linkOff,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import './index.scss';

import {
	coverCanUseImageLinkModes,
	useCoverBackgroundMediaUrl,
} from './cover-smart-link';
import { CoverLightboxEditorIndicator } from './cover-lightbox-editor-indicator';
import { FeaturedImageLightboxEditorIndicator } from './featured-image-lightbox-editor-indicator';
import { FeaturedImageLightboxToolbar } from './featured-image-lightbox-toolbar';
import { usePostFeaturedImageCanUseLightbox } from './post-featured-image-smart-link';
import {
	SMART_LINK_BASE_ATTRIBUTES,
	SMART_LINK_COVER_ATTRIBUTES,
	SMART_LINK_DESTINATION,
	isSmartLinkActive,
	isSmartLinkLightboxMode,
	isLightboxInPageGallery,
	legacyDestinationMigrationPatch,
	resolveSmartLinkDestination,
	smartLinkDestinationPatch,
	usesSmartLinkCardNavigation,
} from './smart-link-destination';

const SUPPORTED_BLOCKS = [
	'core/cover',
	'core/group',
	'core/column',
	'core/post-featured-image',
];

const LIGHTBOX_ONLY_BLOCKS = [ 'core/post-featured-image' ];

const BLOCK_PANEL_TITLES = {
	'core/cover': __( 'Cover Link', '4wp-smart-link' ),
	'core/group': __( 'Group Link', '4wp-smart-link' ),
	'core/column': __( 'Column Link', '4wp-smart-link' ),
	'core/post-featured-image': __( 'Featured Image Link', '4wp-smart-link' ),
};

const NOFOLLOW_REL = 'nofollow';

const LINK_SETTINGS = [
	...LinkControl.DEFAULT_LINK_SETTINGS,
	{
		id: 'nofollow',
		title: __( 'Mark as nofollow', '4wp-smart-link' ),
	},
];

function isSupportedBlock( name ) {
	return SUPPORTED_BLOCKS.includes( name );
}

/**
 * True when the block sits inside core/post-template (Query Loop item).
 *
 * @param {string} clientId Block client id.
 * @return {boolean}
 */
function useIsInsidePostTemplate( clientId ) {
	return useSelect(
		( select ) => {
			if ( ! clientId ) {
				return false;
			}
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			return (
				getBlockParentsByBlockName( clientId, 'core/post-template', true )
					.length > 0
			);
		},
		[ clientId ]
	);
}

function blockHasNativeLink( block ) {
	const { name, attributes } = block;

	if ( name === 'core/button' && attributes?.url ) {
		return true;
	}

	if (
		name === 'core/image' &&
		attributes?.linkDestination &&
		'none' !== attributes.linkDestination
	) {
		return true;
	}

	if ( name === 'core/post-terms' ) {
		return true;
	}

	if ( name === 'core/read-more' ) {
		return true;
	}

	if ( name === 'core/post-title' ) {
		return attributes?.isLink !== false;
	}

	if (
		name === 'core/heading' ||
		name === 'core/paragraph' ||
		name === 'core/list-item'
	) {
		const content = attributes?.content || '';
		return typeof content === 'string' && /<a\b/i.test( content );
	}

	return false;
}

function useAncestorHasSmartLink( clientId ) {
	return useSelect(
		( select ) => {
			if ( ! clientId ) {
				return false;
			}

			const { getBlockParents, getBlock } = select( blockEditorStore );
			const parents = getBlockParents( clientId, true );

			for ( const parentId of parents ) {
				const parent = getBlock( parentId );
				if ( ! parent || ! isSupportedBlock( parent.name ) ) {
					continue;
				}

				if ( isSmartLinkActive( parent.attributes || {} ) ) {
					return true;
				}
			}

			return false;
		},
		[ clientId ]
	);
}

function SmartLinkConflictNotice( { variant = 'container-active' } ) {
	let message;

	if ( variant === 'container-pending' ) {
		message = __(
			'Inner links detected (title, terms, buttons, etc.). Smart Link will wrap this block in a clickable container—not an outer <a>—so inner links stay valid. Empty areas open the Smart Link URL on the front end; inner links keep their own destinations.',
			'4wp-smart-link'
		);
	} else if ( variant === 'inner' ) {
		message = __(
			'This block is inside a Cover/Group/Column with Smart Link. Your link here stays separate; the container handles clicks on non-link areas on the front end.',
			'4wp-smart-link'
		);
	} else {
		message = __(
			'Smart Link is on and inner blocks contain links. The front end uses clickable-container mode (no link-inside-link): inner links work as usual; padding and images open the Smart Link URL.',
			'4wp-smart-link'
		);
	}

	const noticeStatus =
		variant === 'inner' ? 'info' : 'warning';

	return (
		<Notice
			className="forwp-smart-link-conflict-notice"
			status={ noticeStatus }
			isDismissible={ false }
		>
			{ message }
		</Notice>
	);
}

function useHasNestedNativeLinks( clientId ) {
	return useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );

			const walk = ( blocks ) => {
				for ( const block of blocks ) {
					if ( blockHasNativeLink( block ) ) {
						return true;
					}
					const children = getBlocks( block.clientId );
					if ( children.length && walk( children ) ) {
						return true;
					}
				}
				return false;
			};

			return walk( getBlocks( clientId ) );
		},
		[ clientId ]
	);
}

function relTokensIncludeNofollow( rel ) {
	if ( ! rel || typeof rel !== 'string' ) {
		return false;
	}
	return rel.split( /\s+/ ).filter( Boolean ).includes( NOFOLLOW_REL );
}

function mergeNofollowIntoRel( rel, nofollow ) {
	const tokens = ( rel || '' ).split( /\s+/ ).filter( Boolean );
	const without = tokens.filter( ( t ) => t !== NOFOLLOW_REL );
	if ( nofollow ) {
		without.push( NOFOLLOW_REL );
	}
	return without.join( ' ' );
}

function isLightboxOnlyBlock( name ) {
	return LIGHTBOX_ONLY_BLOCKS.includes( name );
}

function addSmartLinkAttributes( settings, name ) {
	if ( ! isSupportedBlock( name ) ) {
		return settings;
	}

	const smartLinkAttributes =
		name === 'core/cover' || name === 'core/post-featured-image'
			? {
					...SMART_LINK_BASE_ATTRIBUTES,
					...SMART_LINK_COVER_ATTRIBUTES,
			  }
			: { ...SMART_LINK_BASE_ATTRIBUTES };

	return {
		...settings,
		attributes: {
			...settings.attributes,
			...smartLinkAttributes,
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'forwp/smart-link/add-attributes',
	addSmartLinkAttributes
);

/**
 * Cover toolbar link UI aligned with core Image block URLPopover + lightbox.
 */
function CoverSmartLinkUrlPopover( {
	attributes,
	setAttributes,
	canUsePostLink,
} ) {
	const {
		smartLinkUrl,
		smartLinkNewTab,
		smartLinkRel,
		smartLinkToCurrentPost,
	} = attributes;

	const destination = resolveSmartLinkDestination( attributes );
	const [ isLinkUIOpen, setIsLinkUIOpen ] = useState( false );
	const [ isEditingCustomLink, setIsEditingCustomLink ] = useState( false );
	const popoverAnchorRef = useRef( null );

	useEffect( () => {
		if ( smartLinkToCurrentPost && ! canUsePostLink ) {
			setAttributes( {
				smartLinkToCurrentPost: false,
				smartLinkDestination: '',
			} );
		}
	}, [ smartLinkToCurrentPost, canUsePostLink, setAttributes ] );

	useEffect( () => {
		if ( ! destination ) {
			return;
		}

		const needsImage =
			destination === SMART_LINK_DESTINATION.MEDIA ||
			destination === SMART_LINK_DESTINATION.LIGHTBOX;

		if ( needsImage && ! coverCanUseImageLinkModes( attributes ) ) {
			setAttributes( smartLinkDestinationPatch( '' ) );
		}
	}, [
		destination,
		attributes?.id,
		attributes?.url,
		attributes?.useFeaturedImage,
		attributes?.backgroundType,
		setAttributes,
	] );

	const linkValue = useMemo(
		() => ( {
			url: smartLinkToCurrentPost ? '' : smartLinkUrl || '',
			opensInNewTab: !! smartLinkNewTab,
			nofollow: relTokensIncludeNofollow( smartLinkRel ),
		} ),
		[ smartLinkUrl, smartLinkNewTab, smartLinkRel, smartLinkToCurrentPost ]
	);

	const onLinkControlChange = ( nextValue ) => {
		const {
			url = '',
			opensInNewTab = false,
			nofollow = false,
		} = nextValue || {};

		setAttributes( {
			...smartLinkDestinationPatch( SMART_LINK_DESTINATION.CUSTOM ),
			smartLinkUrl: url,
			smartLinkNewTab: opensInNewTab,
			smartLinkRel: mergeNofollowIntoRel( smartLinkRel, nofollow ),
		} );
	};

	const closeLinkUI = () => {
		setIsLinkUIOpen( false );
		setIsEditingCustomLink( false );
	};

	const onRemoveLink = () => {
		setAttributes( smartLinkDestinationPatch( '' ) );
		closeLinkUI();
	};

	const enableLightboxMode = () => {
		setAttributes(
			smartLinkDestinationPatch( SMART_LINK_DESTINATION.LIGHTBOX )
		);
		setIsEditingCustomLink( false );
		setIsLinkUIOpen( true );
	};

	const openCustomLinkEditor = () => {
		setAttributes( {
			smartLinkDestination: SMART_LINK_DESTINATION.CUSTOM,
			smartLinkToCurrentPost: false,
			smartLinkLightbox: { enabled: false },
		} );
		setIsEditingCustomLink( true );
		setIsLinkUIOpen( true );
	};

	const isLinkActive = isSmartLinkActive( attributes );
	const isCustomDestination =
		destination === SMART_LINK_DESTINATION.CUSTOM ||
		( ! destination && !! smartLinkUrl );
	const showExpandPanel =
		destination === SMART_LINK_DESTINATION.LIGHTBOX &&
		! smartLinkToCurrentPost &&
		! smartLinkUrl;
	const showCustomLinkEditor =
		isCustomDestination &&
		! smartLinkToCurrentPost &&
		( ! smartLinkUrl || isEditingCustomLink );
	const showDestinationMenu =
		isLinkUIOpen &&
		! showExpandPanel &&
		! ( isCustomDestination && smartLinkUrl && ! isEditingCustomLink );

	const renderPopoverChildren = () => {
		if ( showExpandPanel ) {
			return (
				<div className="block-editor-url-popover__expand-on-click">
					<Icon icon={ fullscreenIcon } />
					<div className="text">
						<p>{ __( 'Enlarge on click', '4wp-smart-link' ) }</p>
						<p className="description">
							{ __(
								'Scales the image with a lightbox effect',
								'4wp-smart-link'
							) }
						</p>
					</div>
					<Button
						icon={ linkOff }
						label={ __(
							'Disable enlarge on click',
							'4wp-smart-link'
						) }
						onClick={ onRemoveLink }
						size="compact"
					/>
				</div>
			);
		}

		if ( showCustomLinkEditor ) {
			return (
				<LinkControl
					value={ linkValue }
					onChange={ onLinkControlChange }
					onRemove={ onRemoveLink }
					settings={ LINK_SETTINGS }
					forceIsEditingLink={ ! smartLinkUrl }
				/>
			);
		}

		if ( isCustomDestination && smartLinkUrl ) {
			return (
				<LinkControl
					value={ linkValue }
					onChange={ onLinkControlChange }
					onRemove={ onRemoveLink }
					settings={ LINK_SETTINGS }
				/>
			);
		}

		return null;
	};

	return (
		<BlockControls group="block">
			<ToolbarGroup>
				<ToolbarButton
					ref={ popoverAnchorRef }
					className="components-toolbar__control"
					icon={ linkIcon }
					label={ __( 'Smart Link (whole block)', '4wp-smart-link' ) }
					aria-expanded={ isLinkUIOpen }
					onClick={ () => setIsLinkUIOpen( ( open ) => ! open ) }
					isPressed={ isLinkActive }
				/>
				{ isLinkUIOpen && (
					<URLPopover
						anchor={ popoverAnchorRef.current }
						onClose={ closeLinkUI }
						offset={ 13 }
						additionalControls={
							showDestinationMenu ? (
								<NavigableMenu>
									<MenuItem
										icon={ linkIcon }
										iconPosition="left"
										isPressed={
											destination ===
											SMART_LINK_DESTINATION.CUSTOM
										}
										onClick={ openCustomLinkEditor }
									>
										{ __( 'Custom Link', '4wp-smart-link' ) }
									</MenuItem>
									{ canUsePostLink && (
										<MenuItem
											icon={ postFeaturedImage }
											iconPosition="left"
											isPressed={
												destination ===
												SMART_LINK_DESTINATION.POST
											}
											onClick={ () => {
												setAttributes(
													smartLinkDestinationPatch(
														SMART_LINK_DESTINATION.POST
													)
												);
												closeLinkUI();
											} }
										>
											{ __( 'Post Link', '4wp-smart-link' ) }
										</MenuItem>
									) }
									<MenuItem
										icon={ imageIcon }
										iconPosition="left"
										isPressed={
											destination ===
											SMART_LINK_DESTINATION.MEDIA
										}
										onClick={ () => {
											setAttributes(
												smartLinkDestinationPatch(
													SMART_LINK_DESTINATION.MEDIA
												)
											);
											closeLinkUI();
										} }
									>
										{ __(
											'Link to image file',
											'4wp-smart-link'
										) }
									</MenuItem>
									<MenuItem
										className="block-editor-url-popover__expand-on-click"
										icon={ fullscreenIcon }
										iconPosition="left"
										info={ __(
											'Scale the image with a lightbox effect.',
											'4wp-smart-link'
										) }
										isPressed={
											destination ===
											SMART_LINK_DESTINATION.LIGHTBOX
										}
										onClick={ enableLightboxMode }
									>
										{ __( 'Enlarge on click', '4wp-smart-link' ) }
									</MenuItem>
									{ isLinkActive && (
										<MenuItem onClick={ onRemoveLink }>
											{ __( 'Reset', '4wp-smart-link' ) }
										</MenuItem>
									) }
								</NavigableMenu>
							) : null
						}
					>
						{ renderPopoverChildren() }
					</URLPopover>
				) }
			</ToolbarGroup>
		</BlockControls>
	);
}

function DefaultSmartLinkToolbar( {
	blockName,
	attributes,
	setAttributes,
	canUsePostLink,
} ) {
	const {
		smartLinkUrl,
		smartLinkNewTab,
		smartLinkRel,
		smartLinkToCurrentPost,
	} = attributes;

	const isCover = blockName === 'core/cover';
	const destination = resolveSmartLinkDestination( attributes );
	const [ isLinkControlOpen, setLinkControlOpen ] = useState( false );
	const toggleRef = useRef( null );

	useEffect( () => {
		if ( smartLinkToCurrentPost && ! canUsePostLink ) {
			setAttributes( {
				smartLinkToCurrentPost: false,
				smartLinkDestination: '',
			} );
		}
	}, [ smartLinkToCurrentPost, canUsePostLink, setAttributes ] );

	useEffect( () => {
		if ( ! isCover || ! destination ) {
			return;
		}

		const needsImage =
			destination === SMART_LINK_DESTINATION.MEDIA ||
			destination === SMART_LINK_DESTINATION.LIGHTBOX;

		if ( needsImage && ! coverCanUseImageLinkModes( attributes ) ) {
			setAttributes( smartLinkDestinationPatch( '' ) );
		}
	}, [
		isCover,
		destination,
		attributes?.id,
		attributes?.url,
		attributes?.useFeaturedImage,
		attributes?.backgroundType,
		canUsePostLink,
		setAttributes,
	] );

	const linkValue = useMemo(
		() => ( {
			url: smartLinkToCurrentPost ? '' : smartLinkUrl || '',
			opensInNewTab: !! smartLinkNewTab,
			nofollow: relTokensIncludeNofollow( smartLinkRel ),
		} ),
		[ smartLinkUrl, smartLinkNewTab, smartLinkRel, smartLinkToCurrentPost ]
	);

	const onLinkControlChange = ( nextValue ) => {
		const {
			url = '',
			opensInNewTab = false,
			nofollow = false,
		} = nextValue || {};

		setAttributes( {
			...smartLinkDestinationPatch( SMART_LINK_DESTINATION.CUSTOM ),
			smartLinkUrl: url,
			smartLinkNewTab: opensInNewTab,
			smartLinkRel: mergeNofollowIntoRel( smartLinkRel, nofollow ),
		} );
	};

	const onRemoveLink = () => {
		setAttributes( smartLinkDestinationPatch( '' ) );
		setLinkControlOpen( false );
	};

	const openCustomLinkPopover = () => {
		setAttributes( {
			smartLinkDestination: SMART_LINK_DESTINATION.CUSTOM,
			smartLinkToCurrentPost: false,
			smartLinkLightbox: { enabled: false },
		} );
		requestAnimationFrame( () => {
			setLinkControlOpen( true );
		} );
	};

	const isLinkActive = isSmartLinkActive( attributes );
	const isCustomDestination =
		destination === SMART_LINK_DESTINATION.CUSTOM ||
		( ! destination && !! smartLinkUrl );
	const showCustomLinkPopover =
		isLinkControlOpen &&
		! smartLinkToCurrentPost &&
		isCustomDestination;

	return (
		<BlockControls group="block">
			<ToolbarGroup>
				<Dropdown
					contentClassName="block-editor-media-replace-flow__options"
					popoverProps={ {
						placement: 'bottom-start',
					} }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<ToolbarButton
							ref={ toggleRef }
							aria-expanded={ isOpen || isLinkControlOpen }
							aria-haspopup="true"
							icon={ linkIcon }
							label={ __( 'Smart Link (whole block)', '4wp-smart-link' ) }
							onClick={ onToggle }
							isPressed={ isLinkActive }
						/>
					) }
					renderContent={ ( { onClose } ) => (
						<NavigableMenu className="block-editor-media-replace-flow__media-upload-menu">
							<MenuItem
								icon={ linkIcon }
								isPressed={
									destination === SMART_LINK_DESTINATION.CUSTOM
								}
								onClick={ () => {
									onClose();
									openCustomLinkPopover();
								} }
							>
								{ __( 'Custom Link', '4wp-smart-link' ) }
							</MenuItem>
							{ canUsePostLink && (
								<MenuItem
									icon={ postFeaturedImage }
									isPressed={
										destination === SMART_LINK_DESTINATION.POST
									}
									onClick={ () => {
										setAttributes(
											smartLinkDestinationPatch(
												SMART_LINK_DESTINATION.POST
											)
										);
										setLinkControlOpen( false );
										onClose();
									} }
								>
									{ __( 'Post Link', '4wp-smart-link' ) }
								</MenuItem>
							) }
							{ isLinkActive && (
								<MenuItem
									onClick={ () => {
										onRemoveLink();
										onClose();
									} }
								>
									{ __( 'Reset', '4wp-smart-link' ) }
								</MenuItem>
							) }
						</NavigableMenu>
					) }
				/>
				{ showCustomLinkPopover && (
					<Popover
						anchorRef={ toggleRef }
						placement="bottom"
						onClose={ () => setLinkControlOpen( false ) }
						focusOnMount={ true }
						shift
					>
						<LinkControl
							value={ linkValue }
							onChange={ onLinkControlChange }
							onRemove={ onRemoveLink }
							settings={ LINK_SETTINGS }
							forceIsEditingLink={ ! smartLinkUrl }
						/>
					</Popover>
				) }
			</ToolbarGroup>
		</BlockControls>
	);
}

function SmartLinkToolbar( {
	blockName,
	attributes,
	setAttributes,
	canUsePostLink,
} ) {
	const isCover = blockName === 'core/cover';
	const isFeaturedImage = blockName === 'core/post-featured-image';
	const canUseCoverImageModes =
		isCover && coverCanUseImageLinkModes( attributes );

	if ( isFeaturedImage ) {
		return (
			<FeaturedImageLightboxToolbar
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
	}

	if ( isCover && canUseCoverImageModes ) {
		return (
			<CoverSmartLinkUrlPopover
				attributes={ attributes }
				setAttributes={ setAttributes }
				canUsePostLink={ canUsePostLink }
			/>
		);
	}

	return (
		<DefaultSmartLinkToolbar
			blockName={ blockName }
			attributes={ attributes }
			setAttributes={ setAttributes }
			canUsePostLink={ canUsePostLink }
		/>
	);
}

const withSmartLinkControls = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const isSupported = isSupportedBlock( props.name );
		const ancestorHasSmartLink = useAncestorHasSmartLink( props.clientId );
		const hasNativeLink = blockHasNativeLink( {
			name: props.name,
			attributes: props.attributes,
		} );
		const hasNestedNativeLinks = useHasNestedNativeLinks( props.clientId );

		const smartLinkUrl = props.attributes?.smartLinkUrl;
		const smartLinkNewTab = props.attributes?.smartLinkNewTab;
		const smartLinkRel = props.attributes?.smartLinkRel;
		const smartLinkAriaLabel = props.attributes?.smartLinkAriaLabel;
		const smartLinkToCurrentPost = props.attributes?.smartLinkToCurrentPost;

		const isLinkActive = isSmartLinkActive( props.attributes || {} );
		const usesCardLink = usesSmartLinkCardNavigation(
			props.attributes || {}
		);
		const smartLinkDestination = resolveSmartLinkDestination(
			props.attributes || {}
		);
		const isCover = props.name === 'core/cover';
		const isFeaturedImage = props.name === 'core/post-featured-image';
		const canUsePostLink = useIsInsidePostTemplate( props.clientId );
		const canUseCoverImageModes =
			isCover &&
			coverCanUseImageLinkModes( props.attributes || {} );
		const canUseFeaturedImageLightbox = usePostFeaturedImageCanUseLightbox(
			props.context || {}
		);
		const coverMediaUrl = useCoverBackgroundMediaUrl(
			isCover ? props.attributes : {},
			isCover ? props.context : {}
		);

		useEffect( () => {
			const migration = legacyDestinationMigrationPatch(
				props.attributes || {}
			);

			if ( migration ) {
				props.setAttributes( migration );
			}
		}, [
			props.clientId,
			props.attributes?.smartLinkDestination,
			props.attributes?.smartLinkUrl,
			props.attributes?.smartLinkToCurrentPost,
			props.setAttributes,
		] );

		useEffect( () => {
			if ( ! isSupported ) {
				return;
			}

			if ( smartLinkToCurrentPost && ! canUsePostLink ) {
				props.setAttributes( {
					smartLinkToCurrentPost: false,
					smartLinkDestination: '',
				} );
			}
		}, [
			isSupported,
			smartLinkToCurrentPost,
			canUsePostLink,
			props.setAttributes,
		] );

		const innerConflictNotice =
			! isSupported && ancestorHasSmartLink && hasNativeLink;
		const containerConflictPending =
			isSupported && hasNestedNativeLinks && ! usesCardLink;
		const containerConflictActive =
			isSupported && hasNestedNativeLinks && usesCardLink;

		const showConflictNotice =
			innerConflictNotice ||
			containerConflictPending ||
			containerConflictActive;

		let conflictVariant = 'container-active';
		if ( innerConflictNotice ) {
			conflictVariant = 'inner';
		} else if ( containerConflictPending ) {
			conflictVariant = 'container-pending';
		}

		if ( ! isSupported ) {
			return (
				<Fragment>
					<BlockEdit { ...props } />
					{ showConflictNotice && (
						<InspectorControls>
							<SmartLinkConflictNotice variant={ conflictVariant } />
						</InspectorControls>
					) }
				</Fragment>
			);
		}

		const panelTitle =
			BLOCK_PANEL_TITLES[ props.name ] ||
			__( 'Smart Link', '4wp-smart-link' );

		const clearInspectorCustomLink = () => {
			const destination = resolveSmartLinkDestination(
				props.attributes || {}
			);

			if ( SMART_LINK_DESTINATION.CUSTOM === destination ) {
				props.setAttributes( smartLinkDestinationPatch( '' ) );
				return;
			}

			props.setAttributes( {
				smartLinkUrl: '',
				smartLinkNewTab: false,
				smartLinkRel: '',
				smartLinkAriaLabel: '',
			} );
		};

		const showCoverLightboxIndicator =
			isCover &&
			canUseCoverImageModes &&
			smartLinkDestination === SMART_LINK_DESTINATION.LIGHTBOX;

		const showFeaturedImageLightboxIndicator =
			isFeaturedImage &&
			canUseFeaturedImageLightbox &&
			smartLinkDestination === SMART_LINK_DESTINATION.LIGHTBOX;

		const coverLightboxSyncKey = [
			props.attributes?.id,
			props.attributes?.url,
			props.attributes?.useFeaturedImage,
			props.attributes?.dimRatio,
			props.attributes?.minHeight,
			props.attributes?.minHeightUnit,
		].join( '|' );

		const featuredImageLightboxSyncKey = [
			props.context?.postId,
			props.attributes?.sizeSlug,
			props.attributes?.width,
			props.attributes?.height,
		].join( '|' );

		return (
			<Fragment>
				<BlockEdit { ...props } />
				{ showCoverLightboxIndicator && (
					<CoverLightboxEditorIndicator
						clientId={ props.clientId }
						enabled={ showCoverLightboxIndicator }
						syncKey={ coverLightboxSyncKey }
					/>
				) }
				{ showFeaturedImageLightboxIndicator && (
					<FeaturedImageLightboxEditorIndicator
						clientId={ props.clientId }
						enabled={ showFeaturedImageLightboxIndicator }
						syncKey={ featuredImageLightboxSyncKey }
					/>
				) }
				{ showConflictNotice && (
					<InspectorControls>
						<SmartLinkConflictNotice variant={ conflictVariant } />
					</InspectorControls>
				) }
				<SmartLinkToolbar
					blockName={ props.name }
					attributes={ props.attributes }
					setAttributes={ props.setAttributes }
					canUsePostLink={ canUsePostLink }
				/>
				<InspectorControls>
					<PanelBody
						title={ panelTitle }
						initialOpen={ isLinkActive || hasNestedNativeLinks }
						className="forwp-smart-link-panel"
					>
						{ hasNestedNativeLinks && (
							<Notice
								className="forwp-smart-link-panel__inline-warning"
								status="warning"
								isDismissible={ false }
							>
								{ __(
									'Inner links detected: the front end uses clickable-container mode so tags, categories, and buttons keep their own links.',
									'4wp-smart-link'
								) }
							</Notice>
						) }
						{ ( isCover || isFeaturedImage ) &&
							smartLinkDestination ===
								SMART_LINK_DESTINATION.LIGHTBOX && (
								<>
									<Notice
										className="forwp-smart-link-panel__inline-warning"
										status="info"
										isDismissible={ false }
									>
										{ isFeaturedImage
											? __(
													'Enlarge on click adds a lightbox button on the front end (like the Image block). The featured image itself is not a post link while this mode is on.',
													'4wp-smart-link'
											  )
											: __(
													'Enlarge on click adds a lightbox button on the front end (like the Image block). The cover area itself is not a link.',
													'4wp-smart-link'
											  ) }
									</Notice>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __(
											'Include in page lightbox gallery',
											'4wp-smart-link'
										) }
										help={ __(
											'When enabled, visitors can move to other enlarged images on this page. Turn off to open only this cover’s image.',
											'4wp-smart-link'
										) }
										checked={ isLightboxInPageGallery(
											props.attributes
										) }
										onChange={ ( value ) =>
											props.setAttributes( {
												smartLinkLightbox: {
													...( props.attributes
														?.smartLinkLightbox &&
													typeof props.attributes
														.smartLinkLightbox ===
														'object'
														? props.attributes
																.smartLinkLightbox
														: {} ),
													enabled: true,
													includeInPageGallery:
														!! value,
												},
											} )
										}
									/>
									<Button
										__next40pxDefaultSize
										className="forwp-smart-link-panel__remove"
										variant="link"
										isDestructive
										onClick={ () =>
											props.setAttributes(
												smartLinkDestinationPatch( '' )
											)
										}
									>
										{ __( 'Disable enlarge on click', '4wp-smart-link' ) }
									</Button>
								</>
							) }
						{ isCover && ! canUseCoverImageModes && (
							<p className="forwp-smart-link-panel__help">
								{ __(
									'Link to image file and Enlarge on click require a cover background image.',
									'4wp-smart-link'
								) }
							</p>
						) }
						{ isFeaturedImage && ! canUseFeaturedImageLightbox && (
							<p className="forwp-smart-link-panel__help">
								{ __(
									'Enlarge on click requires a featured image on the current post in this template.',
									'4wp-smart-link'
								) }
							</p>
						) }
						{ isCover &&
							smartLinkDestination ===
								SMART_LINK_DESTINATION.MEDIA && (
								<>
									<p className="forwp-smart-link-panel__help">
										{ coverMediaUrl
											? __(
													'The whole cover links to the background image file on the front end.',
													'4wp-smart-link'
											  )
											: __(
													'Add a background image to this cover to use this link mode.',
													'4wp-smart-link'
											  ) }
									</p>
									{ !! coverMediaUrl && (
										<TextControl
											__next40pxDefaultSize
											__nextHasNoMarginBottom
											label={ __(
												'Image file URL',
												'4wp-smart-link'
											) }
											value={ coverMediaUrl }
											readOnly
										/>
									) }
									<CheckboxControl
										__nextHasNoMarginBottom
										label={ __(
											'Open in new tab',
											'4wp-smart-link'
										) }
										checked={ !! smartLinkNewTab }
										onChange={ ( value ) =>
											props.setAttributes( {
												smartLinkNewTab: value,
											} )
										}
									/>
									<Button
										__next40pxDefaultSize
										className="forwp-smart-link-panel__remove"
										variant="link"
										isDestructive
										onClick={ () =>
											props.setAttributes(
												smartLinkDestinationPatch( '' )
											)
										}
									>
										{ __( 'Remove link', '4wp-smart-link' ) }
									</Button>
								</>
							) }
						{ ! isLightboxOnlyBlock( props.name ) && canUsePostLink ? (
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __(
									'Dynamic: Link to current post (Query Loop)',
									'4wp-smart-link'
								) }
								checked={
									smartLinkDestination ===
									SMART_LINK_DESTINATION.POST
								}
								onChange={ ( value ) =>
									props.setAttributes(
										value
											? smartLinkDestinationPatch(
													SMART_LINK_DESTINATION.POST
											  )
											: smartLinkDestinationPatch( '' )
									)
								}
							/>
						) : ! isLightboxOnlyBlock( props.name ) ? (
							<p className="forwp-smart-link-panel__help">
								{ __(
									'Post Link is available only when this block is inside a Query Loop post template.',
									'4wp-smart-link'
								) }
							</p>
						) : null }
						{ ! isLightboxOnlyBlock( props.name ) &&
						smartLinkDestination === SMART_LINK_DESTINATION.POST &&
						canUsePostLink ? (
							<>
								<CheckboxControl
									__nextHasNoMarginBottom
									label={ __( 'Open in new tab', '4wp-smart-link' ) }
									checked={ !! smartLinkNewTab }
									onChange={ ( value ) =>
										props.setAttributes( { smartLinkNewTab: value } )
									}
								/>
								<CheckboxControl
									__nextHasNoMarginBottom
									label={ __( 'Mark as nofollow', '4wp-smart-link' ) }
									checked={ relTokensIncludeNofollow( smartLinkRel ) }
									onChange={ ( value ) =>
										props.setAttributes( {
											smartLinkRel: mergeNofollowIntoRel(
												smartLinkRel,
												value
											),
										} )
									}
								/>
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'Accessibility label', '4wp-smart-link' ) }
									value={ smartLinkAriaLabel }
									onChange={ ( value ) =>
										props.setAttributes( {
											smartLinkAriaLabel: value || '',
										} )
									}
								/>
							</>
						) : ! isLightboxOnlyBlock( props.name ) &&
						  smartLinkDestination !== SMART_LINK_DESTINATION.MEDIA &&
						  smartLinkDestination !== SMART_LINK_DESTINATION.LIGHTBOX ? (
							<div className="forwp-smart-link-panel__custom">
								<URLInput
									label={ __( 'URL', '4wp-smart-link' ) }
									value={ smartLinkUrl || '' }
									onChange={ ( url ) =>
										props.setAttributes( {
											...smartLinkDestinationPatch(
												url
													? SMART_LINK_DESTINATION.CUSTOM
													: ''
											),
											smartLinkUrl: url || '',
										} )
									}
									placeholder={ __(
										'Search or type URL',
										'4wp-smart-link'
									) }
									isFullWidth
								/>
								<CheckboxControl
									__nextHasNoMarginBottom
									label={ __( 'Open in new tab', '4wp-smart-link' ) }
									checked={ !! smartLinkNewTab }
									onChange={ ( value ) =>
										props.setAttributes( { smartLinkNewTab: value } )
									}
								/>
								<CheckboxControl
									__nextHasNoMarginBottom
									label={ __( 'Mark as nofollow', '4wp-smart-link' ) }
									checked={ relTokensIncludeNofollow( smartLinkRel ) }
									onChange={ ( value ) =>
										props.setAttributes( {
											smartLinkRel: mergeNofollowIntoRel(
												smartLinkRel,
												value
											),
										} )
									}
								/>
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'Accessibility label', '4wp-smart-link' ) }
									value={ smartLinkAriaLabel }
									onChange={ ( value ) =>
										props.setAttributes( {
											smartLinkAriaLabel: value || '',
										} )
									}
								/>
								{ !! smartLinkUrl && (
									<Button
										__next40pxDefaultSize
										className="forwp-smart-link-panel__remove"
										variant="link"
										isDestructive
										onClick={ clearInspectorCustomLink }
									>
										{ __( 'Remove link', '4wp-smart-link' ) }
									</Button>
								) }
							</div>
						) : null }
					</PanelBody>
				</InspectorControls>
				<InspectorControls group="advanced">
					{ ! isLightboxOnlyBlock( props.name ) && (
						<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link relation', '4wp-smart-link' ) }
						value={ smartLinkRel || '' }
						onChange={ ( value ) =>
							props.setAttributes( { smartLinkRel: value || '' } )
						}
					/>
					) }
				</InspectorControls>
			</Fragment>
		);
	};
}, 'withSmartLinkControls' );

addFilter(
	'editor.BlockEdit',
	'forwp/smart-link/inspector-controls',
	withSmartLinkControls
);
