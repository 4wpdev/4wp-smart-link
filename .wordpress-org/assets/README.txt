WordPress.org SVN assets folder (not included in the plugin ZIP).

Generated icons (from plugin root icon.png):
  icon-128x128.png
  icon-256x256.png

Regenerate after replacing icon.png:
  .venv-assets/bin/python3 scripts/export-wporg-assets.py

Banners: place source in assets/wporg-incoming/ as banner-772x250.png
and banner-1544x500.png (same file OK), then run export-wporg-assets.py.
Last banners generated from temp/banner.png (2026-05-18).

Screenshots (WordPress.org Screenshots tab only — not in plugin ZIP):
  screenshot-1.png … screenshot-10.png (1200×900 or 4:3 recommended)
  Captions: readme.txt == Screenshots ==

Playground preview (Try it in Playground on WordPress.org):
  assets/blueprints/blueprint.json
  After SVN upload, a plugin committer must set preview to "public" in the
  plugin Advanced settings on wordpress.org.
