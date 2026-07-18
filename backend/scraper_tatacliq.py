"""
Tata CLiQ category scraper.
Renders a category page with Playwright (site is a client-rendered SPA — plain
requests/BeautifulSoup can't see product data), scrolls to trigger lazy-loaded
images, captures product image URLs from network responses (DOM <img> tags stay
empty placeholders even after scroll, image URLs only show up as network requests),
then parses the rendered HTML with BeautifulSoup for name/brand/price/discount/url.

Usage:
    python3 scraper_tatacliq.py <category_url> <output_json_path> [--gender=Men] [--category=Footwear]
"""

import json
import re
import sys
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

PRODUCT_ID_RE = re.compile(r"MP0*(\d+)", re.IGNORECASE)


def extract_product_id(text: str) -> str | None:
    m = PRODUCT_ID_RE.search(text or "")
    return m.group(1) if m else None


def scrape_category(url: str, max_cards: int = 60) -> list[dict]:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
            ),
            viewport={"width": 1400, "height": 1000},
        )
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)

        # First, scroll in big jumps to force the SPA to mount enough product
        # cards into the DOM (it lazy-mounts cards themselves, not just images).
        for _ in range(15):
            page.mouse.wheel(0, 1800)
            page.wait_for_timeout(400)

        cards_locator = page.locator(".ProductModule__base")
        count = min(cards_locator.count(), max_cards)

        # Now walk each card individually and scroll it fully into view so its
        # lazy-loaded image actually mounts, before reading that card's HTML.
        card_htmls = []
        for i in range(count):
            card = cards_locator.nth(i)
            try:
                card.scroll_into_view_if_needed(timeout=5000)
                page.wait_for_timeout(150)
                img = card.locator("img").first
                img.wait_for(state="attached", timeout=2000)
            except Exception:
                pass
            card_htmls.append(card.inner_html())

        browser.close()

    results = []
    for card_html in card_htmls:
        card = BeautifulSoup(card_html, "html.parser")
        brand_el = card.find(class_="ProductDescription__headerText")
        name_el = card.find(class_="ProductDescription__description")
        price_el = card.find(class_="ProductDescription__discount")
        mrp_el = card.find(class_="ProductDescription__priceCancelled")
        discount_el = card.find(class_="ProductDescription__newDiscountPercent")
        link_el = card.find("a", href=True)
        img_el = card.find("img", src=True)

        href = link_el["href"] if link_el else None
        pid = extract_product_id(href) if href else None
        image_url = img_el["src"] if img_el and "tatacliq" in img_el.get("src", "") else None
        if image_url and image_url.startswith("//"):
            image_url = "https:" + image_url

        if not name_el or not price_el:
            continue

        results.append({
            "brand_name": brand_el.get_text(strip=True) if brand_el else None,
            "product_name": name_el.get_text(strip=True),
            "current_price": price_el.get_text(strip=True),
            "original_price": mrp_el.get_text(strip=True) if mrp_el else price_el.get_text(strip=True),
            "discount": discount_el.get_text(strip=True) if discount_el else "Discount not available",
            "image_url": image_url or "Image not available",
            "product_url": f"https://www.tatacliq.com{href}" if href else "URL not available",
            "product_id": pid,
        })

    # de-dupe by product_id (SPA sometimes renders duplicates across scroll batches)
    seen = set()
    deduped = []
    for r in results:
        key = r["product_id"] or r["product_name"]
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)

    return deduped


def scrape_paginated(base_url: str, num_pages: int = 5, max_cards_per_page: int = 60) -> list[dict]:
    """
    base_url must contain a /page-N/ segment (Tata CLiQ category pages are
    paginated at ~40 products/page — scrolling alone caps at page 1's cards).
    """
    all_products = []
    seen_ids = set()
    for n in range(1, num_pages + 1):
        page_url = re.sub(r"/page-\d+", f"/page-{n}", base_url)
        print(f"  page {n}: {page_url[:90]}...")
        products = scrape_category(page_url, max_cards=max_cards_per_page)
        if not products:
            print(f"  page {n}: empty, stopping")
            break
        new_count = 0
        for p in products:
            key = p["product_id"] or p["product_name"]
            if key in seen_ids:
                continue
            seen_ids.add(key)
            all_products.append(p)
            new_count += 1
        print(f"  page {n}: {len(products)} found, {new_count} new")
    return all_products


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 scraper_tatacliq.py <category_url> <output_json_path>")
        sys.exit(1)

    url = sys.argv[1]
    out_path = sys.argv[2]

    print(f"Scraping {url} ...")
    products = scrape_category(url)
    print(f"Found {len(products)} products, "
          f"{sum(1 for p in products if p['image_url'] != 'Image not available')} with images")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    print(f"Saved to {out_path}")
