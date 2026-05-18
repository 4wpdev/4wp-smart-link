<?php
/**
 * Server-side Smart Link attribute registration for supported core blocks.
 *
 * @package Forwp\SmartLink
 */

namespace Forwp\SmartLink;

defined( 'ABSPATH' ) || exit;

/**
 * Ensures Smart Link attrs persist through save/render (not editor-only).
 */
final class Block_Attributes {

	/**
	 * @var array<string, array<string, mixed>>
	 */
	private const SMART_LINK_ATTRIBUTES = array(
		'smartLinkUrl'             => array(
			'type'    => 'string',
			'default' => '',
		),
		'smartLinkNewTab'          => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'smartLinkRel'             => array(
			'type'    => 'string',
			'default' => '',
		),
		'smartLinkAriaLabel'       => array(
			'type'    => 'string',
			'default' => '',
		),
		'smartLinkToCurrentPost'   => array(
			'type'    => 'boolean',
			'default' => false,
		),
	);

	/**
	 * @var list<string>
	 */
	private const SUPPORTED_BLOCKS = array(
		'core/cover',
		'core/group',
		'core/column',
	);

	/**
	 * @return void
	 */
	public static function register(): void {
		add_filter( 'register_block_type_args', array( self::class, 'add_attributes_to_block' ), 10, 2 );
	}

	/**
	 * @param array<string, mixed> $args       Block type registration args.
	 * @param string               $block_name Block name.
	 * @return array<string, mixed>
	 */
	public static function add_attributes_to_block( array $args, string $block_name ): array {
		if ( ! in_array( $block_name, self::SUPPORTED_BLOCKS, true ) ) {
			return $args;
		}

		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = array();
		}

		$args['attributes'] = array_merge( $args['attributes'], self::SMART_LINK_ATTRIBUTES );

		return $args;
	}
}
