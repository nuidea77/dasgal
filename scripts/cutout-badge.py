"""Cut a badge off its flat black background without a model eating the rim.

The renders are one bright blob on pure black, so the background is exactly the
region reachable from the image border through dark pixels. Flooding from the
border keeps interior dark pixels (shadowed enamel, engraved lines) opaque,
which is where the ML remover kept biting into the bezel.
"""
from PIL import Image, ImageFilter
from collections import deque
import sys


def cutout(path: str, out: str, size: int, threshold: int = 26) -> None:
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = im.load()
    lum = [[(px[x, y][0] * 299 + px[x, y][1] * 587 + px[x, y][2] * 114) // 1000 for x in range(w)] for y in range(h)]

    # Background = dark pixels connected to the border.
    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if lum[y][x] <= threshold and not bg[y * w + x]:
                bg[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if lum[y][x] <= threshold and not bg[y * w + x]:
                bg[y * w + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not bg[ny * w + nx] and lum[ny][nx] <= threshold:
                bg[ny * w + nx] = 1
                q.append((nx, ny))

    alpha = Image.frombytes('L', (w, h), bytes(255 if not b else 0 for b in bg))
    # Soften the 1px staircase the threshold leaves behind.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(alpha)

    im = im.crop(im.split()[3].getbbox())
    cw, ch = im.size
    side = max(cw, ch)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - cw) // 2, (side - ch) // 2))
    sq.resize((size, size), Image.LANCZOS).quantize(colors=255, method=Image.FASTOCTREE).save(out, optimize=True)


if __name__ == '__main__':
    cutout(sys.argv[1], sys.argv[2], int(sys.argv[3]))
