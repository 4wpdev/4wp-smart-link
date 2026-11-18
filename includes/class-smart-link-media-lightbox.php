<?php
/**
 * Media lightbox: open an image, a video file or a YouTube embed fullscreen.
 *
 * Plugins render the trigger through the filter, so they work without Smart Link
 * (the filter then returns an empty string and no button is shown):
 *
 *     echo apply_filters( 'forwp_media_lightbox_trigger', '', array(
 *         'type'   => 'youtube',          // image | video | youtube
 *         'src'    => 'https://www.youtube-nocookie.com/embed/ID',
 *         'title'  => 'Git Basics Course',
 *         'format' => 'short',            // short (9:16) | landscape (16:9) | '' (image)
 *     ) );
 *
 * Put the button inside the media wrapper and add `data-forwp-media-lightbox-host`
 * to that wrapper: a click on its image then opens the lightbox too.
 *
 * @package ForWP\SmartLink
 */

namespace ForWP\SmartLink;

defined( 'ABSPATH' ) || exit;

/**
 * Trigger markup + assets for the media lightbox.
 */
final class Smart_Link_Media_Lightbox {

	const HANDLE = 'forwp-smart-link-media-lightbox';

	const TYPES = array( 'image', 'video', 'youtube' );

	/**
	 * @return void
	 */
	public static function register(): void {
		add_filter( 'forwp_media_lightbox_trigger', array( self::class, 'filter_trigger' ), 10, 2 );
	}

	/**
	 * @param string               $html Current markup (empty when nobody handles it).
	 * @param array<string, mixed> $args Trigger arguments.
	 * @return string
	 */
	public static function filter_trigger( $html, $args ): string {
		$button = self::trigger( is_array( $args ) ? $args : array() );

		return '' !== $button ? $button : (string) $html;
	}

	/**
	 * Expand button; enqueues the lightbox script and styles.
	 *
	 * @param array<string, mixed> $args type, src, title, format, label, position (top|bottom).
	 * @return string
	 */
	public static function trigger( array $args ): string {
		$type = sanitize_key( (string) ( $args['type'] ?? '' ) );
		$src  = (string) ( $args['src'] ?? '' );
		if ( ! in_array( $type, self::TYPES, true ) || '' === $src ) {
			return '';
		}

		$format = sanitize_key( (string) ( $args['format'] ?? '' ) );
		$title  = (string) ( $args['title'] ?? '' );
		$label  = (string) ( $args['label'] ?? ( 'image' === $type ? __( 'Enlarge image', '4wp-smart-link' ) : __( 'Open video in lightbox', '4wp-smart-link' ) ) );

		$position = 'bottom' === ( $args['position'] ?? '' ) ? ' is-bottom' : '';

		self::enqueue();

		return sprintf(
			'<button type="button" class="forwp-media-lightbox__open%7$s" data-forwp-media-lightbox="%1$s" data-src="%2$s" data-format="%3$s" data-title="%4$s" aria-haspopup="dialog" aria-label="%5$s" title="%5$s">%6$s</button>',
			esc_attr( $type ),
			esc_url( $src ),
			esc_attr( $format ),
			esc_attr( $title ),
			esc_attr( $label ),
			'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>',
			esc_attr( $position )
		);
	}

	/**
	 * @return void
	 */
	public static function enqueue(): void {
		$js  = 'assets/forwp-smart-link-media-lightbox.js';
		$css = 'assets/forwp-smart-link-media-lightbox.css';

		wp_enqueue_style(
			self::HANDLE,
			FORWP_SMART_LINK_URL . $css,
			array(),
			self::version( $css )
		);
		wp_enqueue_script(
			self::HANDLE,
			FORWP_SMART_LINK_URL . $js,
			array(),
			self::version( $js ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
		wp_localize_script(
			self::HANDLE,
			'forwpMediaLightbox',
			array(
				'close' => __( 'Close', '4wp-smart-link' ),
				'label' => __( 'Media', '4wp-smart-link' ),
			)
		);
	}

	/**
	 * @param string $relative Asset path.
	 * @return string
	 */
	private static function version( string $relative ): string {
		$file = FORWP_SMART_LINK_PATH . $relative;

		return file_exists( $file ) ? (string) filemtime( $file ) : FORWP_SMART_LINK_VERSION;
	}
}
