import os
import requests
from PIL import Image

img = Image.new('RGB', (64, 64), color='white')
path = 'tmp_test.jpg'
img.save(path)
with open(path, 'rb') as f:
    files = {'image': ('tmp_test.jpg', f, 'image/jpeg')}
    r = requests.post('http://127.0.0.1:8001/api/vision/detect', files=files, timeout=60)
    print('status', r.status_code)
    print(r.text)
os.remove(path)
