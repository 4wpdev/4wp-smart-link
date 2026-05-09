=== 4WP Smart Link ===
Contributors: 4wpdev, anatolikkk
Tags: gutenberg, blocks, cover, link, query loop
Requires at least: 6.4
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Smart Gutenberg blocks for advanced static and dynamic linking from blocks.

== Description ==

**4WP Smart Link** adds inspector controls and toolbar shortcuts so editors can:

* Attach a custom URL to a Cover block output.
* Use a dynamic “current post” permalink inside Query Loop contexts.

Frontend markup wraps the rendered Cover block in a standards-compliant anchor when a URL resolves.

== Frontend markup ==

When a link is output, the plugin wraps the Cover block with an `<a>` element:

* Base class: `forwp-smart-link-wrapper`
* Block modifier (Cover): `forwp-smart-link-wrapper--cover`
* Machine-readable hint: `data-forwp-smart-link="cover"`

Themes may style `.forwp-smart-link-wrapper` globally or scope overrides per modifier.

== Developer / pre-release checklist ==

Before uploading banners or screenshots:

* Manual QA in the block editor: custom URL, reset, dynamic “Post Link” inside a Query Loop, open-in-new-tab, nofollow / relation field, accessibility label.
* Frontend: confirm `<a>` `href`, `rel` when target is `_blank`, and no empty wrapper when URL resolves empty.

== Installation ==

1. Upload the plugin folder to `wp-content/plugins/` or install the ZIP through **Plugins → Add New**.
2. Activate **4WP Smart Link** through the Plugins screen.

== Frequently Asked Questions ==

= Does this replace native Cover linking? =

Cover does not provide the same link semantics; **4WP Smart Link** layers an `<a>` wrapper server-side.

= Does it depend on other 4WP plugins? =

No. It runs standalone.

= Will the editor preview match the front end? =

The link wrapper is applied on the **front end** only (via `render_block`). The block canvas does not wrap Cover in the same `<a>`, so spacing or theme link styles might differ slightly until you preview the published page.

= Accessibility: card-as-one-link pattern =

Wrapping the whole Cover in an `<a>` is valid when inner blocks do **not** contain other links or interactive controls. Nested `<a>` elements are invalid HTML and hurt accessibility—avoid links/buttons inside a Cover that already has Smart Link enabled.

= SEO `rel` when opening in a new tab =

For `target="_blank"` the plugin adds `noopener` and `noreferrer` to `rel` if missing, while preserving your `nofollow` and other tokens.

== Changelog ==

= 1.0.0 =
* Initial release with Cover block support (custom URL, dynamic Query Loop link, toolbar + inspector).
* Documented stable frontend classes (`forwp-smart-link-wrapper` + `--cover`, `data-forwp-smart-link`); editor uses `forwp-smart-link-cover-panel*` classes.
* Translation template: `languages/4wp-smart-link.pot`.
* Frontend stylesheet for predictable `:focus-visible` on the link wrapper (`assets/forwp-smart-link-frontend.css`).
