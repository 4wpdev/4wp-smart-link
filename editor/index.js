import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment, useCallback, useRef, useState } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	URLInput,
	URLPopover,
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
} from '@wordpress/components';
import {
	link as linkIcon,
	linkOff as linkOffIcon,
	postFeaturedImage,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import './index.scss';

const COVER_LINK_ATTRIBUTES = {
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

const NOFOLLOW_REL = 'nofollow';

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

function addCoverLinkAttributes( settings, name ) {
	if ( name !== 'core/cover' ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			...COVER_LINK_ATTRIBUTES,
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'forwp/smart-link/add-attributes',
	addCoverLinkAttributes
);

function CoverLinkToolbar( { attributes, setAttributes } ) {
	const {
		smartLinkUrl,
		smartLinkNewTab,
		smartLinkRel,
		smartLinkAriaLabel,
		smartLinkToCurrentPost,
	} = attributes;

	const [ isUrlPopoverOpen, setUrlPopoverOpen ] = useState( false );
	const [ isEditingLink, setIsEditingLink ] = useState( false );
	const [ urlInput, setUrlInput ] = useState( null );

	const toggleRef = useRef( null );
	const autocompleteRef = useRef( null );

	const urlDraft = urlInput !== null ? urlInput : smartLinkUrl || '';

	const closeUrlPopover = useCallback( () => {
		setUrlPopoverOpen( false );
		setIsEditingLink( false );
		setUrlInput( null );
	}, [] );

	const onSubmitLink = ( event ) => {
		event.preventDefault();
		const trimmed = urlDraft.trim();
		if ( ! trimmed ) {
			setAttributes( {
				smartLinkUrl: '',
				smartLinkToCurrentPost: false,
				smartLinkNewTab: false,
			} );
			closeUrlPopover();
			return;
		}
		setAttributes( {
			smartLinkUrl: trimmed,
			smartLinkToCurrentPost: false,
		} );
		setUrlInput( null );
		setIsEditingLink( false );
	};

	const onRemoveLink = () => {
		setAttributes( {
			smartLinkUrl: '',
			smartLinkNewTab: false,
			smartLinkToCurrentPost: false,
			smartLinkRel: '',
			smartLinkAriaLabel: '',
		} );
		closeUrlPopover();
	};

	const renderSettings = () => (
		<>
			<CheckboxControl
				__nextHasNoMarginBottom
				label={ __( 'Open in new tab', '4wp-smart-link' ) }
				checked={ !! smartLinkNewTab }
				onChange={ ( value ) => setAttributes( { smartLinkNewTab: value } ) }
			/>
			<CheckboxControl
				__nextHasNoMarginBottom
				label={ __( 'Mark as nofollow', '4wp-smart-link' ) }
				checked={ relTokensIncludeNofollow( smartLinkRel ) }
				onChange={ ( value ) =>
					setAttributes( {
						smartLinkRel: mergeNofollowIntoRel( smartLinkRel, value ),
					} )
				}
			/>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Accessibility label', '4wp-smart-link' ) }
				value={ smartLinkAriaLabel }
				onChange={ ( value ) => setAttributes( { smartLinkAriaLabel: value || '' } ) }
			/>
		</>
	);

	const renderUrlPopoverBody = () => {
		if ( smartLinkUrl && ! isEditingLink ) {
			return (
				<>
					<URLPopover.LinkViewer
						className="block-editor-format-toolbar__link-container-content"
						url={ smartLinkUrl }
						onEditLinkClick={ () => {
							setIsEditingLink( true );
							setUrlInput( smartLinkUrl );
						} }
					/>
					<Button
						icon={ linkOffIcon }
						label={ __( 'Remove link', '4wp-smart-link' ) }
						onClick={ onRemoveLink }
						size="compact"
					/>
				</>
			);
		}

		return (
			<URLPopover.LinkEditor
				className="block-editor-format-toolbar__link-container-content"
				value={ urlDraft }
				onChangeInputValue={ ( value ) => setUrlInput( value ) }
				onSubmit={ onSubmitLink }
				autocompleteRef={ autocompleteRef }
			/>
		);
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
							aria-expanded={ isOpen }
							aria-haspopup="true"
							icon={ linkIcon }
							label={ __( 'Link', '4wp-smart-link' ) }
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
									setAttributes( { smartLinkToCurrentPost: false } );
									setUrlInput( null );
									if ( smartLinkUrl ) {
										setIsEditingLink( false );
									} else {
										setIsEditingLink( true );
									}
									onClose();
									requestAnimationFrame( () => {
										setUrlPopoverOpen( true );
									} );
								} }
							>
								{ __( 'Custom Link', '4wp-smart-link' ) }
							</MenuItem>
							<MenuItem
								icon={ postFeaturedImage }
								isPressed={ smartLinkToCurrentPost }
								onClick={ () => {
									setAttributes( {
										smartLinkToCurrentPost: true,
										smartLinkUrl: '',
									} );
									closeUrlPopover();
									onClose();
								} }
							>
								{ __( 'Post Link', '4wp-smart-link' ) }
							</MenuItem>
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
				{ isUrlPopoverOpen && (
					<URLPopover
						anchorRef={ toggleRef }
						onClose={ closeUrlPopover }
						renderSettings={ renderSettings }
						offset={ 13 }
					>
						{ renderUrlPopoverBody() }
					</URLPopover>
				) }
			</ToolbarGroup>
		</BlockControls>
	);
}

const withCoverLinkInspectorControls = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if ( props.name !== 'core/cover' ) {
			return <BlockEdit { ...props } />;
		}

		const {
			smartLinkUrl,
			smartLinkNewTab,
			smartLinkRel,
			smartLinkAriaLabel,
			smartLinkToCurrentPost,
		} = props.attributes;

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
				<CoverLinkToolbar
					attributes={ props.attributes }
					setAttributes={ props.setAttributes }
				/>
				<InspectorControls>
					<PanelBody
						title={ __( 'Cover Link', '4wp-smart-link' ) }
						initialOpen={ false }
						className="forwp-smart-link-cover-panel"
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __(
								'Dynamic: Link to current post (Query Loop)',
								'4wp-smart-link'
							) }
							checked={ !! smartLinkToCurrentPost }
							onChange={ ( value ) =>
								props.setAttributes( { smartLinkToCurrentPost: value } )
							}
						/>
						{ smartLinkToCurrentPost ? (
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
							<div className="forwp-smart-link-cover-panel__custom">
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
										className="forwp-smart-link-cover-panel__remove"
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
}, 'withCoverLinkInspectorControls' );

addFilter(
	'editor.BlockEdit',
	'forwp/smart-link/inspector-controls',
	withCoverLinkInspectorControls
);
