<?php
/**
 * Core Cover block link wrapper.
 *
 * @package Forwp\SmartLink
 */

namespace Forwp\SmartLink;

defined( 'ABSPATH' ) || exit;

/**
 * Frontend rendering for Smart Link attributes on core/cover.
 */
final class Cover_Link {

	/**
	 * Register render callback filters.
	 *
	 * @return void
	 */
	public static function register(): void {
		add_filter( 'render_block_core/cover', array( self::class, 'render' ), 10, 2 );
	}

	/**
	 * Wrap core/cover HTML when Smart Link attributes are present.
	 *
	 * @param string $block_content Rendered block content.
	 * @param array  $block         Parsed block data.
	 * @return string
	 */
	public static function render( $block_content, $block ) {
		if ( empty( $block_content ) || ! is_array( $block ) ) {
			return $block_content;
		}

		$attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] )
			? $block['attrs']
			: array();

		$is_dynamic = ! empty( $attrs['smartLinkToCurrentPost'] );
		$url        = '';

		if ( $is_dynamic ) {
			$post_id = 0;
			if ( ! empty( $block['context']['postId'] ) ) {
				$post_id = (int) $block['context']['postId'];
			} elseif ( get_the_ID() ) {
				$post_id = (int) get_the_ID();
			}
			if ( $post_id > 0 ) {
				$url = get_permalink( $post_id );
			}
		} elseif ( ! empty( $attrs['smartLinkUrl'] ) ) {
			$url = (string) $attrs['smartLinkUrl'];
		}

		$url = esc_url_raw( $url );
		if ( empty( $url ) ) {
			return $block_content;
		}

		$target = ! empty( $attrs['smartLinkNewTab'] ) ? '_blank' : '';
		$rel    = ! empty( $attrs['smartLinkRel'] ) ? sanitize_text_field( (string) $attrs['smartLinkRel'] ) : '';
		if ( '_blank' === $target ) {
			$rels = preg_split( '/\s+/', strtolower( $rel ), -1, PREG_SPLIT_NO_EMPTY );
			if ( ! is_array( $rels ) ) {
				$rels = array();
			}
			if ( ! in_array( 'noopener', $rels, true ) ) {
				$rels[] = 'noopener';
			}
			if ( ! in_array( 'noreferrer', $rels, true ) ) {
				$rels[] = 'noreferrer';
			}
			$rel = implode( ' ', array_unique( $rels ) );
		}

		$aria_label = ! empty( $attrs['smartLinkAriaLabel'] )
			? sanitize_text_field( (string) $attrs['smartLinkAriaLabel'] )
			: '';

		$wrapper_class = 'forwp-smart-link-wrapper forwp-smart-link-wrapper--cover';

		$attributes = array(
			'href="' . esc_url( $url ) . '"',
			'class="' . esc_attr( $wrapper_class ) . '"',
			'data-forwp-smart-link="' . esc_attr( 'cover' ) . '"',
			'style="display:block;color:inherit;text-decoration:none;"',
		);

		if ( ! empty( $target ) ) {
			$attributes[] = 'target="' . esc_attr( $target ) . '"';
		}
		if ( ! empty( $rel ) ) {
			$attributes[] = 'rel="' . esc_attr( $rel ) . '"';
		}
		if ( ! empty( $aria_label ) ) {
			$attributes[] = 'aria-label="' . esc_attr( $aria_label ) . '"';
		}

		return sprintf(
			'<a %1$s>%2$s</a>',
			implode( ' ', $attributes ),
			$block_content
		);
	}
}
