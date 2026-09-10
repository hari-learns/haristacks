#!/usr/bin/env python3
"""
Import a Substack post into content/<category>/<slug>.mdx.

Reads the post's own body HTML out of the page's preloaded JSON rather than
scraping rendered text, so links, highlights, images, embeds and line breaks
all survive. Downloads images into public/posts/<slug>/ and prints a
word-for-word comparison against the source when it is done.

    python3 scripts/import-substack.py <url> <category> [--force]

Images come out with an empty alt attribute on purpose. Fill them in before
publishing; the script tells you which ones are waiting.
"""

import json
import os
import re
import sys
import html
import difflib
import struct
import time
import urllib.request
from html.parser import HTMLParser

VOID = {"br", "hr", "img", "input", "meta", "link", "source", "iframe"}
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"


# ---------- fetch ----------

def fetch(url: str, bust: bool = False) -> bytes:
    if bust:
        # Substack's CDN will happily hand back a copy from before your last
        # edit, so the page fetch asks for a fresh one.
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}_={int(time.time())}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def from_api(url: str):
    """
    The publication's own API returns the post as JSON. It is cleaner than
    parsing the page and, unlike the CDN-cached HTML, it reflects edits made
    a minute ago. Falls back to the page if it is unavailable.
    """
    m = re.match(r"(https?://[^/]+)/p/([^/?#]+)", url)
    if not m:
        return None
    api = f"{m.group(1)}/api/v1/posts/{m.group(2)}"
    try:
        post = json.loads(fetch(api, bust=True).decode("utf-8", "replace"))
    except Exception as e:
        print(f"  note     API unavailable ({e}); falling back to the page")
        return None
    return post if isinstance(post, dict) and post.get("body_html") else None


def preloads(page: str) -> dict:
    m = re.search(r'window\._preloads\s*=\s*JSON\.parse\("(.*?)"\)\s*;?\s*<', page, re.S)
    if not m:
        sys.exit("could not find window._preloads on the page")
    return json.loads(json.loads('"' + m.group(1) + '"'))


def find_post(data):
    """The node carrying body_html is the post."""
    def hunt(o):
        if isinstance(o, dict):
            if isinstance(o.get("body_html"), str) and len(o["body_html"]) > 400:
                return o
            for v in o.values():
                r = hunt(v)
                if r:
                    return r
        elif isinstance(o, list):
            for v in o:
                r = hunt(v)
                if r:
                    return r
        return None
    node = hunt(data)
    if not node:
        sys.exit("could not find the post body in the page data")
    return node


# ---------- parse ----------

class Node:
    __slots__ = ("tag", "attrs", "kids", "text")

    def __init__(self, tag=None, attrs=None):
        self.tag = tag
        self.attrs = dict(attrs or [])
        self.kids = []
        self.text = None


class Build(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs)
        self.stack[-1].kids.append(n)
        if tag not in VOID:
            self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].kids.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        n = Node()
        n.text = data
        self.stack[-1].kids.append(n)


def parse(fragment: str) -> Node:
    p = Build()
    p.feed(fragment)
    return p.root


# ---------- convert ----------

def inline(n: Node) -> str:
    if n.text is not None:
        return n.text
    inner = "".join(inline(k) for k in n.kids)
    t = n.tag
    s = inner.strip()
    # keep whitespace outside the markers, or "aware </em>of" becomes "awareof"
    lead = inner[: len(inner) - len(inner.lstrip())]
    trail = inner[len(inner.rstrip()) :]
    if t in ("strong", "b"):
        return f"{lead}**{s}**{trail}" if s else inner
    if t in ("em", "i"):
        return f"{lead}_{s}_{trail}" if s else inner
    if t == "mark":
        return f"{lead}<mark>{s}</mark>{trail}" if s else inner
    if t == "code":
        return f"{lead}`{s}`{trail}" if s else inner
    if t == "br":
        return "\n"
    if t == "a":
        href = n.attrs.get("href", "")
        return f"[{s}]({href})" if s and href else inner
    return inner


def tidy(s: str) -> str:
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    return s.strip()


