from lvlib import Level
L = Level(6000.0, 6000.0, 72, 50); T = 0.4
WC, PC = (150, 160, 170), (175, 185, 195)
L.box(0, 0, 72, T, 5.0, 'wall', (120, 150, 170))            # back wall (mosaic)
L.box(0, 0, T, 50, 5.0, 'wall', WC)                         # back-left
L.box(72 - T, 0, 72, 50, 1.0, 'wall', WC)                   # front walls low
L.box(0, 50 - T, 30, 50, 1.0, 'wall', WC); L.box(40, 50 - T, 72, 50, 1.0, 'wall', WC)
# bleachers along the back wall
for i, y in enumerate((T, 2.2, 4.0)): L.box(8, y, 64, y + 1.8, 2.4 - i*0.7, 'bleacher', (190, 120, 90))
# the drained basin (pit): zombies sleep in it; the hero walks on the edge
L.area(14, 10, 56, 34, 'pit', (120, 170, 190))
L.box(12.6, 10, 14, 34, 0.25, 'curb', (230, 230, 235)); L.box(56, 10, 57.4, 34, 0.25, 'curb', (230, 230, 235))
# diving tower at the far end
L.box(59, 18, 63, 26, 3.6, 'tower', (200, 200, 205))
# coach room (front-left), door facing the hall
L.box(0, 38 - T/2, 6, 38 + T/2, 1.3, 'wall', PC); L.box(10, 38 - T/2, 14, 38 + T/2, 1.3, 'wall', PC); L.box(14 - T/2, 38, 14 + T/2, 50, 1.3, 'wall', PC)
L.box(2, 44, 8, 46, 1.0, 'desk', (140, 100, 70)); L.box(10, 46, 13.4, 49.4, 1.8, 'cabinet', (110, 90, 70))
# changing rooms (front-right): lockers
L.box(58 - T/2, 38, 58 + T/2, 44, 1.3, 'wall', PC); L.box(58, 38 - T/2, 72, 38 + T/2, 1.3, 'wall', PC)
for y in (41, 45): L.box(61, y, 70, y + 1, 2.0, 'lockers', (90, 120, 160))
# benches and lifebuoy stands
L.box(20, 40, 30, 41, 0.6, 'bench', (170, 140, 100)); L.box(44, 40, 54, 41, 0.6, 'bench', (170, 140, 100))
# valve wheels (on short pipes) - 3 of them
for (x, y) in ((10, 20), (35, 36.5), (58.5, 12)): L.box(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 1.1, 'valve', (200, 60, 50))
L.zones = {'Чаша': (35, 22), 'Трибуны': (36, 3), 'Тренерская': (7, 43), 'Раздевалка': (65, 44), 'Вышка': (61, 22)}
L.pois = {'p_enter': (35, 47.5), 'p_exit': (35, 49), 'p_journal': (5, 42), 'p_v1': (10, 21.5), 'p_v2': (35, 38), 'p_v3': (58.5, 13.6)}
L.spawns = [(20, 14, 'walker'), (27, 20, 'walker'), (33, 28, 'walker'), (40, 15, 'brute'), (46, 24, 'walker'), (52, 30, 'runner'), (24, 30, 'walker'),
            (38, 22, 'walker'), (50, 13, 'walker'), (30, 12, 'runner'), (44, 31, 'chemist'), (18, 24, 'walker')]
L.lights = [(35, 22, 'cold'), (61, 22, 'cold'), (7, 43, 'warm'), (65, 42, 'red'), (35, 45, 'cold'), (10, 20, 'red'), (58.5, 12, 'red')]
L.render('pool_blockout.png', floor_cols=((205, 215, 222), (188, 200, 210)))
L.export('pool.json', outside='pool', enter='p_enter', pit=[14, 10, 56, 34])
print(L.img)
