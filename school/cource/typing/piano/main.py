import asyncio
import pygame

W, H = 630, 440
FPS  = 60

BG_COLOR    = (26,  26,  46)
KEY_WHITE   = (255, 255, 255)
KEY_PRESSED = (100, 220, 255)
KEY_BLACK_D = (30,  30,  50)
KEY_OUTLINE = (180, 180, 200)
TEXT_DARK   = (40,  40,  60)
TEXT_LABEL  = (80,  80, 110)
TITLE_COLOR = (160, 200, 255)
TEXT_LIGHT  = (200, 220, 255)
NOTE_GLOW   = (100, 220, 255)

KEY_MAP = [
    ("a", "C4", "Do", 261.63),
    ("s", "D4", "Re", 293.66),
    ("d", "E4", "Mi", 329.63),
    ("f", "F4", "Fa", 349.23),
    ("g", "G4", "So", 392.00),
    ("h", "A4", "La", 440.00),
    ("j", "B4", "Si", 493.88),
    ("k", "C5", "Do", 523.25),
    ("l", "D5", "Re", 587.33),
]

BLACK_GAP_INDICES = {0, 1, 3, 4, 5, 7}
N_KEYS       = len(KEY_MAP)
KEY_AREA_TOP = 150
KEY_MARGIN   = 4


def key_rect(i):
    total_w = W - 20
    key_w   = (total_w - KEY_MARGIN * (N_KEYS - 1)) // N_KEYS
    x       = 10 + i * (key_w + KEY_MARGIN)
    key_h   = H - KEY_AREA_TOP - 20
    return pygame.Rect(x, KEY_AREA_TOP, key_w, key_h)


def black_deco_rect(i):
    r1 = key_rect(i)
    r2 = key_rect(i + 1)
    cx = (r1.right + r2.left) // 2
    bw = max(12, (r2.left - r1.right) + 18)
    bh = (H - KEY_AREA_TOP - 20) * 55 // 100
    return pygame.Rect(cx - bw // 2, KEY_AREA_TOP, bw, bh)


async def main():
    pygame.display.init()
    pygame.font.init()

    screen = pygame.display.set_mode((W, H))
    pygame.display.set_caption("Piano")
    clock  = pygame.time.Clock()

    try:
        font_title  = pygame.font.SysFont("arial", 26, bold=True)
        font_note   = pygame.font.SysFont("arial", 14, bold=True)
        font_sol    = pygame.font.SysFont("arial", 13)
        font_key    = pygame.font.SysFont("arial", 20, bold=True)
        font_center = pygame.font.SysFont("arial", 36, bold=True)
        font_hint   = pygame.font.SysFont("arial", 13)
    except Exception:
        font_title  = pygame.font.Font(None, 30)
        font_note   = pygame.font.Font(None, 18)
        font_sol    = pygame.font.Font(None, 16)
        font_key    = pygame.font.Font(None, 24)
        font_center = pygame.font.Font(None, 42)
        font_hint   = pygame.font.Font(None, 16)

    # ---- sound (loaded after display is ready) ----
    sounds    = {}
    has_sound = False
    try:
        import pygame.mixer
        pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=2048)
        pygame.mixer.set_num_channels(16)
        await asyncio.sleep(0)

        import numpy as np
        SR = 44100
        for key, _, _, freq in KEY_MAP:
            t    = np.linspace(0, 1.2, int(SR * 1.2), endpoint=False)
            wave = np.sin(2 * np.pi * freq * t) * np.exp(-4 * t)
            arr  = (wave * 32767).astype(np.int16)
            sounds[key] = pygame.sndarray.make_sound(np.column_stack([arr, arr]))
            await asyncio.sleep(0)
        has_sound = True
    except Exception:
        has_sound = False

    KEY_SET      = {k for k, *_ in KEY_MAP}
    pressed_keys = set()
    playing_note = ""
    note_timer   = 0

    while True:
        clock.tick(FPS)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return
            elif event.type == pygame.KEYDOWN:
                ch = chr(event.key) if 32 <= event.key < 128 else ""
                if ch in KEY_SET:
                    pressed_keys.add(ch)
                    if has_sound and ch in sounds:
                        sounds[ch].play()
                    for i, row in enumerate(KEY_MAP):
                        if row[0] == ch:
                            playing_note = row[2] + "  (" + row[1] + ")"
                            note_timer   = FPS * 2
                            break
            elif event.type == pygame.KEYUP:
                ch = chr(event.key) if 32 <= event.key < 128 else ""
                pressed_keys.discard(ch)

        if note_timer > 0:
            note_timer -= 1
        else:
            playing_note = ""

        screen.fill(BG_COLOR)

        s = font_title.render("Piano", True, TITLE_COLOR)
        screen.blit(s, (W // 2 - s.get_width() // 2, 14))

        hint = "a s d f g h j k l"
        s = font_hint.render(hint, True, TEXT_LIGHT)
        screen.blit(s, (W // 2 - s.get_width() // 2, 50))

        if playing_note:
            s = font_center.render(playing_note, True, NOTE_GLOW)
            screen.blit(s, (W // 2 - s.get_width() // 2, 90))

        for gap_i in BLACK_GAP_INDICES:
            if gap_i + 1 < N_KEYS:
                br = black_deco_rect(gap_i)
                pygame.draw.rect(screen, KEY_BLACK_D, br, border_radius=4)
                pygame.draw.rect(screen, (0, 0, 0), br, 1, border_radius=4)

        for i, (key_char, note_name, solfege, _) in enumerate(KEY_MAP):
            rect       = key_rect(i)
            is_pressed = key_char in pressed_keys
            color      = KEY_PRESSED if is_pressed else KEY_WHITE
            tc         = TEXT_DARK if is_pressed else TEXT_LABEL

            pygame.draw.rect(screen, color, rect, border_radius=6)
            pygame.draw.rect(screen, KEY_OUTLINE, rect, 2, border_radius=6)

            s = font_sol.render(solfege, True, tc)
            screen.blit(s, (rect.centerx - s.get_width() // 2, rect.bottom - 72))
            s = font_note.render(note_name, True, tc)
            screen.blit(s, (rect.centerx - s.get_width() // 2, rect.bottom - 54))
            s = font_key.render(key_char, True, TEXT_DARK)
            screen.blit(s, (rect.centerx - s.get_width() // 2, rect.bottom - 30))

        pygame.display.flip()
        await asyncio.sleep(0)


asyncio.run(main())
