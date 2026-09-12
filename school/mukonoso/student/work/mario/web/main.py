import asyncio
import random
import pygame
import sys

pygame.mixer.init()
try:
    pygame.mixer.music.load("sound/まんまみーあ.mp3")
    pygame.mixer.music.set_volume(0.33)  # 音量を1/3程度に下げる
except pygame.error as e:
    print(f"サウンドを読み込めませんでした: {e}")

# Pygameの初期化
pygame.init()

# 画面サイズの設定
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("マリオ風ゲーム - 落とし穴の作成")

# 色の定義
SKY_BLUE = (135, 206, 235)

# ==========================================
# 1. 画像の読み込みとサイズ設定
# ==========================================
try:
    # プレイヤー（マリオ役）の画像
    mario_img_original = pygame.image.load("人間右向きkirinuki.png").convert_alpha()
    mario_img_original=pygame.transform.rotate(mario_img_original, 0)

    # マリオの大きさを変える (例: 40x60)
    NEW_MARIO_WIDTH = 40
    NEW_MARIO_HEIGHT = 60
    mario_img = pygame.transform.scale(mario_img_original, (NEW_MARIO_WIDTH, NEW_MARIO_HEIGHT))
    mario_rect = mario_img.get_rect()

    # 地面のブロック画像 (例: 32x32を想定)
    block_img = pygame.image.load("mario/草.png").convert_alpha()
    block_rect = block_img.get_rect()
    TILE_SIZE = block_rect.width # マップの1マスのサイズ

except pygame.error as e:
    print(f"画像ファイルが見つかりません。ファイルを同じフォルダに置いてください。\nエラー詳細: {e}")
    pygame.quit()
    sys.exit()

# ==========================================
# 2. マップ（レベル）データの定義（スクロール対応）
# ==========================================
# 地面の高さを定義
MAP_Y = SCREEN_HEIGHT - TILE_SIZE

# レベルを「地面」と「穴」の区間（マス数）で組み立てる
# 画面幅より長くすることで横スクロールが発生する
LEVEL_SEGMENTS = [
    ("ground", 10),
    ("pit", 2),
    ("ground", 6),
    ("pit", 3),
    ("ground", 8),
    ("pit", 2),
    ("ground", 5),
    ("pit", 4),
    ("ground", 10),
]

level_data = []
for kind, length in LEVEL_SEGMENTS:
    level_data.extend([1 if kind == "ground" else 0] * length)

LEVEL_PIXEL_WIDTH = len(level_data) * TILE_SIZE


def tiles_to_px(tile_index):
    return tile_index * TILE_SIZE


# カメラ（画面に映す範囲の左端のワールド座標）
camera_x = 0

# ----------------------------------------------------

# ==========================================
# 3. プレイヤーと物理演算の設定
# ==========================================
# プレイヤーの初期位置（少し高い位置から、左上寄り）
INITIAL_PLAYER_X = 100
INITIAL_PLAYER_Y = 200
player_x = INITIAL_PLAYER_X
player_y = INITIAL_PLAYER_Y

# 物理演算の変数
player_speed = 5
player_y_velocity = 0
GRAVITY = 0.8
jump_power = -15
is_jumping = False

# 被ダメージ時の無敵時間（電撃の継続ダメージなどを1回にまとめるため）
PLAYER_INVULN_FRAMES = 60
player_invuln_timer = 0

# フレームレート制御用の時計
clock = pygame.time.Clock()
running = True
frame_count = 0

# ==========================================
# 4. スマホ用タッチボタンの設定
# ==========================================
BUTTON_SIZE = 70
BUTTON_MARGIN = 20

left_button_rect = pygame.Rect(
    BUTTON_MARGIN, SCREEN_HEIGHT - BUTTON_SIZE - BUTTON_MARGIN, BUTTON_SIZE, BUTTON_SIZE
)
right_button_rect = pygame.Rect(
    BUTTON_MARGIN * 2 + BUTTON_SIZE, SCREEN_HEIGHT - BUTTON_SIZE - BUTTON_MARGIN, BUTTON_SIZE, BUTTON_SIZE
)
jump_button_rect = pygame.Rect(
    SCREEN_WIDTH - BUTTON_SIZE - BUTTON_MARGIN, SCREEN_HEIGHT - BUTTON_SIZE - BUTTON_MARGIN, BUTTON_SIZE, BUTTON_SIZE
)


def button_at(pos):
    if left_button_rect.collidepoint(pos):
        return "left"
    if right_button_rect.collidepoint(pos):
        return "right"
    if jump_button_rect.collidepoint(pos):
        return "jump"
    return None


