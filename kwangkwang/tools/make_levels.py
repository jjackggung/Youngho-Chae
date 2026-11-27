# 쾅쾅 뭉치 지도 만들기 도구. 사용법: python3 tools/make_levels.py > js/maps.js  (지도 미리보기: python3 tools/make_levels.py show)
import random, json, sys

class M:
    def __init__(s, w, h, fill='d'):
        s.w, s.h = w, h
        s.g = [[fill] * w for _ in range(h)]
        s.signs = {}

    def inb(s, x, y):
        return 0 <= x < s.w and 0 <= y < s.h

    def put(s, x, y, c):
        if s.inb(x, y):
            s.g[y][x] = c

    def get(s, x, y):
        return s.g[y][x] if s.inb(x, y) else '#'

    def rect(s, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                s.put(x, y, c)

    def ell(s, cx, cy, rx, ry, c, only=None):
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                if ((x - cx) / (rx + 0.5)) ** 2 + ((y - cy) / (ry + 0.5)) ** 2 <= 1:
                    if only is None or s.get(x, y) in only:
                        s.put(x, y, c)

    def sprinkle(s, x0, y0, x1, y1, c, p, only, rng):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if s.get(x, y) in only and rng.random() < p:
                    s.put(x, y, c)

    def room(s, x0, y0, x1, y1, rng, rough=2):
        s.rect(x0, y0, x1, y1, '.')
        if rough:
            h = 0
            for x in range(x0, x1 + 1):
                h = max(0, min(rough, h + rng.choice([-1, 0, 0, 1])))
                for j in range(1, h + 1):
                    s.put(x, y0 - j, '.')

    def sign(s, x, y, text):
        s.put(x, y, 'T')
        s.signs[f'{x},{y}'] = text

    def check_signs(s):
        for k in list(s.signs):
            x, y = map(int, k.split(','))
            assert s.get(x, y) == 'T', ('sign overwritten', k)

    def rows(s):
        return [''.join(r) for r in s.g]


def stage1():
    rng = random.Random(11)
    W, H = 84, 34
    m = M(W, H, '.')
    m.rect(0, 12, 12, H - 1, 'd'); m.rect(0, 12, 12, 12, 'g')
    m.rect(13, 10, W - 1, H - 1, 'd'); m.rect(13, 10, W - 1, 10, 'g')
    for _ in range(26):
        cx = rng.randint(2, W - 3); cy = rng.randint(15, H - 2)
        m.ell(cx, cy, rng.randint(1, 3), rng.randint(1, 2), 's', only='d')
    for x in range(W):
        for y in range(H - 3, H):
            if rng.random() < 0.7:
                m.put(x, y, 's')
    m.sprinkle(0, 12, W - 1, H - 1, 'b', 0.035, 'd', rng)
    m.sprinkle(0, 20, W - 1, H - 1, 'c', 0.012, 'ds', rng)

    # start area
    m.put(2, 11, 'P')
    m.sign(4, 11, '{move} 눌러서 오른쪽으로 가 봐요!')
    for x in range(6, 11):
        m.put(x, 11, 'B')
    for (x, y) in [(7, 8), (8, 7), (9, 7), (10, 8)]:
        m.put(x, y, 'B')
    m.sign(11, 11, '{jump} 누르면 점프! 계단 위로 폴짝!')
    for (x, y) in [(14, 8), (15, 7), (16, 7), (17, 8)]:
        m.put(x, y, 'B')
    # dirt wall
    m.rect(20, 5, 22, 9, 'd'); m.rect(20, 5, 22, 5, 'g'); m.put(21, 7, 'b')
    m.sign(18, 9, '{punch} 누르면 펀치! 흙벽을 쾅쾅 부숴 봐!')
    # banana mound
    m.rect(24, 9, 28, 9, 'b'); m.rect(25, 8, 27, 8, 'b'); m.put(26, 7, 'b')
    m.sign(23, 9, '바나나 블록을 부수면 바나나가 와르르! 냠냠!')
    # dig spot + cave with gem 1
    m.rect(29, 14, 39, 17, 's')
    m.rect(31, 11, 37, 13, 'd')
    m.rect(30, 14, 38, 16, '.')
    m.put(34, 15, '1')
    for x in (31, 32, 33, 35, 36):
        m.put(x, 16, 'B')
    m.put(37, 16, 'w')
    # 동굴에서 위로 나가는 좁은 굴 (위는 한쪽으로만 지나가는 나무 발판)
    m.rect(38, 11, 38, 13, '.')
    m.put(38, 10, '=')
    m.sign(31, 9, '{down} 누른 채로 {punch}! 땅을 파고 내려가요. 바로 아래에 보석이 있어!')
    m.sign(38, 16, '위쪽 좁은 굴로 점프! 벽 쪽 화살표를 꾹 누르면 벽을 타고 올라가요.')
    m.sign(30, 16, '{clap} 누르면 짝짝! 숨은 보석이 있는 쪽을 알려 줘요.')
    # checkpoint & moles
    m.put(39, 9, 'F')
    m.sign(41, 9, '두더지 졸병이다! 펀치하거나 위에서 꾹 밟아요!')
    m.put(43, 9, 'e'); m.put(44, 9, 'e')
    # cliff with gem 2 on top
    m.rect(46, 4, 51, 9, 'd'); m.rect(46, 4, 51, 4, 'g')
    m.put(48, 6, 'b'); m.put(50, 8, 'b')
    m.sign(45, 9, '절벽 위에 보석이 반짝! 벽을 타고 올라가 봐!')
    m.put(49, 2, '2')
    for x in (48, 50, 51):
        m.put(x, 3, 'B')
    m.sign(47, 3, '높이 점프! 공중에서 {down} 누른 채로 {punch} 하면 쿵 내려찍기!')
    m.rect(53, 12, 55, 12, 'b')
    # boulder with gem 3
    m.rect(58, 7, 60, 9, 'R'); m.put(59, 8, '3')
    m.sign(56, 9, '단단한 바위! 여러 번 쾅쾅 쳐 봐. 안에 뭔가 반짝여!')
    # boom mound
    m.rect(63, 7, 69, 9, 's')
    for (x, y) in [(63, 8), (63, 9), (64, 8), (66, 9), (68, 8)]:
        m.put(x, y, 'x')
    m.sign(61, 9, '빨간 폭탄 블록을 치면... 펑!')
    # shaft + door room
    m.rect(72, 10, 75, 21, '.')
    m.rect(62, 22, 82, 27, '.')
    m.rect(61, 28, 83, 28, 's')
    m.rect(72, 14, 73, 14, '='); m.rect(74, 18, 75, 18, '=')
    for y in (11, 12, 13):
        m.put(74, y, 'B')
    for y in (15, 16, 17):
        m.put(73, y, 'B')
    for y in (19, 20, 21):
        m.put(74, y, 'B')
    m.sign(70, 9, '이 구멍 아래에 다음 층으로 가는 문이 있어요!')
    m.put(78, 25, 'D')
    m.put(65, 27, 'F')
    m.put(70, 27, 'e')
    for x in (67, 68, 69, 74, 75, 76):
        m.put(x, 27, 'B')
    for x in (77, 79, 81):
        m.put(x, 9, 'B')
    m.put(80, 8, 'h')
    # caves
    caves = [(12, 19, 3, 2), (24, 25, 4, 2), (43, 19, 3, 2), (58, 22, 3, 1), (36, 29, 5, 1), (9, 25, 2, 2)]
    for (cx, cy, rx, ry) in caves:
        m.ell(cx, cy, rx, ry, '.')
    for (x, y) in [(10, 20), (11, 20), (13, 20), (14, 20), (22, 26), (23, 26), (25, 26), (26, 26),
                   (41, 20), (42, 20), (44, 20), (32, 29), (33, 29), (34, 29), (38, 29), (39, 29), (40, 29)]:
        m.put(x, y, 'B')
    m.put(12, 20, 'e'); m.put(24, 26, 'e'); m.put(58, 22, 'v'); m.put(36, 29, 'h')
    # bonus gem 4 (deep left, in stone with crystals)
    m.ell(5, 29, 2, 2, 's')
    for (x, y) in [(3, 28), (7, 30), (5, 27), (7, 28)]:
        m.put(x, y, 'c')
    m.put(5, 29, '4')
    # bonus gem 5 (hard rock chamber + boom entrance)
    m.rect(47, 23, 53, 27, 'R'); m.rect(48, 24, 52, 26, '.')
    m.put(50, 25, '5')
    for x in (48, 49, 51, 52):
        m.put(x, 26, 'B')
    m.put(46, 25, 'x'); m.put(46, 26, 'x')
    m.check_signs()
    return m


def stage2():
    rng = random.Random(22)
    W, H = 90, 40
    m = M(W, H, 'd')
    for y in range(H):
        if y % 7 in (3, 4):
            for x in range(W):
                if rng.random() < 0.8:
                    m.put(x, y, 's')
    for _ in range(14):
        m.ell(rng.randint(2, W - 3), rng.randint(27, H - 2), rng.randint(1, 3), rng.randint(1, 2), 'R')
    m.sprinkle(0, 0, W - 1, H - 1, 'b', 0.035, 'd', rng)
    m.sprinkle(0, 10, W - 1, H - 1, 'c', 0.012, 'ds', rng)
    m.sprinkle(0, 12, W - 1, H - 1, 'x', 0.006, 'd', rng)

    # start chamber
    m.room(1, 2, 14, 8, rng, 1)
    m.rect(0, 9, 15, 9, 's')
    m.put(3, 8, 'P')
    m.sign(5, 8, '새로운 힘! {grab} 누르면 블록을 번쩍! 한 번 더 누르면 휙 던지기!')
    m.put(9, 8, 'd'); m.put(10, 8, 'b'); m.put(10, 7, 'b'); m.put(11, 8, 'd')
    m.put(13, 8, 'w')
    for x in (6, 7, 8):
        m.put(x, 5, 'B')
    # tunnel
    m.rect(15, 6, 22, 8, '.')
    m.sign(16, 8, '모래 게는 단단해서 두 번 쳐야 해요!')
    m.put(19, 8, 'k')
    for x in (17, 18, 20, 21):
        m.put(x, 7, 'B')
    # cavern 1 with pyramid and pillar
    m.room(23, 3, 45, 14, rng, 2)
    m.rect(23, 15, 45, 15, 's')
    rows = [(14, 28, 38), (13, 29, 37), (12, 30, 36), (11, 31, 35), (10, 32, 34), (9, 33, 33)]
    for (y, a, b) in rows:
        m.rect(a, y, b, y, 's')
    m.rect(32, 12, 34, 13, '.')
    m.put(33, 13, '1')
    for (x, y) in [(30, 13), (36, 13), (33, 10)]:
        m.put(x, y, 'b')
    for (x, y) in [(31, 12), (35, 12)]:
        m.put(x, y, 'c')
    m.rect(41, 5, 43, 14, 's'); m.put(42, 9, 'b'); m.put(41, 12, 'b')
    m.put(42, 4, '2')
    m.put(24, 14, 'F')
    m.sign(26, 14, '모래 피라미드 안에 보석이 숨어 있대!')
    m.sign(39, 14, '박쥐는 펀치로 혼내 줘요!')
    m.put(30, 5, 'v'); m.put(38, 4, 'v'); m.put(44, 6, 'v')
    for (x, y) in [(25, 10), (26, 9), (27, 9), (28, 10), (38, 9), (39, 10), (40, 11)]:
        m.put(x, y, 'B')
    # stair tunnel down
    for i in range(8):
        m.rect(44 + i, 13 + i, 46 + i, 15 + i, '.')
    # cavern 2
    m.room(47, 20, 70, 27, rng, 2)
    m.rect(46, 28, 71, 28, 's')
    # boom chain structure with gem 3
    m.rect(58, 21, 66, 27, 's')
    m.rect(60, 23, 64, 26, '.')
    m.put(62, 25, '3')
    for (x, y) in [(58, 26), (59, 24), (60, 22), (62, 21), (64, 21), (66, 22)]:
        m.put(x, y, 'x')
    for x in (60, 61, 63, 64):
        m.put(x, 26, 'B')
    # glass alcove with gem 4 (bonus)
    m.rect(42, 25, 46, 28, '#')
    m.rect(43, 26, 45, 27, '.')
    m.put(46, 26, 'Y'); m.put(46, 27, 'Y')
    m.put(44, 26, '4'); m.put(43, 27, 'B'); m.put(45, 27, 'B')
    m.sign(48, 27, '금 간 유리는 블록을 던져야만 깨져요! {grab} 두 번!')
    m.put(50, 27, 'F')
    m.sign(53, 27, '폭탄 블록이 줄줄이! 하나만 쳐도 펑펑펑!')
    m.put(55, 27, 'e'); m.put(68, 27, 'e')
    # shaft to door room
    m.rect(67, 28, 69, 32, '.')
    m.room(66, 33, 88, 37, rng, 1)
    m.rect(66, 38, 88, 38, 's')
    m.put(84, 35, 'D')
    m.put(70, 37, 'F')
    m.put(76, 37, 'k')
    for x in (72, 73, 74, 79, 80, 81):
        m.put(x, 37, 'B')
    m.sign(81, 37, '보석 3개를 모으면 이 문이 열려요!')
    # bonus gem 5 deep left in red rock
    m.ell(6, 35, 3, 2, 'R')
    m.put(6, 35, '5')
    # pockets
    pockets = [(10, 20, 3, 2), (20, 28, 4, 2), (32, 22, 3, 1), (79, 9, 5, 3), (84, 22, 3, 2), (30, 34, 4, 2), (55, 34, 4, 2)]
    for (cx, cy, rx, ry) in pockets:
        m.ell(cx, cy, rx, ry, '.')
    for (x, y) in [(9, 21), (10, 21), (11, 21), (18, 29), (19, 29), (21, 29), (22, 29), (31, 22), (32, 22), (33, 22),
                   (76, 11), (77, 11), (78, 11), (80, 11), (81, 11), (82, 11), (83, 22), (85, 22), (28, 35), (29, 35), (31, 35), (32, 35),
                   (53, 35), (54, 35), (56, 35), (57, 35)]:
        m.put(x, y, 'B')
    m.put(79, 11, 'Q'); m.put(84, 23, 'h')
    m.put(79, 7, 'v'); m.put(81, 8, 'v'); m.put(20, 29, 'k'); m.put(55, 35, 'e'); m.put(30, 35, 'k')
    m.check_signs()
    return m


def stage3():
    rng = random.Random(33)
    W, H = 90, 40
    m = M(W, H, 'd')
    for _ in range(40):
        m.ell(rng.randint(2, W - 3), rng.randint(2, H - 2), rng.randint(1, 4), rng.randint(1, 2), 's')
    for _ in range(12):
        m.ell(rng.randint(2, W - 3), rng.randint(24, H - 2), rng.randint(1, 3), rng.randint(1, 2), 'R')
    m.sprinkle(0, 0, W - 1, H - 1, 'b', 0.035, 'd', rng)
    m.sprinkle(0, 0, W - 1, H - 1, 'c', 0.014, 'ds', rng)

    # start chamber: lots of bananas to fill super meter
    m.room(1, 2, 18, 9, rng, 1)
    m.rect(0, 10, 19, 10, 's')
    m.put(3, 9, 'P')
    m.sign(5, 9, '새로운 힘! 바나나를 모으면 별이 차올라요. 가득 차면 {super} 눌러서 슈퍼 뭉치로 변신!')
    for x in range(7, 18):
        m.put(x, 9, 'B')
    for x in range(8, 17):
        m.put(x, 6, 'B')
    for x in range(10, 15):
        m.put(x, 4, 'B')
    m.rect(15, 7, 17, 8, 'b')
    # passage
    m.rect(19, 7, 24, 9, '.')
    # cavern A: icy floor, crystal formation with gem 1
    m.room(25, 4, 44, 14, rng, 2)
    m.rect(24, 15, 45, 15, 's')
    m.sign(26, 14, '얼음 바닥은 미끌미끌! 천천히 걸어요.')
    m.ell(35, 12, 3, 2, 'c')
    m.rect(32, 14, 38, 14, 'c')
    m.put(35, 12, '1')
    m.put(35, 12, '1')
    m.put(34, 12, 'c')
    m.rect(29, 9, 31, 9, '='); m.rect(39, 8, 41, 8, '=')
    m.put(30, 8, 'n'); m.put(40, 7, 'n')
    m.sign(30, 14, '눈뭉치 두더지가 눈덩이를 던져요. 펀치로 막아요!')
    m.put(27, 14, 'F')
    for (x, y) in [(29, 12), (30, 11), (31, 11), (39, 11), (40, 11), (41, 12)]:
        m.put(x, y, 'B')
    # ice tower with gem 3 on top
    m.rect(46, 3, 49, 15, 's')
    m.rect(45, 15, 50, 15, 's')
    m.room(45, 1, 52, 2, rng, 0)
    m.put(48, 1, '3')
    m.put(46, 2, 'B'); m.put(47, 2, 'B'); m.put(49, 2, 'B')
    m.room(50, 6, 58, 14, rng, 1)
    m.rect(50, 15, 58, 15, 's')
    m.put(54, 10, 'v')
    m.sign(51, 14, '얼음 탑 꼭대기에도 보석이 있어!')
    # down passage to cavern B
    m.rect(55, 15, 57, 18, '.')
    # cavern B with hard blue rock wall and gem 2
    m.room(36, 19, 72, 25, rng, 2)
    m.rect(36, 26, 72, 26, 's')
    m.rect(44, 19, 49, 25, 'R')
    m.put(46, 22, 'R'); m.put(47, 22, '2')
    m.sign(51, 25, '파란 바위는 엄청 단단해요. 슈퍼 뭉치면 한 방에 쾅!')
    m.put(53, 25, 'F')
    m.put(60, 25, 'e'); m.put(66, 25, 'e'); m.put(40, 25, 'e'); m.put(64, 21, 'v')
    for (x, y) in [(55, 25), (56, 25), (57, 25), (62, 22), (63, 22), (38, 25), (39, 25), (41, 25)]:
        m.put(x, y, 'B')
    # spike pit with bonus gem 4
    m.rect(60, 27, 68, 30, '.')
    m.rect(60, 30, 68, 30, '^')
    m.rect(59, 31, 69, 31, 's')
    m.put(64, 28, '4')
    m.rect(62, 26, 63, 26, '='); m.rect(65, 26, 66, 26, '=')
    m.sign(58, 25, '뾰족 고드름은 아야! 조심조심!')
    # passage to door room
    m.rect(70, 27, 72, 32, '.')
    m.room(70, 33, 88, 37, rng, 1)
    m.rect(70, 38, 88, 38, 's')
    m.put(85, 35, 'D')
    m.put(73, 37, 'F')
    m.put(79, 37, 'n')
    for x in (75, 76, 77, 81, 82, 83):
        m.put(x, 37, 'B')
    # bonus gem 5 hidden in snow top-right
    m.ell(85, 3, 2, 1, 'd')
    m.put(85, 3, '5')
    m.put(84, 3, 'd')
    # pockets
    pockets = [(10, 18, 4, 2), (24, 30, 4, 2), (12, 33, 3, 2), (80, 14, 4, 2), (78, 24, 3, 2), (40, 34, 4, 2), (30, 22, 3, 1)]
    for (cx, cy, rx, ry) in pockets:
        m.ell(cx, cy, rx, ry, '.')
    for (x, y) in [(8, 19), (9, 19), (11, 19), (12, 19), (22, 31), (23, 31), (25, 31), (26, 31), (11, 34), (13, 34),
                   (78, 15), (79, 15), (81, 15), (82, 15), (77, 25), (79, 25), (38, 35), (39, 35), (41, 35), (42, 35),
                   (29, 22), (31, 22)]:
        m.put(x, y, 'B')
    m.put(10, 19, 'e'); m.put(24, 31, 'n'); m.put(80, 15, 'Q'); m.put(78, 25, 'h'); m.put(40, 35, 'e'); m.put(30, 22, 'h')
    m.put(78, 12, 'v')
    m.check_signs()
    return m


def stage4():
    rng = random.Random(44)
    W, H = 90, 40
    m = M(W, H, 'd')
    for _ in range(46):
        m.ell(rng.randint(2, W - 3), rng.randint(2, H - 2), rng.randint(1, 4), rng.randint(1, 2), 's')
    for _ in range(16):
        m.ell(rng.randint(2, W - 3), rng.randint(2, H - 2), rng.randint(1, 2), rng.randint(1, 2), 'R')
    m.sprinkle(0, 0, W - 1, H - 1, 'b', 0.035, 'd', rng)
    m.sprinkle(0, 0, W - 1, H - 1, 'c', 0.012, 'ds', rng)
    m.sprinkle(0, 0, W - 1, H - 1, 'x', 0.005, 'd', rng)

    # start
    m.room(1, 2, 14, 8, rng, 1)
    m.rect(0, 9, 15, 9, 's')
    m.put(3, 8, 'P')
    m.sign(5, 8, '새로운 힘! 왕주먹! 이제 펀치 한 번에 더 넓게 부서져요!')
    m.rect(9, 6, 11, 8, 'R')
    for x in (12, 13):
        m.put(x, 8, 'B')
    # passage down-right
    for i in range(6):
        m.rect(15 + i, 6 + i, 17 + i, 8 + i, '.')
    # lava lake cavern
    m.room(21, 8, 52, 19, rng, 2)
    m.rect(21, 20, 52, 21, 'L')
    m.rect(20, 22, 53, 22, 's')
    m.rect(21, 16, 24, 19, 's')        # left shore
    m.rect(49, 16, 52, 19, 's')        # right shore
    m.put(22, 15, 'F')
    m.sign(23, 15, '용암은 뜨거워요! 발판을 밟고 건너가요.')
    for (a, b, y) in [(27, 29, 17), (32, 33, 15), (43, 44, 15), (46, 47, 17)]:
        m.rect(a, y, b, y, '=')
    m.rect(36, 14, 40, 19, 'R')        # island pillar
    m.rect(36, 13, 40, 13, 's')
    m.put(38, 11, '1')
    for (x, y) in [(28, 16), (32, 14), (33, 14), (43, 14), (44, 14), (47, 16), (37, 12), (39, 12)]:
        m.put(x, y, 'B')
    m.put(30, 11, 'v'); m.put(45, 10, 'v')
    m.put(51, 15, 'f')
    m.sign(50, 15, '불꽃 젤리는 통통 튀어요. 펀치로 퐁!')
    # obsidian vault with gem 2 (right of lake)
    m.room(54, 10, 70, 15, rng, 1)
    m.rect(53, 16, 71, 16, 's')
    m.rect(53, 14, 53, 15, '.')
    m.rect(63, 10, 68, 15, 'R')
    m.rect(64, 12, 67, 14, '.')
    m.put(66, 13, '2')
    m.rect(69, 16, 70, 29, '.')
    m.put(69, 20, '='); m.put(70, 24, '=')
    m.put(65, 14, 'B'); m.put(67, 14, 'B')
    m.put(58, 15, 'f'); m.put(56, 15, 'B'); m.put(57, 15, 'B'); m.put(60, 15, 'B')
    m.sign(61, 15, '검은 바위 금고! 왕주먹으로 쾅쾅!')
    # boom chain tunnel with gem 3
    m.room(8, 24, 34, 29, rng, 1)
    m.rect(8, 30, 34, 30, 's')
    m.rect(14, 15, 16, 23, '.')            # shaft from upper area
    m.rect(14, 10, 16, 14, '.')
    m.rect(22, 24, 30, 29, 's')
    m.rect(25, 26, 28, 28, '.')
    m.put(27, 27, '3')
    for (x, y) in [(22, 28), (23, 26), (24, 24), (26, 24), (28, 24), (30, 25)]:
        m.put(x, y, 'x')
    m.put(26, 28, 'B'); m.put(28, 28, 'B')
    m.sign(18, 29, '폭탄 블록 줄줄이! 펑펑펑 터뜨려 봐!')
    m.put(10, 29, 'F')
    m.put(13, 29, 'f'); m.put(32, 29, 'k')
    # glass alcove with gem 4
    m.rect(1, 25, 5, 29, '#')
    m.rect(2, 26, 4, 28, '.')
    m.put(5, 28, 'Y'); m.put(5, 27, 'Y')
    m.rect(6, 25, 7, 29, '.')
    m.put(3, 27, '4'); m.put(2, 28, 'B'); m.put(4, 28, 'B')
    m.sign(7, 29, '금 간 유리! 블록을 들고 던져 봐!')
    # lower lava cavern to the door
    m.room(36, 30, 70, 36, rng, 2)
    m.rect(36, 37, 70, 37, 's')
    m.rect(45, 36, 47, 37, 'L'); m.rect(57, 36, 59, 37, 'L')
    m.rect(45, 38, 47, 38, 's'); m.rect(57, 38, 59, 38, 's')
    m.rect(35, 30, 35, 29, '.')
    m.rect(33, 29, 35, 30, '.')
    m.put(38, 36, 'F')
    m.put(41, 36, 'f'); m.put(52, 36, 'f'); m.put(64, 36, 'k'); m.put(55, 32, 'v')
    for (x, y) in [(46, 33), (47, 33), (58, 33), (51, 36), (53, 36), (62, 36), (63, 36)]:
        m.put(x, y, 'B')
    m.room(71, 31, 88, 36, rng, 1)
    m.rect(70, 37, 88, 37, 's')
    m.put(85, 34, 'D')
    m.put(73, 36, 'F')
    m.sign(81, 36, '이 문 너머에 두더지 대왕이 있어요! 보석 3개면 열려요.')
    for x in (75, 76, 77, 78):
        m.put(x, 36, 'B')
    m.put(79, 36, 'h')
    # bonus gem 5 hidden deep right-top in obsidian
    m.ell(83, 8, 2, 2, 'R')
    m.put(83, 8, '5')
    m.put(82, 8, 'R')
    # pockets
    pockets = [(77, 20, 4, 2), (60, 24, 4, 2), (45, 27, 3, 1), (5, 17, 3, 2), (86, 26, 2, 2)]
    for (cx, cy, rx, ry) in pockets:
        m.ell(cx, cy, rx, ry, '.')
    for (x, y) in [(74, 21), (75, 21), (79, 21), (80, 21), (58, 25), (59, 25), (61, 25), (62, 25), (44, 27), (46, 27),
                   (4, 18), (6, 18), (86, 27)]:
        m.put(x, y, 'B')
    m.put(77, 21, 'Q'); m.put(60, 25, 'f'); m.put(5, 18, 'h'); m.put(45, 27, 'k')
    m.check_signs()
    return m


def boss():
    W, H = 40, 18
    m = M(W, H, '.')
    m.rect(0, 15, W - 1, H - 1, '#')
    m.rect(3, 11, 8, 11, '='); m.rect(31, 11, 36, 11, '='); m.rect(16, 7, 23, 7, '=')
    m.rect(0, 12, 1, 14, 'b'); m.rect(38, 12, 39, 14, 'b')
    m.put(19, 6, 'h'); m.put(20, 6, 'h')
    m.put(6, 14, 'P')
    m.put(24, 3, 'K')
    for x in (4, 5, 7, 32, 33, 35):
        m.put(x, 10, 'B')
    return m


def check_gems(m, name):
    found = {}
    for y in range(m.h):
        for x in range(m.w):
            c = m.g[y][x]
            if c in '12345':
                left = m.get(x - 1, y)
                found[c] = (x, y, left)
    print(name, 'gems', found, file=sys.stderr)
    for c, (x, y, left) in found.items():
        if left == '#':
            print('  WARNING gem', c, 'left of bedrock', file=sys.stderr)


out = {}
for name, fn in [('jungle', stage1), ('sand', stage2), ('ice', stage3), ('lava', stage4), ('boss', boss)]:
    m = fn()
    check_gems(m, name)
    out[name] = {'rows': m.rows(), 'signs': m.signs}

if len(sys.argv) > 1 and sys.argv[1] == 'show':
    for name, v in out.items():
        print('=====', name)
        for i, r in enumerate(v['rows']):
            print(f'{i:2d} {r}')
else:
    js = ['// 자동 생성된 지도 데이터 (각 글자 = 블록 한 칸). 범례는 README.md 의 지도 고치기 표 참고.', 'const MAPS = {']
    for name, v in out.items():
        js.append(f'  {name}: {{')
        js.append('    rows: [')
        for r in v['rows']:
            js.append('      ' + json.dumps(r) + ',')
        js.append('    ],')
        js.append('    signs: ' + json.dumps(v['signs'], ensure_ascii=False) + ',')
        js.append('  },')
    js.append('};')
    print('\n'.join(js))
