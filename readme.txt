=== 4WP Smart Link ===
Contributors: 4wpdev, anatolikkk
Tags: gutenberg, query loop, clickable cover, group block, block link
Requires at least: 6.4
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Make Cover, Group, and Column blocks fully clickable in Gutenberg and Query Loop—no wrapper block, no custom code.

== Description ==

A plugin by [4wp.dev](https://4wp.dev/plugin/4wp-smart-link/).

**Demo video:** https://www.youtube.com/watch?v=8ZGojkTl2CM

Query Loop cards and layout blocks (**Cover**, **Group**, **Column**) often need a large click target—open the post, a landing page, or a campaign URL—while titles, tags, and buttons inside the card keep their own links. Core does not offer whole-block linking for these containers.

**4WP Smart Link** adds toolbar and inspector controls on **Cover**, **Group**, and **Column** so you can:

* Set a **custom URL** for Cover, Group, or Column.
* In a Query Loop, link the block to the **current post** (uses the loop item’s post context).
* Open the link in a **new tab** when you need to, with sensible `rel` handling for `target="_blank"`.
* Add optional **relation** (`rel`) tokens and an **accessibility label** when you need more than the visible text.

The actual clickable wrapper is added on the **published front end** when the URL resolves. If there is no URL, the block output is unchanged.

**Important:** When the block has no other links inside, the front end wraps it in a normal `<a>`. When inner links exist (post title, terms, buttons, etc.), the plugin uses a clickable container (`data-forwp-smart-link-url` + a small front-end script) so link-in-link HTML is never output—inner links keep their own URLs.

== Installation ==

1. Upload the plugin folder to `wp-content/plugins/` or install the ZIP through **Plugins → Add New**.
2. Activate **4WP Smart Link** through the Plugins screen.

== Frequently Asked Questions ==

= Which blocks are supported? =

**4WP Smart Link** extends **Core Cover**, **Group**, and **Column** (`core/cover`, `core/group`, `core/column`).

= What happens if the URL is empty? =

No link wrapper is output; the block renders as usual.

= When does “Post Link” work? =

Only when the block is inside a **Query Loop** post template (`core/post-template`). Each loop item supplies the post URL. Outside a Query Loop, use **Custom Link** instead.

= Does this replace native Cover linking? =

Cover does not provide the same whole-block link semantics; **4WP Smart Link** adds anchor or host wrappers on the front end (see Other Notes).

= Does it depend on other 4WP plugins? =

No. It runs standalone.

= How do I make a Cover block clickable in a Query Loop? =

Place a **Cover** (or **Group** / **Column**) inside the Query Loop post template. Select the block, open **Smart Link** in the toolbar, and choose **Post Link** so each card uses that loop item’s permalink. Preview or view the published page to test clicks—the editor canvas does not show the front-end wrapper.

= How do I link a Group block that already has buttons or post title inside? =

Enable **Smart Link** on the **Group** (or **Column** / **Cover**). Inner links (buttons, post title, categories, tags) stay separate and clickable. Clicks on empty areas (image, padding) open the Smart Link URL on the front end without invalid nested `<a>` markup.

= How do I create clickable post cards in Gutenberg? =

Build cards with **Query Loop** + **Cover** or **Group**, add **Smart Link** with **Post Link**, and optionally place **Post Title** or **Post Terms** inside the card. Visitors can open the post from the card surface while still using inner links where you added them.

= Will the editor preview match the front end? =

The link wrapper is applied on the **front end** only (via `render_block`). The block canvas does not show the same anchor or host wrapper, so use **Preview** or the live page to verify click behavior and theme styles.

= Accessibility: card-as-one-link pattern =

With no inner links, the whole block is wrapped in one `<a>`. When inner links exist, a `role="link"` host container handles keyboard and pointer clicks on non-interactive areas; inner buttons and anchors stay focusable and separate.

= SEO `rel` when opening in a new tab =

For `target="_blank"` the plugin adds `noopener` and `noreferrer` to `rel` if missing, while preserving your `nofollow` and other tokens.

== Other Notes ==

**Theme and integration developers**

**Anchor mode** (no inner links): wraps markup in `<a class="forwp-smart-link-wrapper forwp-smart-link-wrapper--{cover|group|column}">` with `data-forwp-smart-link`.

**Host mode** (inner links present): wraps markup in `<div class="forwp-smart-link-host forwp-smart-link-host--{modifier}">` with `data-forwp-smart-link-url`, optional `data-forwp-smart-link-target`, `data-forwp-smart-link-rel`, and `assets/forwp-smart-link-frontend.js` for pointer/keyboard navigation on empty areas.

Filters: `forwp_smart_link_supported_blocks`, `forwp_smart_link_has_inner_links`, `forwp_smart_link_use_host_mode`.

You may style `.forwp-smart-link-wrapper` globally or scope overrides with the `--cover` modifier. Editor-only UI uses separate `forwp-smart-link-cover-panel*` classes; do not rely on those for front-end styling.

Further technical discussion: [4wp-smart-link on GitHub](https://github.com/4wpdev/4wp-smart-link).

== Changelog ==

= 1.1.0 =
* Add Smart Link for **Group** and **Column** (same controls and Query Loop post link as Cover).
* Two front-end modes: `<a>` wrap when there are no inner links; clickable host (`data-forwp-smart-link-url` + small JS) when inner links exist—no link-in-link HTML.
* Server-side attribute registration (`Block_Attributes`); shared `Block_Link` / `Block_Inner_Links` render pipeline.
* Public filters: `forwp_smart_link_supported_blocks`, `forwp_smart_link_has_inner_links`, `forwp_smart_link_use_host_mode`.
* Editor notices explain host mode when title, terms, buttons, or other inner links are present.

= 1.0.0 =
* Initial release with Cover block support (custom URL, dynamic Query Loop link, toolbar + inspector).
* Documented stable frontend classes (`forwp-smart-link-wrapper` + `--cover`, `data-forwp-smart-link`); editor uses `forwp-smart-link-cover-panel*` classes.
* Translation template: `languages/4wp-smart-link.pot`.
* Frontend stylesheet for predictable `:focus-visible` on the link wrapper (`assets/forwp-smart-link-frontend.css`).
