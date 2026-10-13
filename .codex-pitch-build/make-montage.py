from PIL import Image, ImageDraw
from pathlib import Path

directory = Path(r'C:\Users\Rodrigue\Documents\githubs\lipaxe-finance-hub\.codex-pitch-build')
files = sorted(directory.glob('visual-v3-slide-*.png'))
tile_width, tile_height = 540, 334
tiles = []
for index, file in enumerate(files, start=1):
    image = Image.open(file).convert('RGB')
    image.thumbnail((tile_width, tile_height - 30))
    tile = Image.new('RGB', (tile_width, tile_height), 'white')
    tile.paste(image, ((tile_width - image.width) // 2, 0))
    ImageDraw.Draw(tile).text((10, tile_height - 22), f'Slide {index}', fill='black')
    tiles.append(tile)

columns = 4
rows = (len(tiles) + columns - 1) // columns
sheet = Image.new('RGB', (columns * tile_width, rows * tile_height), '#d8dfdc')
for index, tile in enumerate(tiles):
    sheet.paste(tile, ((index % columns) * tile_width, (index // columns) * tile_height))
sheet.save(directory / 'visual-v3-montage.png')
