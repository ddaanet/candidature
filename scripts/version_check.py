import re
import urllib.request

PACKAGE = 'ddaanet/candidature'
url = 'https://github.com/ddaanet/candidature/blob/main/VERSION'

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'candidature-skill'})
    html = urllib.request.urlopen(req, timeout=10).read().decode()
    m = re.search(rf'{PACKAGE} (\d+\.\d+\.\d+)(?![-.\d])', html)
    if m:
        print(f'VERSION_REMOTE={m.group(1)}')
    else:
        print('VERSION_REMOTE=UNKNOWN')
except Exception as e:
    print(f'VERSION_REMOTE=ERROR {e}')
