import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	InspectorControls,
	LinkControl,
	URLInput,
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
} from '@wordpress/components';
import {
	link as linkIcon,
	postFeaturedImage,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import './index.scss';

const SMART_LINK_ATTRIBUTES = {
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

const SUPPORTED_BLOCKS = [
	'core/cover',
	'core/group',
	'core/column',
];

const BLOCK_PANEL_TITLES = {
	'core/cover': __( 'Cover Link', '4wp-smart-link' ),
	'core/group': __( 'Group Link', '4wp-smart-link' ),
	'core/column': __( 'Column Link', '4wp-smart-link' ),
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

				const { smartLinkUrl, smartLinkToCurrentPost } =
					parent.attributes || {};

				if ( smartLinkUrl || smartLinkToCurrentPost ) {
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

function addSmartLinkAttributes( settings, name ) {
	if ( ! isSupportedBlock( name ) ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			...SMART_LINK_ATTRIBUTES,
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'forwp/smart-link/add-attributes',
	addSmartLinkAttributes
);

function SmartLinkToolbar( {
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

	const [ isLinkControlOpen, setLinkControlOpen ] = useState( false );
	const toggleRef = useRef( null );

	useEffect( () => {
		if ( smartLinkToCurrentPost && ! canUsePostLink ) {
			setAttributes( {
				smartLinkToCurrentPost: false,
			} );
		}
	}, [ smartLinkToCurrentPost, canUsePostLink, setAttributes ] );

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
			smartLinkUrl: url,
			smartLinkToCurrentPost: false,
			smartLinkNewTab: opensInNewTab,
			smartLinkRel: mergeNofollowIntoRel( smartLinkRel, nofollow ),
		} );
	};

	const onRemoveLink = () => {
		setAttributes( {
			smartLinkUrl: '',
			smartLinkNewTab: false,
			smartLinkToCurrentPost: false,
			smartLinkRel: '',
			smartLinkAriaLabel: '',
		} );
		setLinkControlOpen( false );
	};

	const openCustomLinkPopover = () => {
		setAttributes( { smartLinkToCurrentPost: false } );
		requestAnimationFrame( () => {
			setLinkControlOpen( true );
		} );
	};

	const isLinkActive = !! smartLinkUrl || !! smartLinkToCurrentPost;

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
									! smartLinkToCurrentPost &&
									!! smartLinkUrl
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
									isPressed={ smartLinkToCurrentPost }
									onClick={ () => {
										setAttributes( {
											smartLinkToCurrentPost: true,
											smartLinkUrl: '',
										} );
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
				{ isLinkControlOpen && ! smartLinkToCurrentPost && (
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

		const isLinkActive =
			!! smartLinkUrl || !! smartLinkToCurrentPost;

		const innerConflictNotice =
			! isSupported && ancestorHasSmartLink && hasNativeLink;
		const containerConflictPending =
			isSupported &&
			hasNestedNativeLinks &&
			! isLinkActive;
		const containerConflictActive =
			isSupported && hasNestedNativeLinks && isLinkActive;

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

		const canUsePostLink = useIsInsidePostTemplate( props.clientId );

		useEffect( () => {
			if ( smartLinkToCurrentPost && ! canUsePostLink ) {
				props.setAttributes( { smartLinkToCurrentPost: false } );
			}
		}, [ smartLinkToCurrentPost, canUsePostLink, props.setAttributes ] );

		const clearInspectorCustomLink = () => {
			props.setAttributes( {
				smartLinkUrl: '',
				smartLinkNewTab: false,
				smartLinkRel: '',
				smartLinkAriaLabel: '',
			} );
		};

		return (
			<Fragment>
				<BlockEdit { ...props } />
				{ showConflictNotice && (
					<InspectorControls>
						<SmartLinkConflictNotice variant={ conflictVariant } />
					</InspectorControls>
				) }
				<SmartLinkToolbar
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
						{ canUsePostLink ? (
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __(
									'Dynamic: Link to current post (Query Loop)',
									'4wp-smart-link'
								) }
								checked={ !! smartLinkToCurrentPost }
								onChange={ ( value ) =>
									props.setAttributes( {
										smartLinkToCurrentPost: value,
									} )
								}
							/>
						) : (
							<p className="forwp-smart-link-panel__help">
								{ __(
									'Post Link is available only when this block is inside a Query Loop post template.',
									'4wp-smart-link'
								) }
							</p>
						) }
						{ smartLinkToCurrentPost && canUsePostLink ? (
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
						) : (
							<div className="forwp-smart-link-panel__custom">
								<URLInput
									label={ __( 'URL', '4wp-smart-link' ) }
									value={ smartLinkUrl || '' }
									onChange={ ( url ) =>
										props.setAttributes( {
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
						) }
					</PanelBody>
				</InspectorControls>
				<InspectorControls group="advanced">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link relation', '4wp-smart-link' ) }
						value={ smartLinkRel || '' }
						onChange={ ( value ) =>
							props.setAttributes( { smartLinkRel: value || '' } )
						}
					/>
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
