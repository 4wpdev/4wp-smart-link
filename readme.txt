=== 4WP Smart Link ===
Contributors: 4wpdev, anatolikkk
Tags: gutenberg, blocks, cover, link, query loop
Requires at least: 6.4
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Link the Core Cover block to any URL—or to the current post in a Query Loop—without replacing your block patterns.

== Description ==

Modern layouts often pair the **Query Loop** block with **Cover** for post cards. Editors and visitors expect the whole cover to act as one tap or click target, but Core does not ship that behavior for Cover the way people expect in those patterns.

**4WP Smart Link** adds lightweight controls to the Cover block so you can:

* Set a **custom URL** for the rendered Cover.
* In a Query Loop, link Cover to the **current post** (uses the loop item’s post context).
* Open the link in a **new tab** when you need to, with sensible `rel` handling for `target="_blank"`.
* Add optional **relation** (`rel`) tokens and an **accessibility label** when you need more than the visible text.

The actual clickable wrapper is added on the **published front end** when the URL resolves. If there is no URL, the block output is unchanged.

**Important:** Treat the Cover as a single link only when it does not wrap other links or interactive controls—nested links break HTML and accessibility.

== Installation ==

1. Upload the plugin folder to `wp-content/plugins/` or install the ZIP through **Plugins → Add New**.
2. Activate **4WP Smart Link** through the Plugins screen.

== Frequently Asked Questions ==

= Which blocks are supported? =

**4WP Smart Link** currently extends the **Core Cover** block (`core/cover`) only.

= What happens if the URL is empty? =

No link wrapper is output; the Cover renders as usual.

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

== Other Notes ==

**Theme and integration developers**

When a link is output, the plugin wraps the Cover markup in an `<a>` element with stable classes and a machine-readable hint:

* Base class: `forwp-smart-link-wrapper`
* Block modifier (Cover): `forwp-smart-link-wrapper--cover`
* Hint attribute: `data-forwp-smart-link="cover"`

You may style `.forwp-smart-link-wrapper` globally or scope overrides with the `--cover` modifier. Editor-only UI uses separate `forwp-smart-link-cover-panel*` classes; do not rely on those for front-end styling.

Further technical discussion: [4wp-smart-link on GitHub](https://github.com/4wpdev/4wp-smart-link).

== Changelog ==

= 1.0.0 =
* Initial release with Cover block support (custom URL, dynamic Query Loop link, toolbar + inspector).
* Documented stable frontend classes (`forwp-smart-link-wrapper` + `--cover`, `data-forwp-smart-link`); editor uses `forwp-smart-link-cover-panel*` classes.
* Translation template: `languages/4wp-smart-link.pot`.
* Frontend stylesheet for predictable `:focus-visible` on the link wrapper (`assets/forwp-smart-link-frontend.css`).
