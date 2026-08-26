/**
 * Post Featured Image toolbar — Enlarge on click only (core lightbox).
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { BlockControls, URLPopover } from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToolbarGroup,
	Button,
	MenuItem,
	NavigableMenu,
} from '@wordpress/components';
import { link as linkIcon, fullscreen as fullscreenIcon, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import {
	SMART_LINK_DESTINATION,
	isSmartLinkActive,
	resolveSmartLinkDestination,
	smartLinkDestinationPatch,
} from './smart-link-destination';

export function FeaturedImageLightboxToolbar( { attributes, setAttributes } ) {
	const destination = resolveSmartLinkDestination( attributes );
	const [ isLinkUIOpen, setIsLinkUIOpen ] = useState( false );
	const popoverAnchorRef = useRef( null );

	useEffect( () => {
		if (
			destination === SMART_LINK_DESTINATION.LIGHTBOX &&
			attributes?.isLink
		) {
			setAttributes( { isLink: false } );
		}
	}, [ destination, attributes?.isLink, setAttributes ] );

	const closeLinkUI = () => {
		setIsLinkUIOpen( false );
	};

	const onRemoveLink = () => {
		setAttributes( smartLinkDestinationPatch( '' ) );
		closeLinkUI();
	};

	const enableLightboxMode = () => {
		setAttributes( {
			...smartLinkDestinationPatch( SMART_LINK_DESTINATION.LIGHTBOX ),
			isLink: false,
		} );
		setIsLinkUIOpen( true );
	};

	const isLinkActive = isSmartLinkActive( attributes );
	const showExpandPanel =
		destination === SMART_LINK_DESTINATION.LIGHTBOX;
	const showDestinationMenu = isLinkUIOpen && ! showExpandPanel;

	const renderPopoverChildren = () => {
		if ( ! showExpandPanel ) {
			return null;
		}

		return (
			<div className="block-editor-url-popover__expand-on-click">
				<p>{ __( 'Enlarge on click', '4wp-smart-link' ) }</p>
				<p className="description">
					{ __(
						'Scales the image with a lightbox effect',
						'4wp-smart-link'
					) }
				</p>
				<Button
					icon={ linkOff }
					label={ __( 'Disable enlarge on click', '4wp-smart-link' ) }
					onClick={ onRemoveLink }
					size="compact"
				/>
			</div>
		);
	};

	return (
		<BlockControls group="block">
			<ToolbarGroup>
				<ToolbarButton
					ref={ popoverAnchorRef }
					className="components-toolbar__control"
					icon={ linkIcon }
					label={ __( 'Smart Link', '4wp-smart-link' ) }
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