def hard_breaks(block: str) -> str:
    """A single newline is a space in markdown. These were <br> in the source."""
    lines = block.split("\n")
    if len(lines) < 2:
        return block
    out = []
    for i, ln in enumerate(lines):
        nxt = lines[i + 1] if i + 1 < len(lines) else ""
        ends_para = nxt.strip() in ("", ">")
        if i < len(lines) - 1 and not ends_para and not ln.rstrip().endswith("\\"):
            ln = ln.rstrip() + " \\"
        out.append(ln)
    return "\n".join(out)


def first_img(node: Node):
    if node.tag == "img":
        return node
    for k in node.kids:
        if k.text is None:
            r = first_img(k)
            if r:
                return r
    return None


def first_iframe(node: Node):
    if node.tag == "iframe":
        return node
    for k in node.kids:
        if k.text is None:
            r = first_iframe(k)
            if r:
                return r
    return None


def find_tag(node: Node, tag: str):
    if node.tag == tag:
        return node
    for k in node.kids:
        if k.text is None:
            r = find_tag(k, tag)
            if r:
                return r
    return None


def convert(body: str, slug: str, media: list, notes: list) -> list:
    root = parse(body)
    out = []
    seen_iframe = set()

    for n in root.kids:
        if n.text is not None:
            continue
        t = n.tag

        if t == "hr":
            out.append("* * *")
            continue

        if t in ("p", "h1", "h2", "h3", "h4"):
            raw = tidy(inline(n))
            if not raw:
                continue
            pre = {"h1": "# ", "h2": "## ", "h3": "### ", "h4": "#### "}.get(t, "")
            # A run of <br><br> is a paragraph break, not a line break.
            for part in re.split(r"\n\s*\n", raw):
                part = part.strip()
                if not part:
                    continue
                txt = hard_breaks(part)
                head = pre
                # Substack has no heading button, so a paragraph that is
                # entirely one highlight is being used as a section heading.
                # Marked as a heading only provisionally: a highlight with
                # nothing after it is a closing line, not a heading, and that
                # gets settled once every block is known.
                if t == "p" and re.fullmatch(r"<mark>.+</mark>", txt, re.S):
                    head = "## "
                out.append(head + txt)
            continue

        if t == "blockquote":
            paras = [tidy(inline(k)) for k in n.kids if k.text is None and k.tag == "p"]
            paras = [p for p in paras if p]
            if not paras:
                one = tidy(inline(n))
                paras = [one] if one else []
            if paras:
                quoted = []
                for p in paras:
                    lines = hard_breaks(p).split("\n")
                    quoted.append("\n".join("> " + l for l in lines))
                out.append("\n>\n".join(quoted))
            continue

        if t in ("ul", "ol"):
            items = [tidy(inline(k)) for k in n.kids if k.text is None and k.tag == "li"]
            marks = [("- " if t == "ul" else f"{i + 1}. ") + x
                     for i, x in enumerate(items) if x]
            if marks:
                out.append("\n".join(marks))
            continue

        if t in ("div", "figure"):
            classes = n.attrs.get("class", "")

            # Substack's subscribe box is not part of the writing
            if "subscription-widget" in classes or "subscribe" in classes:
                continue

            if "callout" in classes:
                txt = tidy(inline(n))
                if txt:
                    out.append(
                        '<aside className="callout">\n'
                        f"  {md_to_jsx(txt)}\n"
                        "</aside>"
                    )
                continue

            if "pullquote" in classes:
                paras = [tidy(inline(k)) for k in n.kids
                         if k.text is None and k.tag == "p"]
                paras = [x for x in paras if x]
                if paras:
                    quote = paras[0]
                    who = paras[1] if len(paras) > 1 else ""
                    lines = ['<figure className="pullquote">',
                             f"  <blockquote>{md_to_jsx(quote)}</blockquote>"]
                    if who:
                        lines.append(f"  <figcaption>{md_to_jsx(who)}</figcaption>")
                    lines.append("</figure>")
                    out.append("\n".join(lines))
                continue

            img = first_img(n)
            if img is not None and img.attrs.get("src"):
                src = html.unescape(img.attrs["src"])
                w = img.attrs.get("width", "")
                h = img.attrs.get("height", "")
                local = f"/posts/{slug}/{len(media) + 1}"
                media.append({"url": src, "path": local, "w": w, "h": h})
                cap_node = find_tag(n, "figcaption")
                cap = tidy(inline(cap_node)) if cap_node else ""
                attrs = [f'src="{local}"', 'alt=""']
                if w and h:
                    attrs += [f'width="{w}"', f'height="{h}"']
                attrs += ['loading="lazy"', 'decoding="async"']
                fig = ["<figure>", "  <img"]
                fig += [f"    {a}" for a in attrs]
                fig.append("  />")
                if cap:
                    fig.append(f"  <figcaption>{md_to_jsx(cap)}</figcaption>")
                fig.append("</figure>")
                out.append("\n".join(fig))
                continue

            frame = first_iframe(n)
            if frame is not None and frame.attrs.get("src"):
                src = html.unescape(frame.attrs["src"])
                key = re.sub(r"[?&].*$", "", src)
                if key in seen_iframe:
                    continue          # Substack repeats the embed for no-JS
                seen_iframe.add(key)
                src = re.sub(r"[?&](autoplay|showinfo|enablejsapi)=\d", "", src)
                out.append(
                    '<div className="embed">\n'
                    f'  <iframe\n    src="{src}"\n'
                    '    title="Embedded video"\n'
                    '    loading="lazy"\n'
                    '    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"\n'
                    '    allowFullScreen\n  />\n</div>'
                )
                continue

            txt = tidy(inline(n))
            if txt and "subscri" not in txt.lower():
                notes.append(f"skipped a <{t}> containing: {txt[:70]!r}")
            continue

        notes.append(f"unhandled <{t}>")

    # a heading with no content under it was never a heading
    while out and re.fullmatch(r"## <mark>.+</mark>", out[-1], re.S):
        out[-1] = out[-1][3:]

    return out


