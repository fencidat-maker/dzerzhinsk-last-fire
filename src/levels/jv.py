from lvlib import Level
L = Level(9000.0, 9000.0, 70, 50); T = 0.4
WC, PAD = (150, 140, 170), (90, 160, 210)
L.box(0, 0, 70, T, 5.0, 'wall', (110, 90, 140)); L.box(0, 0, T, 50, 5.0, 'wall', (110, 90, 140))
L.box(70 - T, 0, 70, 50, 1.0, 'wall', WC); L.box(0, 50 - T, 30, 50, 1.0, 'wall', WC); L.box(40, 50 - T, 70, 50, 1.0, 'wall', WC)
# trampoline park: padded low fence with 2 gaps
L.box(6, 8 - T/2, 34, 8 + T/2, 1.0, 'pad', PAD); L.box(6 - T/2, 8, 6 + T/2, 28, 1.0, 'pad', PAD)
L.box(6, 28 - T/2, 16, 28 + T/2, 1.0, 'pad', PAD); L.box(20, 28 - T/2, 34, 28 + T/2, 1.0, 'pad', PAD)
L.box(34 - T/2, 8, 34 + T/2, 14, 1.0, 'pad', PAD); L.box(34 - T/2, 18, 34 + T/2, 28, 1.0, 'pad', PAD)
TR = []
for (x, y) in ((9, 11), (17, 11), (25, 11), (9, 19), (17, 19), (25, 19)):
    L.area(x, y, x + 5, y + 5, 'tramp', (60, 70, 160)); TR.append([x, y, x + 5, y + 5])
# ball pit
L.area(37, 6, 53, 24, 'balls', (230, 120, 90))
L.box(37, 6 - T/2, 53, 6 + T/2, 0.8, 'pad', (240, 200, 80)); L.box(53 - T/2, 6, 53 + T/2, 24, 0.8, 'pad', (240, 200, 80))
L.box(37 - T/2, 6, 37 + T/2, 13, 0.8, 'pad', (240, 200, 80)); L.box(37 - T/2, 17, 37 + T/2, 24, 0.8, 'pad', (240, 200, 80))
# projector booth (back-right corner, raised) - walls all round, front door barricaded
BW = (120, 110, 130)
L.box(56 - T/2, 0, 56 + T/2, 15, 1.6, 'wall', BW); L.box(56, 15 - T/2, 60, 15 + T/2, 1.6, 'wall', BW); L.box(64, 15 - T/2, 70, 15 + T/2, 1.6, 'wall', BW)
L.box(60, 15 - T/2, 64, 15 + T/2, 1.4, 'barricade', (100, 80, 60), id='boothdoor')
L.box(61, 3, 67, 6, 1.4, 'projector', (60, 60, 70))
# launch trampoline aimed at the booth
L.area(50, 27, 55, 32, 'tramp', (200, 60, 60)); TR.append([50, 27, 55, 32, 63, 10])
# climbing frame, ticket desk, cafe
L.box(8, 34, 20, 44, 2.6, 'frame', (220, 180, 60))
L.box(42, 42, 50, 44, 1.1, 'desk', (160, 60, 80))
for (x, y) in ((56, 30), (62, 30), (56, 36), (62, 36)): L.box(x, y, x + 2.4, y + 2.4, 0.8, 'table', (200, 170, 120))
L.box(24, 36, 30, 37.4, 1.1, 'barricade', (100, 90, 90))
L.zones = {'Батуты': (20, 20), 'Сухой бассейн': (45, 15), 'Аппаратная': (63, 8), 'Горка': (14, 39), 'Кафе': (60, 34), 'Касса': (46, 46)}
L.pois = {'j_enter': (35, 47.5), 'j_exit': (35, 49), 'j_booth': (62, 9.5), 'j_proj': (64, 7.5), 'j_launch': (52.5, 29.5)}
L.spawns = [(12, 22, 'walker'), (22, 14, 'walker'), (28, 23, 'runner'), (42, 12, 'walker'), (48, 20, 'walker'), (45, 30, 'walker'), (30, 40, 'walker'), (60, 24, 'runner')]
L.lights = [(20, 20, 'cold'), (45, 15, 'warm'), (63, 8, 'cold'), (52, 29, 'red'), (35, 45, 'cold'), (60, 34, 'warm')]
L.render('jv_blockout.png', floor_cols=((150, 120, 160), (135, 108, 148)))
L.export('jv.json', outside='cinema', enter='j_enter', tramps=TR, beam=[63, 9])
print(L.img)
