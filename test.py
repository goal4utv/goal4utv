import os
import math
import random
import requests
from datetime import date, datetime, timezone, timedelta
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from colorthief import ColorThief

# ===============================
# ★  PICK YOUR STYLES HERE  ★
# -------------------------------------------------------
# 4 = Gradient Mesh          (deep colour-cloud backdrop)
# ===============================
STYLES_TO_GENERATE = [4]

# ===============================
# CONFIGURATION
# ===============================
MATCHES_URL    = "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/matches/FRL1.json"
TEAMS_URL      = "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/teams/FRL1.json"
BRAND_LOGO_URL = "https://goal4u.netlify.app/assets/img/site-logo/bg-white.png"
OUTPUT_DIR, CACHE_DIR = "output_images", "cache"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

STYLE_NAMES = {
    4: "gradient",
}

# ===============================
# UTILITIES
# ===============================
def download_file(url, filename):
    filepath = os.path.join(CACHE_DIR, filename)
    if not os.path.exists(filepath):
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(r.content)
            else:
                print(f"⚠️  Failed to download {url} (status {r.status_code})")
                return None
        except Exception as e:
            print(f"❌ Error downloading {url}: {e}")
            return None
    return filepath


def load_font(bold=False, size=40):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf"  if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"        if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "arialbd.ttf" if bold else "arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def get_team_color(image_path):
    try:
        ct = ColorThief(image_path)
        palette = ct.get_palette(color_count=6, quality=1)
        def saturation(c):
            mx, mn = max(c), min(c)
            return (mx - mn) / (mx + 1)
        return max(palette, key=saturation)
    except Exception:
        return (60, 60, 60)


def get_timezone_times(utc_datetime_str):
    try:
        s = utc_datetime_str.rstrip("Z")
        dt_utc = datetime.fromisoformat(s).replace(tzinfo=timezone.utc)
    except Exception:
        return None

    def is_bst(dt):
        year = dt.year
        march_end = datetime(year, 3, 31)
        bst_start = march_end - timedelta(days=(march_end.weekday() + 1) % 7)
        oct_end   = datetime(year, 10, 31)
        bst_end   = oct_end - timedelta(days=(oct_end.weekday() + 1) % 7)
        return bst_start <= dt.replace(tzinfo=None) < bst_end

    zones = [
        ("UK",  "GMT", timedelta(hours=0)),
        ("ET",  "ET",  timedelta(hours=-5)),
        ("IST", "IST", timedelta(hours=5, minutes=30)),
        ("SGT", "SGT", timedelta(hours=8)),
    ]
    result = []
    for label, abbr, offset in zones:
        if abbr == "GMT" and is_bst(dt_utc):
            offset = timedelta(hours=1)
            abbr   = "BST"
        local = dt_utc + offset
        result.append({"label": label, "abbr": abbr, "time": local.strftime("%H:%M")})
    return result


# ===============================
# BACKGROUND STYLE PAINTERS
# ===============================
def bg_gradient_mesh(canvas, W, H, h_color, a_color, px1, py1, px2, py2):
    """Style 4 — Modern gradient mesh with deep colour clouds."""
    d = ImageDraw.Draw(canvas)

    # Base: very dark centre, richer edges
    for y in range(H):
        for x_step in range(0, W, 4):
            t_x = x_step / W         # 0→1 left to right
            t_y = y / H              # 0→1 top to bottom
            # Blend from h_color (left) to a_color (right), darkened
            r = int((h_color[0] * (1 - t_x) + a_color[0] * t_x) * 0.18)
            g = int((h_color[1] * (1 - t_x) + a_color[1] * t_x) * 0.18)
            b = int((h_color[2] * (1 - t_x) + a_color[2] * t_x) * 0.18)
            # Add slight top-to-bottom darkening
            r = max(0, min(255, int(r * (0.7 + 0.6 * t_y))))
            g = max(0, min(255, int(g * (0.7 + 0.6 * t_y))))
            b = max(0, min(255, int(b * (0.7 + 0.6 * t_y))))
            d.line([(x_step, y), (x_step + 4, y)], fill=(r, g, b))

    # ── Large soft colour blobs ────────────────────────────────────────────────
    blobs = [
        (W * 0.08,  H * 0.25, 280, h_color, 70),
        (W * 0.92,  H * 0.25, 280, a_color, 70),
        (W * 0.08,  H * 0.80, 200, h_color, 50),
        (W * 0.92,  H * 0.80, 200, a_color, 50),
        (W * 0.50,  H * 0.10, 180, (255, 200, 50), 25),   # gold top-center
    ]
    for (bx, by, br, color, max_a) in blobs:
        blob = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd   = ImageDraw.Draw(blob)
        for r in range(br, 0, -5):
            alpha = int(max_a * (1 - r / br) ** 1.6)
            bd.ellipse([bx - r, by - r, bx + r, by + r], fill=(*color, alpha))
        blob = blob.filter(ImageFilter.GaussianBlur(30))
        canvas = Image.alpha_composite(canvas, blob)

    d = ImageDraw.Draw(canvas)

    # ── Fine mesh grid overlay ─────────────────────────────────────────────────
    grid_gap = 55
    for x in range(0, W, grid_gap):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 9))
    for y in range(0, H, grid_gap):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 9))

    # ── Diagonal accent lines ──────────────────────────────────────────────────
    for i in range(-H, W, 120):
        d.line([(i, 0), (i + H, H)], fill=(255, 255, 255, 7), width=1)

    # ── Edge vignette ─────────────────────────────────────────────────────────
    vig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd  = ImageDraw.Draw(vig)
    for i in range(180):
        a = int((i / 180) ** 1.5 * 180)
        vd.rectangle([i, i, W - i, H - i], outline=(0, 0, 0, a))
    canvas = Image.alpha_composite(canvas, vig)

    return canvas