def md_to_jsx(s: str) -> str:
    """Markdown links inside a JSX caption have to be real anchors."""
    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', s)


# ---------- media ----------

def sniff(data: bytes) -> str:
    if data[:2] == b"\xff\xd8":
        return ".jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return ".bin"


def dimensions(data: bytes, ext: str):
    """Real pixel size, so width/height are integers and reserve the right box."""
    try:
        if ext == ".png":
            return struct.unpack(">II", data[16:24])
        if ext == ".gif":
            return struct.unpack("<HH", data[6:10])
        if ext == ".webp" and data[12:16] == b"VP8X":
            w = int.from_bytes(data[24:27], "little") + 1
            h = int.from_bytes(data[27:30], "little") + 1
            return w, h
        if ext == ".jpg":
            i = 2
            while i < len(data) - 9:
                if data[i] != 0xFF:
                    i += 1
                    continue
                marker = data[i + 1]
                if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                              0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    h, w = struct.unpack(">HH", data[i + 5:i + 9])
                    return w, h
                if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                    i += 2
                    continue
                i += 2 + struct.unpack(">H", data[i + 2:i + 4])[0]
    except Exception:
        pass
    return None


def whole(data: bytes, ext: str) -> bool:
    """A truncated download is still a valid-looking file. Check the tail."""
    if ext == ".jpg":
        return data[:2] == b"\xff\xd8" and data[-2:] == b"\xff\xd9"
    if ext == ".png":
        return data[-8:-4] == b"IEND"
    if ext == ".gif":
        return data[-1:] == b"\x3b"
    if ext == ".webp":
        return len(data) - 8 == struct.unpack("<I", data[4:8])[0]
    return len(data) > 0


# ---------- compare ----------

WORD = re.compile(r"[\w’'×]+")