def draw_touch_buttons(surface, active_buttons):
    for name, rect in (("left", left_button_rect), ("right", right_button_rect), ("jump", jump_button_rect)):
        alpha = 200 if name in active_buttons else 110
        btn_surface = pygame.Surface((rect.width, rect.height), pygame.SRCALPHA)
        pygame.draw.circle(btn_surface, (255, 255, 255, alpha), (rect.width // 2, rect.height // 2), rect.width // 2)
        surface.blit(btn_surface, rect.topleft)

        arrow_color = (60, 60, 60)
        if name == "left":
            points = [
                (rect.right - 20, rect.top + 15),
                (rect.right - 20, rect.bottom - 15),
                (rect.left + 15, rect.centery),
            ]
        elif name == "right":
            points = [
                (rect.left + 20, rect.top + 15),
                (rect.left + 20, rect.bottom - 15),
                (rect.right - 15, rect.centery),
            ]
        else:  # jump
            points = [
                (rect.left + 15, rect.bottom - 20),
                (rect.right - 15, rect.bottom - 20),
                (rect.centerx, rect.top + 15),
            ]
        pygame.draw.polygon(surface, arrow_color, points)


# ==========================================
# 5. 敵の設定（種類を複数用意する）
# ==========================================
# --- 5-1. 通常敵「ウォーカー」（従来の赤い箱。踏むと倒せる）---
WALKER_SIZE = 30
WALKER_COLOR = (220, 30, 30)  # 赤い箱

# --- 5-2. 電撃敵「エレクトロ」（スパイダーマンの敵をイメージした電撃タイプ）---
# 攻撃方法: ①電気の弾を飛ばす ②その場にいる間、周囲の地面に放電して感電させる
ELECTRO_SIZE = 34
ELECTRO_BODY_COLOR = (45, 40, 95)      # 通常時（紫がかった濃紺）
ELECTRO_CHARGE_COLOR = (255, 170, 60)  # 放電の予兆（オレンジ＝警告色）
ELECTRO_DISCHARGE_COLOR = (255, 250, 140)  # 放電中（白に近い黄色）
ELECTRO_GLOW_COLOR = (255, 240, 90)    # 電気エフェクトの色

ELECTRO_SHOT_INTERVAL_MIN = 90   # 電撃弾を撃つ間隔（フレーム）の最小
ELECTRO_SHOT_INTERVAL_MAX = 150  # 最大
ELECTRO_BOLT_SPEED = 6
ELECTRO_BOLT_LIFETIME = 90

ELECTRO_IDLE_FRAMES = 60        # 何もしていない時間
ELECTRO_CHARGE_FRAMES = 45      # 放電の予兆（チャージ）時間
ELECTRO_DISCHARGE_FRAMES = 30   # 放電中の時間
ELECTRO_COOLDOWN_FRAMES = 90    # 放電後のクールダウン
ELECTRO_DISCHARGE_RADIUS_TILES = 3  # 放電が届く左右のマス数


def make_walker(x, y, patrol_left, patrol_right, speed=2):
    return {
        "type": "walker",
        "x": x, "init_x": x, "y": y,
        "alive": True,
        "patrol_left": patrol_left, "patrol_right": patrol_right,
        "direction": 1, "speed": speed,
    }


def make_electro(x, y):
    return {
        "type": "electro",
        "x": x, "init_x": x, "y": y,
        "alive": True,
        "state": "idle",
        "state_timer": ELECTRO_IDLE_FRAMES,
        "shot_cooldown": random.randint(ELECTRO_SHOT_INTERVAL_MIN, ELECTRO_SHOT_INTERVAL_MAX),
    }


enemies = [
    make_walker(tiles_to_px(3), MAP_Y - WALKER_SIZE, tiles_to_px(2), tiles_to_px(8)),
    make_electro(tiles_to_px(14), MAP_Y - ELECTRO_SIZE),
    make_walker(tiles_to_px(23), MAP_Y - WALKER_SIZE, tiles_to_px(22), tiles_to_px(27)),
    make_electro(tiles_to_px(33), MAP_Y - ELECTRO_SIZE),
    make_electro(tiles_to_px(45), MAP_Y - ELECTRO_SIZE),
]

# 電撃弾（エレクトロが飛ばす電気の弾）のリスト
projectiles = []

# ==========================================
# 6. ゴールの設定
# ==========================================
GOAL_TILE = len(level_data) - 3
GOAL_POLE_WIDTH = 8
GOAL_POLE_HEIGHT = 220
goal_rect = pygame.Rect(tiles_to_px(GOAL_TILE), MAP_Y - GOAL_POLE_HEIGHT, GOAL_POLE_WIDTH, GOAL_POLE_HEIGHT)

# ==========================================
# 7. ライフとゲーム状態の設定
# ==========================================
LIVES_INITIAL = 3
lives = LIVES_INITIAL
game_over = False
game_clear = False

pygame.font.init()
hud_font = pygame.font.SysFont(None, 36)
gameover_font = pygame.font.SysFont(None, 72)


def reset_player_position():
    """プレイヤーを初期位置（左上）へ戻す"""
    global player_x, player_y, player_y_velocity, is_jumping
    player_x = INITIAL_PLAYER_X
    player_y = INITIAL_PLAYER_Y
    player_y_velocity = 0
    is_jumping = False


def lose_life():
    """ライフを1つ減らす。0になったらゲームオーバーにする"""
    global lives, game_over
    lives -= 1
    if lives <= 0:
        lives = 0
        game_over = True
    else:
        reset_player_position()


def damage_player():
    """一定時間（無敵時間）内は連続ダメージを受けないようにしてからライフを減らす"""
    global player_invuln_timer
    if player_invuln_timer > 0:
        return
    player_invuln_timer = PLAYER_INVULN_FRAMES
    lose_life()


def reset_game():
    """ゴール・ゲームオーバー後に、Rキーで最初からやり直すための初期化"""
    global lives, game_over, game_clear, camera_x, player_invuln_timer
    lives = LIVES_INITIAL
    game_over = False
    game_clear = False
    player_invuln_timer = 0
    camera_x = 0
    reset_player_position()
    projectiles.clear()
    for enemy in enemies:
        enemy["alive"] = True
        enemy["x"] = enemy["init_x"]
        if enemy["type"] == "walker":
            enemy["direction"] = 1
        elif enemy["type"] == "electro":
            enemy["state"] = "idle"
            enemy["state_timer"] = ELECTRO_IDLE_FRAMES
            enemy["shot_cooldown"] = random.randint(ELECTRO_SHOT_INTERVAL_MIN, ELECTRO_SHOT_INTERVAL_MAX)


# ==========================================
# 8. 敵の更新処理
# ==========================================
def update_walker(enemy, player_rect, prev_feet_y):
    """ウォーカー（従来の赤い箱）：左右にパトロールし、踏むと倒せる"""
    global player_y_velocity, is_jumping

    if not enemy["alive"]:
        return

    enemy["x"] += enemy["speed"] * enemy["direction"]
    if enemy["x"] <= enemy["patrol_left"] or enemy["x"] >= enemy["patrol_right"]:
        enemy["direction"] *= -1

    enemy_rect = pygame.Rect(enemy["x"], enemy["y"], WALKER_SIZE, WALKER_SIZE)
    if player_rect.colliderect(enemy_rect):
        if player_y_velocity > 0 and prev_feet_y <= enemy_rect.top + 10:
            enemy["alive"] = False
            player_y_velocity = jump_power * 0.5
            is_jumping = True
        else:
            damage_player()


def spawn_electro_bolt(enemy, player_rect):
    """エレクトロがプレイヤー目掛けて電気の弾を発射する"""
    ex = enemy["x"] + ELECTRO_SIZE / 2
    ey = enemy["y"] + ELECTRO_SIZE / 2
    dx = player_rect.centerx - ex
    dy = player_rect.centery - ey
    dist = max(1.0, (dx ** 2 + dy ** 2) ** 0.5)
    vx = dx / dist * ELECTRO_BOLT_SPEED
    vy = dy / dist * ELECTRO_BOLT_SPEED
    projectiles.append({"x": ex, "y": ey, "vx": vx, "vy": vy, "life": ELECTRO_BOLT_LIFETIME})


def update_electro(enemy, player_rect, prev_feet_y, player_grid_x, player_on_ground):
    """
    エレクトロ（電撃敵）：
      1. 一定間隔でプレイヤーへ電気の弾を飛ばす
      2. アイドル→チャージ（予兆）→放電→クールダウンを繰り返し、
         放電中は周囲の地面が感電してダメージを与える
      3. 踏みつければ倒せる
    """
    global player_y_velocity, is_jumping

    if not enemy["alive"]:
        return

    enemy_rect = pygame.Rect(enemy["x"], enemy["y"], ELECTRO_SIZE, ELECTRO_SIZE)
    if player_rect.colliderect(enemy_rect):
        if player_y_velocity > 0 and prev_feet_y <= enemy_rect.top + 10:
            enemy["alive"] = False
            player_y_velocity = jump_power * 0.5
            is_jumping = True
            return
        else:
            damage_player()

    # ---- 電撃弾（飛び道具） ----
    enemy["shot_cooldown"] -= 1
    if enemy["shot_cooldown"] <= 0:
        enemy["shot_cooldown"] = random.randint(ELECTRO_SHOT_INTERVAL_MIN, ELECTRO_SHOT_INTERVAL_MAX)
        spawn_electro_bolt(enemy, player_rect)

    # ---- 地面への放電（状態遷移） ----
    enemy["state_timer"] -= 1
    if enemy["state_timer"] <= 0:
        if enemy["state"] == "idle":
            enemy["state"] = "charging"
            enemy["state_timer"] = ELECTRO_CHARGE_FRAMES
        elif enemy["state"] == "charging":
            enemy["state"] = "discharging"
            enemy["state_timer"] = ELECTRO_DISCHARGE_FRAMES
        elif enemy["state"] == "discharging":
            enemy["state"] = "cooldown"
            enemy["state_timer"] = ELECTRO_COOLDOWN_FRAMES
        else:  # cooldown
            enemy["state"] = "idle"
            enemy["state_timer"] = ELECTRO_IDLE_FRAMES

    if enemy["state"] == "discharging" and player_on_ground:
        enemy_grid_x = int((enemy["x"] + ELECTRO_SIZE / 2) // TILE_SIZE)
        if abs(player_grid_x - enemy_grid_x) <= ELECTRO_DISCHARGE_RADIUS_TILES:
            damage_player()


def update_projectiles(player_rect):
    """電撃弾の移動・寿命・プレイヤーへの命中判定"""
    for bolt in projectiles[:]:
        bolt["x"] += bolt["vx"]
        bolt["y"] += bolt["vy"]
        bolt["life"] -= 1

        bolt_rect = pygame.Rect(bolt["x"] - 4, bolt["y"] - 4, 8, 8)
        if bolt_rect.colliderect(player_rect):
            damage_player()
            projectiles.remove(bolt)
            continue

        if bolt["life"] <= 0:
            projectiles.remove(bolt)


# ==========================================
# 9. 描画用ヘルパー（電気エフェクト・敵・ゴール）
# ==========================================
def draw_lightning(surface, start_pos, end_pos, color, segments=6, jitter=8, width=2):
    """2点間をジグザグにつないで、電気（稲妻）っぽい線を描く"""
    x1, y1 = start_pos
    x2, y2 = end_pos
    points = [(int(x1), int(y1))]
    for i in range(1, segments):
        t = i / segments
        mx = x1 + (x2 - x1) * t + random.randint(-jitter, jitter)
        my = y1 + (y2 - y1) * t + random.randint(-jitter, jitter)
        points.append((int(mx), int(my)))
    points.append((int(x2), int(y2)))
    pygame.draw.lines(surface, color, False, points, width)


def draw_ground_discharge(enemy, camera_x):
    """放電中／予兆中に、地面から電気が走っている演出を描く"""
    color = ELECTRO_DISCHARGE_COLOR if enemy["state"] == "discharging" else ELECTRO_CHARGE_COLOR
    enemy_grid_x = int((enemy["x"] + ELECTRO_SIZE / 2) // TILE_SIZE)
    for offset in range(-ELECTRO_DISCHARGE_RADIUS_TILES, ELECTRO_DISCHARGE_RADIUS_TILES + 1):
        col = enemy_grid_x + offset
        if 0 <= col < len(level_data) and level_data[col] == 1:
            tile_x = col * TILE_SIZE - camera_x + TILE_SIZE // 2
            bottom = (tile_x, MAP_Y)
            top = (tile_x, MAP_Y - random.randint(15, 30))
            draw_lightning(screen, bottom, top, color, segments=3, jitter=5)


def draw_electro(enemy, camera_x):
    draw_x = enemy["x"] - camera_x
    center = (draw_x + ELECTRO_SIZE // 2, enemy["y"] + ELECTRO_SIZE // 2)

    body_color = ELECTRO_BODY_COLOR
    if enemy["state"] == "charging":
        body_color = ELECTRO_CHARGE_COLOR
    elif enemy["state"] == "discharging":
        body_color = ELECTRO_DISCHARGE_COLOR
    pygame.draw.circle(screen, body_color, center, ELECTRO_SIZE // 2)

    # 体の周りの電気オーラ（放電中は本数・長さが増える）
    aura_count = 6 if enemy["state"] == "discharging" else (3 if enemy["state"] == "charging" else 2)
    reach = ELECTRO_SIZE if enemy["state"] == "discharging" else int(ELECTRO_SIZE * 0.7)
    for _ in range(aura_count):
        end = (center[0] + random.randint(-reach, reach), center[1] + random.randint(-reach, reach))
        draw_lightning(screen, center, end, ELECTRO_GLOW_COLOR, segments=3, jitter=4)

    if enemy["state"] in ("charging", "discharging"):
        draw_ground_discharge(enemy, camera_x)


def draw_enemies(camera_x):
    for enemy in enemies:
        if not enemy["alive"]:
            continue
        if enemy["type"] == "walker":
            draw_x = enemy["x"] - camera_x
            pygame.draw.rect(screen, WALKER_COLOR, (draw_x, enemy["y"], WALKER_SIZE, WALKER_SIZE))
        elif enemy["type"] == "electro":
            draw_electro(enemy, camera_x)


def draw_projectiles(camera_x):
    for bolt in projectiles:
        draw_x = bolt["x"] - camera_x
        tail = (draw_x - bolt["vx"] * 2, bolt["y"] - bolt["vy"] * 2)
        head = (draw_x + bolt["vx"] * 2, bolt["y"] + bolt["vy"] * 2)
        draw_lightning(screen, tail, head, ELECTRO_GLOW_COLOR, segments=3, jitter=3, width=3)


def draw_goal(camera_x):
    draw_x = goal_rect.x - camera_x
    pygame.draw.rect(screen, (200, 200, 200), (draw_x, goal_rect.y, GOAL_POLE_WIDTH, GOAL_POLE_HEIGHT))
    flag_points = [
        (draw_x + GOAL_POLE_WIDTH, goal_rect.y + 10),
        (draw_x + GOAL_POLE_WIDTH, goal_rect.y + 40),
        (draw_x + GOAL_POLE_WIDTH + 30, goal_rect.y + 25),
    ]
    pygame.draw.polygon(screen, (255, 215, 0), flag_points)


# メインループ（pygbagでブラウザ上でも動かせるようasyncで実装）
async def main():
    global player_x, player_y, player_y_velocity, is_jumping, running
    global lives, game_over, game_clear, camera_x, player_invuln_timer, frame_count

    # 指ID（またはマウス）ごとにどのボタンを押しているかを記録
    active_touches = {}

    while running:
        clock.tick(60)
        frame_count += 1

        # 1. イベント処理（×ボタン、ジャンプ、タッチ操作）
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            if event.type == pygame.KEYDOWN:
                # 上矢印キーでジャンプ（地面にいるときだけ判定したいが、
                # シンプルにするため、ジャンプフラグだけで判定）
                if event.key == pygame.K_UP and not is_jumping and not game_over and not game_clear:
                    player_y_velocity = jump_power
                    is_jumping = True
                # ゲームオーバー／ゴール後はRキーでやり直し
                if event.key == pygame.K_r and (game_over or game_clear):
                    reset_game()

            # スマホのタッチ操作
            elif event.type == pygame.FINGERDOWN:
                pos = (event.x * SCREEN_WIDTH, event.y * SCREEN_HEIGHT)
                btn = button_at(pos)
                if btn:
                    active_touches[event.finger_id] = btn
                    if btn == "jump" and not is_jumping and not game_over and not game_clear:
                        player_y_velocity = jump_power
                        is_jumping = True

            elif event.type == pygame.FINGERUP:
                active_touches.pop(event.finger_id, None)

            # PCブラウザでの動作確認用（マウスクリックもボタンとして扱う）
            elif event.type == pygame.MOUSEBUTTONDOWN:
                btn = button_at(event.pos)
                if btn:
                    active_touches["mouse"] = btn
                    if btn == "jump" and not is_jumping and not game_over and not game_clear:
                        player_y_velocity = jump_power
                        is_jumping = True

            elif event.type == pygame.MOUSEBUTTONUP:
                active_touches.pop("mouse", None)

        active_buttons = set(active_touches.values())

        # ==========================================
        # 2. プレイヤーの移動と物理演算
        # ==========================================
        if not game_over and not game_clear:
            if player_invuln_timer > 0:
                player_invuln_timer -= 1

            # 左右移動（キーボードとタッチボタンの両方に対応）
            keys = pygame.key.get_pressed()
            if keys[pygame.K_LEFT] or "left" in active_buttons:
                player_x -= player_speed
            if keys[pygame.K_RIGHT] or "right" in active_buttons:
                player_x += player_speed

            # レベルの範囲内に収める（スクロールの端を超えて出ないように）
            player_x = max(0, min(player_x, LEVEL_PIXEL_WIDTH - mario_rect.width))

            # 重力の処理（落下前の足元位置を踏みつけ判定のために保存しておく）
            prev_feet_y = player_y + mario_rect.height
            player_y_velocity += GRAVITY
            player_y += player_y_velocity

            # ------------------------------------------
            # ★重要：マップデータに基づいた当たり判定
            # ------------------------------------------
            player_center_x = player_x + mario_rect.width // 2
            player_feet_y = player_y + mario_rect.height
            grid_x = int(player_center_x // TILE_SIZE)

            if 0 <= grid_x < len(level_data):
                if player_feet_y > MAP_Y and level_data[grid_x] == 1:
                    player_y = MAP_Y - mario_rect.height  # 着地
                    player_y_velocity = 0
                    is_jumping = False

            # 落下（画面の下端を超えた）：ライフを減らして初期位置へ
            if player_y > SCREEN_HEIGHT:
                pygame.mixer.music.play()
                damage_player()

            player_rect = pygame.Rect(player_x, player_y, mario_rect.width, mario_rect.height)
            player_on_ground = player_feet_y >= MAP_Y - 2

            # ------------------------------------------
            # 敵（ウォーカー・エレクトロ）の更新
            # ------------------------------------------
            for enemy in enemies:
                if enemy["type"] == "walker":
                    update_walker(enemy, player_rect, prev_feet_y)
                elif enemy["type"] == "electro":
                    update_electro(enemy, player_rect, prev_feet_y, grid_x, player_on_ground)

            update_projectiles(player_rect)

            # ------------------------------------------
            # ゴール判定
            # ------------------------------------------
            if player_rect.colliderect(goal_rect):
                game_clear = True

            # ------------------------------------------
            # カメラをプレイヤーに追従させる（横スクロール）
            # ------------------------------------------
            camera_x = player_x - SCREEN_WIDTH // 3
            camera_x = max(0, min(camera_x, LEVEL_PIXEL_WIDTH - SCREEN_WIDTH))

        # ==========================================
        # 3. 描画処理
        # ==========================================
        screen.fill(SKY_BLUE)

        # ------------------------------------------
        # マップデータに基づいて地面を描画する（カメラ位置ぶんずらす）
        # ------------------------------------------
        for col, tile in enumerate(level_data):
            if tile == 1:
                draw_x = col * TILE_SIZE - camera_x
                if -TILE_SIZE < draw_x < SCREEN_WIDTH:
                    screen.blit(block_img, (draw_x, MAP_Y))

        # ゴール（旗）を描画
        draw_goal(camera_x)

        # 敵を描画
        draw_enemies(camera_x)

        # 電撃弾を描画
        draw_projectiles(camera_x)

        # プレイヤーを描画（無敵時間中は点滅させる）
        if player_invuln_timer <= 0 or frame_count % 6 < 3:
            screen.blit(mario_img, (player_x - camera_x, player_y))

        # スマホ用の操作ボタンを描画
        draw_touch_buttons(screen, active_buttons)

        # ライフ表示
        life_text = hud_font.render(f"Life: {lives}", True, (255, 255, 255))
        screen.blit(life_text, (10, 10))

        # ゲームオーバー／ゴール表示
        if game_over:
            gameover_text = gameover_font.render("GAME OVER", True, (255, 0, 0))
            text_rect = gameover_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
            screen.blit(gameover_text, text_rect)
            hint_text = hud_font.render("Press R to restart", True, (255, 255, 255))
            hint_rect = hint_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50))
            screen.blit(hint_text, hint_rect)
        elif game_clear:
            clear_text = gameover_font.render("GOAL!", True, (60, 220, 90))
            text_rect = clear_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
            screen.blit(clear_text, text_rect)
            hint_text = hud_font.render("Press R to restart", True, (255, 255, 255))
            hint_rect = hint_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50))
            screen.blit(hint_text, hint_rect)

        # ==========================================
        # 4. 画面の更新
        # ==========================================
        pygame.display.flip()

        # ブラウザ側に制御を返す（pygbagで必須）
        await asyncio.sleep(0)

    pygame.quit()


asyncio.run(main())
