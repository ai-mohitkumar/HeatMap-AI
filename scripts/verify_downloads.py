import urllib.request
import json

manifest_url = 'http://127.0.0.1:5173/downloads/downloads-manifest.json'
req = urllib.request.urlopen(manifest_url)
data = json.loads(req.read().decode('utf-8'))
print('Manifest status:', req.status)

for k, pkg in data['packages'].items():
    url = 'http://127.0.0.1:5173' + pkg['url']
    r = urllib.request.urlopen(url)
    content = r.read()
    match = len(content) == pkg['sizeBytes']
    print(f"[{k.upper()}] {pkg['fileName']} -> HTTP {r.status}, {len(content):,} bytes. Match: {match}")