def words_from_html(body: str) -> list:
    s = re.sub(r"<figcaption.*?</figcaption>", " ", body, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return WORD.findall(html.unescape(s))


def words_from_mdx(text: str) -> list:
    s = re.sub(r"^---\n.*?\n---\n", "", text, flags=re.S)
    s = re.sub(r"<figure>.*?</figure>", " ", s, flags=re.S)
    s = re.sub(r'<div className="embed">.*?</div>', " ", s, flags=re.S)
    s = re.sub(r"</?(aside|figure|figcaption|blockquote)[^>]*>", " ", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"</?mark>|</?em>", "", s)
    s = re.sub(r"^#+ ", "", s, flags=re.M)
    s = re.sub(r"^> ?", "", s, flags=re.M)
    s = s.replace("* * *", " ").replace(" \\", " ")
    s = re.sub(r"[*_`]+", "", s)
    return WORD.findall(s)


# ---------- main ----------

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    if len(args) < 2:
        sys.exit(__doc__)
    url, category = args[0], args[1]

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    post = from_api(url)
    if post is None:
        post = find_post(preloads(fetch(url, bust=True).decode("utf-8", "replace")))
    body = post["body_html"]

    slug = post.get("slug") or url.rstrip("/").split("/")[-1]
    title = post.get("title") or slug
    subtitle = post.get("subtitle") or ""
    date = (post.get("post_date") or "")[:10]
    excerpt = (post.get("description") or subtitle or "").strip()

    out_path = os.path.join(root, "content", category, f"{slug}.mdx")
    if os.path.exists(out_path) and not force:
        sys.exit(f"{out_path} already exists; pass --force to overwrite")
    if not os.path.isdir(os.path.join(root, "content", category)):
        sys.exit(f"no such category folder: content/{category}")

    media, notes = [], []
    blocks = convert(body, slug, media, notes)

    # pull the images down and give them their real extensions
    if media:
        mdir = os.path.join(root, "public", "posts", slug)
        os.makedirs(mdir, exist_ok=True)
    for m in media:
        data = fetch(m["url"])
        ext = sniff(data)
        if not whole(data, ext):
            sys.exit(f"incomplete download: {m['url']}")
        name = m["path"].split("/")[-1] + ext
        with open(os.path.join(root, "public", "posts", slug, name), "wb") as f:
            f.write(data)
        final = f"{m['path']}{ext}"
        dims = dimensions(data, ext)
        blocks = [b.replace(f'src="{m["path"]}"', f'src="{final}"') for b in blocks]
        if dims:
            old_w, old_h = m.get("w", ""), m.get("h", "")
            if old_w and old_h:
                blocks = [
                    b.replace(f'width="{old_w}"\n    height="{old_h}"',
                              f'width="{dims[0]}"\n    height="{dims[1]}"')
                    for b in blocks
                ]
            m["dims"] = dims
        m["final"] = final
        m["bytes"] = len(data)

    def esc(v):
        return v.replace('"', '\\"')

    front = [
        "---",
        f'title: "{esc(title)}"',
        f'subtitle: "{esc(subtitle)}"',
        f'date: "{date}"',
        f'excerpt: "{esc(excerpt)}"',
        f'canonical: "{url.split("?")[0]}"',
        "---",
        "",
        "",
    ]
    text = "\n".join(front) + "\n\n".join(blocks) + "\n"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"wrote content/{category}/{slug}.mdx  ({len(blocks)} blocks)")
    print(f"  title    {title}")
    print(f"  subtitle {subtitle}")
    print(f"  date     {date}")
    for m in media:
        print(f"  image    {m['final']}  {m.get('dims', ('?', '?'))[0]}x{m.get('dims', ('?', '?'))[1]}  {m['bytes']} bytes  (alt text needed)")
    for n in notes:
        print(f"  note     {n}")

    a, b = words_from_html(body), words_from_mdx(text)
    print(f"\nsubstack words {len(a)}   mdx words {len(b)}")
    sm = difflib.SequenceMatcher(None, a, b)
    clean = True
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        clean = False
        print(f"  {tag}: substack {a[i1:i2][:10]}  ->  mdx {b[j1:j2][:10]}")
    print("  identical, word for word" if clean else "  ^ review the above")


if __name__ == "__main__":
    main()
