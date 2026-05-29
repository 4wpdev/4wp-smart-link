=== 4WP Smart Link ===
Contributors: 4wpdev, anatolikkk
Tags: gutenberg, query loop, clickable cover, group block, block link
Requires at least: 6.4
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.2.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Make Cover, Group, and Column blocks fully clickable in Gutenberg and Query Loop—no wrapper block, no custom code.

== Description ==

Make **Cover**, **Group**, and **Column** blocks fully clickable in Gutenberg.

Build Query Loop post cards where visitors can click the image or padding to open the post—while the post title, categories, tags, and buttons keep their own links.

A plugin by [4wp.dev](https://4wp.dev/plugin/4wp-smart-link/).

= Demo =

https://www.youtube.com/watch?v=8ZGojkTl2CM

= Perfect for =

* Clickable **post cards** in a Query Loop
* **Cover** heroes that link to a landing page, the current post, or **Enlarge on click** (core lightbox)
* **Group** or **Column** layouts that behave like one big tap target

= How it works =

1. Select a **Cover**, **Group**, or **Column** block.
2. Open **Smart Link** in the block toolbar.
3. Choose **Custom Link**, **Post Link** (inside a Query Loop post template), or on **Cover** with an image background: **Link to image file** / **Enlarge on click**.
4. Open **Preview** or the published page to test clicks.

Smart Link runs on the **published front end**. The block editor canvas may not show the same click area as the live site—use Preview when you check behavior.

= When the block already has links inside =

If the block has no other links inside, the whole block opens your URL.

If you added a **Post Title**, **buttons**, or **terms** inside the block, those links still work separately. Clicking empty space (background, padding) opens your Smart Link URL—without broken nested links.

== Screenshots ==

1. Smart Link on a Cover inside a Query Loop—toolbar menu and sidebar with Post Link
2. Published Query Loop cards—each Cover opens the matching post on the front end
3. Custom Link on a Column block (social link cards in a Columns layout)
4. Column Link settings—URL, new tab, nofollow, and accessibility label
5. Front end: the whole Column card is clickable; inner text links still work separately

== Installation ==

1. Upload the plugin folder to `wp-content/plugins/` or install the ZIP through **Plugins → Add New**.
2. Activate **4WP Smart Link** through the Plugins screen.

== Frequently Asked Questions ==

= Which blocks are supported? =

**Cover**, **Group**, and **Column** blocks from the WordPress block library.

= What happens if the URL is empty? =

The block looks and behaves as usual—no extra link is added.

= When does “Post Link” work? =

When the block is inside a **Query Loop** post template. Each card uses that post’s permalink. Outside a Query Loop, use **Custom Link** and enter your URL.

= Does this replace native Cover linking? =

WordPress Cover does not make the whole block one click target in the way card layouts need. **4WP Smart Link** adds that on the front end—see *Other Notes* if you theme or extend the plugin.

= Does it depend on other 4WP plugins? =

No. It runs on its own.

= How do I make a Cover block clickable in a Query Loop? =

Place a **Cover** (or **Group** / **Column**) inside the Query Loop post template. Select the block, open **Smart Link**, and choose **Post Link**. Check clicks on the published page or in Preview.

= How do I link a Group that already has buttons or a post title inside? =

Turn on **Smart Link** on the **Group** (or **Column** / **Cover**). Buttons, title, categories, and tags keep their own links. Clicks on empty areas (image, padding) open your Smart Link URL.

= How do I add Enlarge on click to a Cover block? =

Select a **Cover** with an image background (not video only). Open **Smart Link** in the toolbar, choose **Enlarge on click**. The cover uses the same core lightbox as the Image block—a small expand icon opens the full image; the rest of the cover is not a link. In the sidebar you can include the cover in the **page lightbox gallery** to move between enlarged images on the same page.

= How do I create clickable post cards in Gutenberg? =

Use **Query Loop** with **Cover** or **Group**, enable **Smart Link** with **Post Link**, and add **Post Title** or **Post Terms** inside the card if you want. Visitors can open the post from the card surface and still use inner links.

= Will the editor look exactly like the live site? =

Not always. The clickable layer is added when WordPress renders the page on the front end. Use **Preview** or view the published page to confirm clicks and theme styles.

= Accessibility: card-as-one-link pattern =

With no inner links, the whole block is one link—easy to tap and clear for assistive tech. When inner links exist, keyboard and screen-reader users can still reach buttons and text links separately; empty areas open your Smart Link URL.

= SEO `rel` when opening in a new tab =

If you open in a new tab, the plugin adds `noopener` and `noreferrer` when needed, and keeps your own `nofollow` or other `rel` values.

== Other Notes ==

**For developers and theme authors**

**Anchor mode** (no inner links): wraps markup in `<a class="forwp-smart-link-wrapper forwp-smart-link-wrapper--{cover|group|column}">` with `data-forwp-smart-link`.

**Host mode** (inner links present): uses `data-forwp-smart-link-url` and `assets/forwp-smart-link-frontend.js` so link-in-link HTML is never output; inner anchors stay separate.

Filters: `forwp_smart_link_supported_blocks`, `forwp_smart_link_has_inner_links`, `forwp_smart_link_use_host_mode`.

Style `.forwp-smart-link-wrapper` on the front end. Editor-only classes (`forwp-smart-link-cover-panel*`) are not stable for theme CSS.

Source and issues: [4wp-smart-link on GitHub](https://github.com/4wpdev/4wp-smart-link).

== Changelog ==

= 1.2.0 =
* Cover **Enlarge on click** — core/image-compatible lightbox (expand icon; cover area is not a whole-block link).
* Cover **Link to image file** and toolbar link UI aligned with the native Image block URL popover.
* **Page lightbox gallery** — optional prev/next between Cover and Image lightboxes on the same page.
* Editor preview shows the enlarge icon on Cover when lightbox is enabled.

= 1.1.0 =
* Smart Link for **Group** and **Column** (same controls as Cover).
* Query Loop **Post Link** on all three block types.
* Safe behavior when the block already contains title, terms, or buttons—no invalid nested links.
* Editor tips when inner links are detected.

= 1.0.0 =
* Initial release: **Cover** block, custom URL, Query Loop post link, toolbar and sidebar controls.
* Front-end styles for clear keyboard focus on the link wrapper.
