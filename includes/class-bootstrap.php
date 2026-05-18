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
	 * Whether host-mode front-end script was requested during render.
	 *
	 * @var bool
	 */
	private static $frontend_script_enqueued = false;

	/**
	 * Wire WordPress hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'init', array( self::class, 'register_editor_block' ) );
		add_action( 'wp_enqueue_scripts', array( self::class, 'enqueue_frontend_assets' ) );

		Block_Attributes::register();
		Block_Link::register();
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
	 * Enqueue baseline styles; script only when host mode rendered on this request.
	 *
	 * @return void
	 */
	public static function enqueue_frontend_assets(): void {
		wp_enqueue_style(
			'forwp-smart-link-frontend',
			FORWP_SMART_LINK_URL . 'assets/forwp-smart-link-frontend.css',
			array(),
			FORWP_SMART_LINK_VERSION
		);

		if ( self::$frontend_script_enqueued ) {
			self::register_frontend_script();
		}
	}

	/**
	 * Mark host-mode script for enqueue (safe to call during block render).
	 *
	 * @return void
	 */
	public static function enqueue_frontend_script(): void {
		self::$frontend_script_enqueued = true;

		if ( did_action( 'wp_enqueue_scripts' ) ) {
			self::register_frontend_script();
		}
	}

	/**
	 * @return void
	 */
	private static function register_frontend_script(): void {
		if ( wp_script_is( 'forwp-smart-link-frontend', 'registered' ) ) {
			return;
		}

		$path = FORWP_SMART_LINK_PATH . 'assets/forwp-smart-link-frontend.js';

		wp_register_script(
			'forwp-smart-link-frontend',
			FORWP_SMART_LINK_URL . 'assets/forwp-smart-link-frontend.js',
			array(),
			FORWP_SMART_LINK_VERSION,
			true
		);

		if ( is_readable( $path ) ) {
			wp_enqueue_script( 'forwp-smart-link-frontend' );
		}
	}
}