BG_PAINTERS = {
    4: bg_gradient_mesh,
}


# ===============================
# BROADCAST CARD ENGINE
# ===============================
def create_match_card(home, away, league, brand_path,
                      utc_datetime_str, match_date_str, match_id, style=4):
    W, H = 1280, 720

    tz_times      = get_timezone_times(utc_datetime_str)
    fallback_time = utc_datetime_str[11:16] if len(utc_datetime_str) > 15 else "TBD"

    BG_DARK   = (10, 12, 18)
    BG_MID    = (18, 22, 32)
    BG_STRIP  = (14, 16, 24)
    GOLD      = (255, 200, 50)
    WHITE     = (255, 255, 255)
    DIM_WHITE = (180, 185, 200)
    DIVIDER   = (40, 44, 58)

    h_color = get_team_color(home['logo'])
    a_color = get_team_color(away['logo'])

    def brighten(c, factor=1.35):
        return tuple(min(255, int(v * factor)) for v in c)

    h_bright = brighten(h_color)
    a_bright = brighten(a_color)

    # Panel geometry
    px1, px2 = 160, W - 160
    py1, py2 = 90,  H - 148
    mid_x    = (px1 + px2) // 2
    panel_cy = (py1 + py2) // 2

    # ── 1. Paint the background style ─────────────────────────────────────────
    canvas = Image.new("RGBA", (W, H), BG_DARK)
    painter = BG_PAINTERS.get(style, bg_gradient_mesh)
    canvas  = painter(canvas, W, H, h_color, a_color, px1, py1, px2, py2)

    # ── 2. Team color washes inside the panel halves ──────────────────────────
    def color_wash(base, box, color, alpha=60):
        wash = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(wash).rectangle(box, fill=(*color, alpha))
        return Image.alpha_composite(base, wash)

    canvas = color_wash(canvas, [px1, py1, mid_x, py2], h_color)
    canvas = color_wash(canvas, [mid_x, py1, px2, py2], a_color)

    # ── 3. Frosted dark panel overlay ─────────────────────────────────────────
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(panel).rounded_rectangle(
        [px1, py1, px2, py2], radius=14, fill=(*BG_MID, 175))
    canvas = Image.alpha_composite(canvas, panel)
    draw   = ImageDraw.Draw(canvas)

    # ── 4. Panel borders (home left, away right) ───────────────────────────────
    draw.rectangle([px1,     py1, px1 + 6, py2],   fill=h_color)
    draw.rectangle([px2 - 6, py1, px2,     py2],   fill=a_color)
    draw.rectangle([px1,     py1, mid_x,   py1+5], fill=h_color)
    draw.rectangle([mid_x,   py1, px2,     py1+5], fill=a_color)

    # ── 5. Radial logo glows ───────────────────────────────────────────────────
    h_cx   = px1 + (mid_x - px1) // 2
    a_cx   = mid_x + (px2 - mid_x) // 2
    logo_cy = panel_cy - 20

    def draw_glow(base, cx, cy, color, radius=155):
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd   = ImageDraw.Draw(glow)
        for r in range(radius, 0, -4):
            alpha = int(85 * (1 - r / radius) ** 1.8)
            gd.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*color, alpha))
        return Image.alpha_composite(base, glow)

    canvas = draw_glow(canvas, h_cx, logo_cy, h_color)
    canvas = draw_glow(canvas, a_cx, logo_cy, a_color)

    # ── 6. Team logos ──────────────────────────────────────────────────────────
    def prep_logo(path, size=230):
        img = Image.open(path).convert("RGBA")
        img.thumbnail((size, size), Image.Resampling.LANCZOS)
        pad  = 20
        out  = Image.new("RGBA", (img.width + pad*2, img.height + pad*2), (0,0,0,0))
        mask = img.split()[3].point(lambda p: int(p * 0.6))
        shad = Image.new("RGBA", img.size, (0, 0, 0, 160))
        shad.putalpha(mask)
        out.paste(shad, (pad+8, pad+10))
        out = out.filter(ImageFilter.GaussianBlur(10))
        out.paste(img, (pad, pad), img)
        return out

    h_logo = prep_logo(home['logo'])
    a_logo = prep_logo(away['logo'])
    canvas.paste(h_logo, (h_cx - h_logo.width//2, logo_cy - h_logo.height//2), h_logo)
    canvas.paste(a_logo, (a_cx - a_logo.width//2, logo_cy - a_logo.height//2), a_logo)
    draw = ImageDraw.Draw(canvas)

    # ── 7. Centre divider + VS badge ──────────────────────────────────────────
    draw.line([(mid_x, py1+30), (mid_x, py2-20)], fill=DIVIDER, width=2)
    br = 36
    draw.ellipse([mid_x-br, logo_cy-br, mid_x+br, logo_cy+br],
                 fill=BG_DARK, outline=GOLD, width=3)
    draw.text((mid_x, logo_cy), "VS",
              font=load_font(bold=True, size=28), fill=GOLD, anchor="mm")

    # ── 8. Team names ──────────────────────────────────────────────────────────
    name_y = py2 - 62
    f_name = load_font(bold=True, size=40)
    gap    = 55
    draw.text((mid_x - gap, name_y), home['name'].upper(),
              font=f_name, fill=h_bright, anchor="rm")
    draw.text((mid_x + gap, name_y), away['name'].upper(),
              font=f_name, fill=a_bright, anchor="lm")

    # ── 9. MATCHDAY pill ──────────────────────────────────────────────────────
    f_tag = load_font(bold=True, size=15)
    tag   = "MATCHDAY"
    tb    = f_tag.getbbox(tag)
    tw, th = tb[2]-tb[0]+22, 24
    tx, ty = px1+14, py1+14
    draw.rounded_rectangle([tx, ty, tx+tw, ty+th], radius=4, fill=GOLD)
    draw.text((tx+tw//2, ty+th//2), tag, font=f_tag, fill=BG_DARK, anchor="mm")

    # ── 10. Bottom strip — 4 timezone clocks ──────────────────────────────────
    strip_y = H - 148
    draw.rectangle([0, strip_y, W, H], fill=BG_STRIP)
    draw.line([(0, strip_y), (W, strip_y)], fill=DIVIDER, width=2)
    draw.rectangle([0,     strip_y, 6,     H], fill=h_color)
    draw.rectangle([W - 6, strip_y, W,     H], fill=a_color)

    f_tz_time  = load_font(bold=True,  size=40)
    f_tz_label = load_font(bold=False, size=17)
    f_date     = load_font(bold=False, size=18)

    if tz_times:
        col_w = W // 4
        for i, tz in enumerate(tz_times):
            cx = col_w * i + col_w // 2
            draw.text((cx, strip_y + 50), tz["time"],
                      font=f_tz_time, fill=GOLD, anchor="mm")
            draw.text((cx, strip_y + 84), f"{tz['label']}  •  {tz['abbr']}",
                      font=f_tz_label, fill=DIM_WHITE, anchor="mm")
            if i < 3:
                draw.line([(col_w*(i+1), strip_y+14), (col_w*(i+1), H-14)],
                          fill=DIVIDER, width=1)
        draw.text((W//2, strip_y+118), match_date_str,
                  font=f_date, fill=(110, 115, 130), anchor="mm")
    else:
        draw.text((W//2, strip_y+55), fallback_time,
                  font=load_font(bold=True, size=50), fill=GOLD, anchor="mm")
        draw.text((W//2, strip_y+108), match_date_str,
                  font=f_date, fill=DIM_WHITE, anchor="mm")

    # ── 11. Top bar ────────────────────────────────────────────────────────────
    top_h = 68
    draw.rectangle([0, 0, W, top_h], fill=BG_STRIP)
    draw.line([(0, top_h), (W, top_h)], fill=DIVIDER, width=2)

    l_img = Image.open(league['logo']).convert("RGBA")
    l_img.thumbnail((42, 42), Image.Resampling.LANCZOS)
    lx, ly = 22, (top_h - l_img.height) // 2
    cr = max(l_img.width, l_img.height) // 2 + 6
    lcx, lcy = lx + l_img.width//2, ly + l_img.height//2
    draw.ellipse([lcx-cr, lcy-cr, lcx+cr, lcy+cr], fill="white")
    canvas.paste(l_img, (lx, ly), l_img)
    draw = ImageDraw.Draw(canvas)

    draw.text((lx + l_img.width + 14, top_h//2),
              league['name'].upper(),
              font=load_font(bold=True, size=19), fill=DIM_WHITE, anchor="lm")
    draw.line([(W//2, 14), (W//2, top_h-14)], fill=DIVIDER, width=1)

    b_img = Image.open(brand_path).convert("RGBA")
    b_img.thumbnail((148, 48), Image.Resampling.LANCZOS)
    canvas.paste(b_img, (W - b_img.width - 22, (top_h - b_img.height)//2), b_img)

    # ── 12. Save (Using Game ID) ───────────────────────────────────────────────
    out_name   = f"{match_id}.png"
    out_path   = os.path.join(OUTPUT_DIR, out_name)
    canvas.convert("RGB").save(out_path, quality=97)
    
    style_name = STYLE_NAMES.get(style, str(style))
    print(f"  ✅  Style {style} ({style_name:10s}) → {out_name}")
    return out_path


# ===============================
# MAIN RUNNER
# ===============================
if __name__ == "__main__":
    print("📅  Fetching ALL matches from JSON...")
    print(f"🎨  Styles to generate: {STYLES_TO_GENERATE}\n")

    try:
        matches = requests.get(MATCHES_URL, timeout=10).json()
        teams   = requests.get(TEAMS_URL,   timeout=10).json()
    except Exception as e:
        print(f"❌ Failed to fetch data: {e}")
        exit(1)

    team_dict  = {t['id']: t for t in teams}
    brand_path = download_file(BRAND_LOGO_URL, "brand_logo.png")

    if not matches:
        print("⚠️  No matches found in the data.")
    else:
        print(f"⚽  Found {len(matches)} match(es) in total.")

    for m in matches:
        # Extract Match ID from ESP.json
        match_id = m.get("GameId", "unknown_match")

        # Extract and format the date specifically for this match
        raw_date = m.get("Date", "")
        try:
            match_display_date = datetime.strptime(raw_date, "%Y-%m-%d").strftime("%d %b %Y")
        except Exception:
            match_display_date = raw_date

        home_t = team_dict.get(m['HomeTeamId'])
        away_t = team_dict.get(m['AwayTeamId'])
        
        if not home_t or not away_t:
            print(f"⚠️  Skipping Match {match_id} — teams not in dict.")
            continue

        # Extract logos from the TEAMS dictionary (using the 'crest' key)
        h_logo_url = home_t.get("crest")
        a_logo_url = away_t.get("crest")
        
        if not h_logo_url or not a_logo_url:
            print(f"⚠️  Skipping Match {match_id} — missing crest URL in teams JSON.")
            continue

        h_path = download_file(h_logo_url, f"logo_{m['HomeTeamId']}.png")
        a_path = download_file(a_logo_url, f"logo_{m['AwayTeamId']}.png")
        
        if not h_path or not a_path:
            print(f"⚠️  Skipping Match {match_id} — logo download failed.")
            continue

        ref_team     = home_t or away_t
        competitions = ref_team.get('runningCompetitions', [])
        
        # Searching for 'Primera Division' based on your team JSON example
        league = next(
            (c for c in competitions if c.get('name') in ["Primera Division", "La Liga"]),
            competitions[0] if competitions else {}
        )
        
        l_path = download_file(league.get('emblem', ''), "league_logo.png") \
                 if league.get('emblem') else None
                 
        if not l_path:
            print(f"⚠️  Skipping Match {match_id} — league logo unavailable.")
            continue

        print(f"⚙️  Generating Match {match_id}: {m['HomeTeamKey']} vs {m['AwayTeamKey']}")
        for style in STYLES_TO_GENERATE:
            create_match_card(
                {"name": m['HomeTeamKey'], "logo": h_path},
                {"name": m['AwayTeamKey'], "logo": a_path},
                {"name": league.get('name', 'Primera Division'), "logo": l_path},
                brand_path,
                m.get("DateTime", ""),
                match_display_date,
                match_id=match_id,
                style=style,
            )
        print()