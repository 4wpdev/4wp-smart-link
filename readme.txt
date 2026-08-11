=== 4WP Smart Link ===
Contributors: 4wpdev, anatolikkk
Tags: gutenberg, query loop, clickable cover, group block, block link
Requires at least: 6.4
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.2.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Make Cover, Group, and Column blocks fully clickable in Gutenberg and Query Loop—no wrapper block, no custom code.

== Description ==

**4WP Smart Link** makes **Cover**, **Group**, and **Column** blocks fully clickable on the front end—without custom CSS, without wrapper blocks, and without breaking nested links inside the block.

Add it to a **Query Loop** post template and the whole card becomes one tap target that opens the post, while the post title, categories, tags, and buttons keep working independently.

Learn more, compare approaches, and see use cases on the plugin page at [4wp.dev](https://4wp.dev/plugin/4wp-smart-link/).

= Demo =

https://www.youtube.com/watch?v=8ZGojkTl2CM

= Perfect for =

* Clickable **post cards** in a Query Loop—click the image or padding to open the post
* **Cover** heroes linked to a landing page, the current post, the **background image file**, or **Enlarge on click** (WordPress core lightbox)
* **Group** or **Column** card layouts—portfolio grids, service cards, team blocks—where the whole visual unit should behave as one link
* **FSE block themes and classic themes** that use Gutenberg blocks

= How it works =

1. Select a **Cover**, **Group**, or **Column** block.
2. Open **Smart Link** in the block toolbar.
3. Choose **Custom Link**, **Post Link** (inside a Query Loop post template), or—on **Cover** with an image background—**Link to image file** or **Enlarge on click**.
4. Open **Preview** or the published page to test clicks.

Smart Link runs on the **published front end**. The block editor canvas may not show the same click area as the live site—use Preview when you check behavior.

= When the block already has links inside =

If the block has no other links inside, the whole block opens your URL (**anchor mode**).

If you added a **Post Title**, **buttons**, or **terms** inside the block, the plugin switches to **host mode**: those links still work separately, and clicking empty space (background, padding, image) opens your Smart Link URL—without invalid nested `<a>` tags.

= Cover lightbox and page gallery =

On **Cover** blocks with an image background you can choose **Enlarge on click**. This uses the **WordPress core lightbox** (the same behaviour as the Image block): a small expand control opens the full image; the cover area itself is not a whole-block link.

In the sidebar you can turn on **Include in page lightbox gallery** so visitors can move to other enlarged images on the same page (Cover and Image blocks that use the core lightbox). Turn it off on a single Cover to open only that image.

= Why 4WP Smart Link? =

WordPress still does not ship a native “make this whole block clickable” option for Cover, Group, or Column—especially inside **Query Loop** cards with dynamic permalinks and inner links. CSS-only workarounds and raw HTML `<a>` wraps break down quickly. 4WP Smart Link adds a toolbar control, handles anchor vs. host mode automatically, and keeps output valid and accessible.

== Screenshots ==

1. Smart Link on a Cover inside a Query Loop—toolbar menu and sidebar with Post Link
2. Published Query Loop cards—each Cover opens the matching post on the front end
3. Custom Link on a Column block (social link cards in a Columns layout)
4. Column Link settings—URL, new tab, nofollow, and accessibility label
5. Front end: the whole Column card is clickable; inner text links still work separately

== Installation ==

1. Upload the plugin folder to `wp-content/plugins/` or install the ZIP through **Plugins → Add New**.
2. Activate **4WP Smart Link** through the Plugins screen.
3. Select a Cover, Group, or Column block → **Smart Link** in the toolbar → choose your link mode.
4. Preview or publish, then test clicks on the front end.

== Frequently Asked Questions ==

= Which blocks are supported? =

**Cover**, **Group**, and **Column** blocks from the WordPress block library. Theme and plugin authors can extend the list with the `forwp_smart_link_supported_blocks` filter.

= What happens if the URL is empty? =

The block looks and behaves as usual—no extra link or markup is added.

= When does “Post Link” work? =

When the block is inside a **Query Loop** post template. Each card uses that post’s permalink. Outside a Query Loop, use **Custom Link** and enter your URL.

= How do I make a post card in a Query Loop fully clickable? =

Place a **Cover**, **Group**, or **Column** inside the Query Loop post template. Select the block, open **Smart Link**, and choose **Post Link**. Check clicks on the published page or in Preview—not only in the editor canvas.

= How do I link a Group that already has buttons or a post title inside? =

Turn on **Smart Link** on the **Group** (or **Column** / **Cover**). Buttons, title, categories, and tags keep their own links. Clicks on empty areas open your Smart Link URL. The plugin detects inner links automatically and uses **host mode** so HTML stays valid.

= How do I add Enlarge on click to a Cover block? =

Select a **Cover** with an image background (uploaded image, external URL, or **Featured image** in a Query Loop). Open **Smart Link** in the toolbar and choose **Enlarge on click**. A small expand icon appears on the front end; the rest of the cover is not a link.

= What is the page lightbox gallery? =

When **Enlarge on click** is enabled on a Cover, the sidebar offers **Include in page lightbox gallery**. When enabled, visitors can use prev/next controls to move between enlarged images on the same page (Cover and Image blocks using the core lightbox). Disable it on one Cover to open only that image in isolation.

= Can I link a Cover to the image file instead of the post? =

Yes. On a Cover with an image background, choose **Link to image file** in the Smart Link toolbar. The whole cover links to the background image URL on the front end. You can open it in a new tab from the sidebar.

= Does Enlarge on click work with Featured image in a Query Loop? =

Yes. Use **Featured image** as the Cover background inside the post template, then enable **Enlarge on click** or **Post Link** as needed. Each card resolves against its own post in the loop.

= Does this replace native Cover linking? =

WordPress Cover does not make the whole block one click target for card layouts. **4WP Smart Link** adds that on the front end—see *Other Notes* if you theme or extend the plugin.

= Does it work with my theme? =

Yes. It does not require Twentig, GenerateBlocks, or any page builder. It works on block themes and classic themes that use Gutenberg.

= Does it depend on other 4WP plugins? =

No. **4WP Smart Link** runs on its own.

= How do I create clickable post cards in Gutenberg? =

Use **Query Loop** with **Cover** or **Group**, enable **Smart Link** with **Post Link**, and add **Post Title** or **Post Terms** inside the card if you want. Visitors can open the post from the card surface and still use inner links.

= Will the editor look exactly like the live site? =

Not always. The clickable layer is added when WordPress renders the page on the front end. Use **Preview** or view the published page to confirm clicks and theme styles.

= My Cover block showed “This block has encountered an error” in the editor—what was that? =

Version **1.2.2** fixes an editor crash when a **Cover** inside a **Query Loop** used **Featured image** as the background. Update to **1.2.2** and hard-refresh the editor (Cmd/Ctrl+Shift+R). If an error persists, check the browser console and report it on [GitHub](https://github.com/4wpdev/4wp-smart-link).

= What are anchor mode and host mode? =

**Anchor mode** (no inner links): the block is wrapped in a single `<a>` element. **Host mode** (inner links present): a lightweight script opens your URL when visitors click non-link areas; nested anchors stay separate. The plugin picks the mode automatically.

= Accessibility: card-as-one-link pattern =

With no inner links, the whole block is one link—easy to tap and clear for assistive tech. When inner links exist, keyboard and screen-reader users can still reach buttons and text links separately; empty areas open your Smart Link URL.

= SEO `rel` when opening in a new tab =

If you open in a new tab, the plugin adds `noopener` and `noreferrer` when needed, and keeps your own `nofollow` or other `rel` values.

= Where can I read more? =

Visit [4wp.dev/plugin/4wp-smart-link/](https://4wp.dev/plugin/4wp-smart-link/) for overview, comparison with other approaches, and development notes. Source and issues: [GitHub](https://github.com/4wpdev/4wp-smart-link).

== Other Notes ==

**For developers and theme authors**

**Anchor mode** (no inner links): wraps markup in `<a class="forwp-smart-link-wrapper forwp-smart-link-wrapper--{cover|group|column}">` with `data-forwp-smart-link`.

**Host mode** (inner links present): uses `data-forwp-smart-link-url` and `assets/forwp-smart-link-frontend.js` so link-in-link HTML is never output; inner anchors stay separate.

**Cover lightbox**: `smartLinkDestination` value `lightbox` and `smartLinkLightbox` attributes; optional page gallery via `assets/forwp-smart-link-lightbox-gallery.js` and core Image block lightbox modules.

Filters: `forwp_smart_link_supported_blocks`, `forwp_smart_link_has_inner_links`, `forwp_smart_link_use_host_mode`, `forwp_smart_link_cover_media_url`, `forwp_smart_link_cover_featured_post_id`.

Style `.forwp-smart-link-wrapper` and `.forwp-smart-link-host` on the front end. Editor-only classes (`forwp-smart-link-cover-panel*`) are not stable for theme CSS.

Source and issues: [4wp-smart-link on GitHub](https://github.com/4wpdev/4wp-smart-link).

== Changelog ==

= 1.2.2 =
* Fix: Cover blocks with **Featured image** inside a **Query Loop** no longer crash the block editor (“This block has encountered an error”).
* Editor: resolve featured image URL via block context and `core/editor` (aligned with core Cover), not the wrong data store.
* Editor: Rules of Hooks fix in Smart Link toolbar components (Cover image modes in Query Loop).
* Readme: expanded FAQ, page lightbox gallery notes, link to [4wp.dev](https://4wp.dev/plugin/4wp-smart-link/).

= 1.2.1 =
* Deactivate safely instead of a fatal error when the plugin install is incomplete (missing files after a bad update).
* Ensures all 1.2.0 release files are included in the WordPress.org package.

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
