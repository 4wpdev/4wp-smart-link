<?php
/**
 * Plugin bootstrap.
 *
 * @package Forwp\SmartLink
 */

namespace Forwp\SmartLink;

defined( 'ABSPATH' ) || exit;

/**
 * Registers hooks shared across the plugin.
 */
final class Bootstrap {

	/**
	 * Wire WordPress hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'plugins_loaded', array( self::class, 'load_textdomain' ) );
		add_action( 'init', array( self::class, 'register_editor_block' ) );
		add_action( 'wp_enqueue_scripts', array( self::class, 'enqueue_frontend_styles' ) );

		Cover_Link::register();
	}

	/**
	 * Load translations.
	 *
	 * @return void
	 */
	public static function load_textdomain(): void {
		load_plugin_textdomain(
			'4wp-smart-link',
			false,
			dirname( plugin_basename( FORWP_SMART_LINK_FILE ) ) . '/languages'
		);
	}

	/**
	 * Registers an invisible block type so editor scripts/styles enqueue via block.json.
	 *
	 * @return void
	 */
	public static function register_editor_block(): void {
		$dir = FORWP_SMART_LINK_PATH . 'build/editor';

		if ( is_readable( $dir . '/block.json' ) ) {
			register_block_type( $dir );
		}
	}

	/**
	 * Baseline wrapper styles (focus-visible, box model) on the public site.
	 *
	 * @return void
	 */
	public static function enqueue_frontend_styles(): void {
		wp_enqueue_style(
			'forwp-smart-link-frontend',
			FORWP_SMART_LINK_URL . 'assets/forwp-smart-link-frontend.css',
			array(),
			FORWP_SMART_LINK_VERSION
		);
	}
}
