import os
import sys
from PIL import Image

def resize(folder, fileName, width, height):
    filePath = os.path.join(folder, fileName)
    im = Image.open(filePath)
    newIm = im.resize((width, height), Image.ANTIALIAS)
    newIm.save(filePath)

def bulk_resize(folder, width, height):
    imgExts = ["png", "jpg"]
    for path, dirs, files in os.walk(folder):
        for fileName in files:
            ext = fileName[-3:].lower()
            if ext not in imgExts:
                continue

            resize(path, fileName, width, height)

if __name__ == "__main__":
    folder = sys.argv[1] # first arg is path to image folder
    width = int(sys.argv[2])  # width
    height = int(sys.argv[3])  # height
    bulk_resize(folder, width, height)
