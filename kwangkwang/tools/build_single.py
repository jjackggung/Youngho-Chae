#!/usr/bin/env python3
# 쾅쾅 뭉치 한 파일 버전 만들기
# 사용법: python3 tools/build_single.py
# index.html 과 js/*.js 를 합쳐서 kwangkwang-moongchi.html 파일 하나로 만들어요.
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'index.html'
OUT = ROOT / 'kwangkwang-moongchi.html'


def inline(match):
    rel = match.group(1)
    js = (ROOT / rel).read_text(encoding='utf-8')
    if '</script' in js.lower() or '<!--' in js:
        sys.exit(f'{rel}: 한 파일에 넣을 수 없는 글자(</script 또는 <!--)가 들어 있어요.')
    return f'<script>\n/* ---------- {rel} ---------- */\n{js.rstrip()}\n</script>'


html = SRC.read_text(encoding='utf-8')
out, count = re.subn(r'<script src="(js/[\w.-]+\.js)"></script>', inline, html)
if count != 5:
    sys.exit(f'스크립트 태그를 {count}개 찾았어요. 5개여야 해요.')
note = ('<!-- 한 파일 버전이에요. tools/build_single.py 가 index.html 과 js/ 폴더를 합쳐서 만들었어요.\n'
        '     고칠 때는 index.html 이나 js/ 파일을 고친 다음 이 파일을 다시 만들어 주세요. -->\n')
out = out.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n' + note, 1)
OUT.write_text(out, encoding='utf-8')
print(f'{OUT.name}: {len(out.encode("utf-8")) / 1024:.0f} KB, 스크립트 {count}개를 넣었어요')
