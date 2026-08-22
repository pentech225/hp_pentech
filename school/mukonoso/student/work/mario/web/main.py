import asyncio
import pygame
import sys

pygame.mixer.init()
try:
    pygame.mixer.music.load("sound/まんまみーあ.mp3")
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
# 2. マップ（レベル）データの定義
# ==========================================
# 地面の高さを定義
MAP_Y = SCREEN_HEIGHT - TILE_SIZE

# 画面横幅に必要なブロック数（マスの数）を計算
NUM_TILES_X = SCREEN_WIDTH // TILE_SIZE

# マップデータをリストで作ります
# 1: 地面あり（草ブロック）
# 0: 地面なし（穴）
# [1, 1, 1, 1, ..., 0, 0, ..., 1, 1, 1] のようなリストになります
level_data = [1] * NUM_TILES_X


# ----------------------------------------------------

# ==========================================
# 3. プレイヤーと物理演算の設定
# ==========================================
# プレイヤーの初期位置（少し高い位置から）
player_x = 100
player_y = 200

# 物理演算の変数
player_speed = 5
player_y_velocity = 0
GRAVITY = 0.8
jump_power = -15
is_jumping = False

# フレームレート制御用の時計
clock = pygame.time.Clock()
running = True

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


# メインループ（pygbagでブラウザ上でも動かせるようasyncで実装）
async def main():
    global player_x, player_y, player_y_velocity, is_jumping, running

    # 指ID（またはマウス）ごとにどのボタンを押しているかを記録
    active_touches = {}

    while running:
        clock.tick(60)

        # 1. イベント処理（×ボタン、ジャンプ、タッチ操作）
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            if event.type == pygame.KEYDOWN:
                # 上矢印キーでジャンプ（地面にいるときだけ判定したいが、
                # シンプルにするため、ジャンプフラグだけで判定）
                if event.key == pygame.K_UP and not is_jumping:
                    player_y_velocity = jump_power
                    is_jumping = True

            # スマホのタッチ操作
            elif event.type == pygame.FINGERDOWN:
                pos = (event.x * SCREEN_WIDTH, event.y * SCREEN_HEIGHT)
                btn = button_at(pos)
                if btn:
                    active_touches[event.finger_id] = btn
                    if btn == "jump" and not is_jumping:
                        player_y_velocity = jump_power
                        is_jumping = True

            elif event.type == pygame.FINGERUP:
                active_touches.pop(event.finger_id, None)

            # PCブラウザでの動作確認用（マウスクリックもボタンとして扱う）
            elif event.type == pygame.MOUSEBUTTONDOWN:
                btn = button_at(event.pos)
                if btn:
                    active_touches["mouse"] = btn
                    if btn == "jump" and not is_jumping:
                        player_y_velocity = jump_power
                        is_jumping = True

            elif event.type == pygame.MOUSEBUTTONUP:
                active_touches.pop("mouse", None)

        active_buttons = set(active_touches.values())

        # ==========================================
        # 2. プレイヤーの移動と物理演算
        # ==========================================
        # 左右移動（キーボードとタッチボタンの両方に対応）
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] or "left" in active_buttons:
            player_x -= player_speed
        if keys[pygame.K_RIGHT] or "right" in active_buttons:
            player_x += player_speed

        # 重力の処理
        player_y_velocity += GRAVITY
        player_y += player_y_velocity

        # ------------------------------------------
        # ★重要：マップデータに基づいた当たり判定
        # ------------------------------------------
        # プレイヤーの足元の中心座標を取得
        player_center_x = player_x + mario_rect.width // 2
        player_feet_y = player_y + mario_rect.height

        # プレイヤーの下にあるマップのインデックス（マス目の番号）を計算
        grid_x = player_center_x // TILE_SIZE

        # 画面外（例えば右端）へのはみ出しチェック
        if 0 <= grid_x < len(level_data):
            # プレイヤーが地面の高さ（MAP_Y）を超えそうになり、
            # かつ、その真下のマップデータが「1（地面あり）」の場合のみ
            if player_feet_y > MAP_Y and level_data[grid_x] == 1:
                player_y = MAP_Y - mario_rect.height # 着地
                player_y_velocity = 0
                is_jumping = False

        # もし「0（穴）」の上にいたら、上記の着地処理が行われないため、
        # そのまま重力で落ちていきます。

        # 落下によるゲームオーバー判定（画面の下端を超えたら初期位置に戻す）
        if player_y > SCREEN_HEIGHT:
            player_x = 100
            player_y = 200
            player_y_velocity = 0
            pygame.mixer.music.play()

        # ==========================================
        # 3. 描画処理
        # ==========================================
        screen.fill(SKY_BLUE)

        # ------------------------------------------
        # マップデータに基づいて地面を描画する
        # ------------------------------------------
        # level_dataリストをループして、1の場所だけにblitします
        for col, tile in enumerate(level_data):
            if tile == 1:
                # (マス目の番号 * マスのサイズ, 地面のY座標)
                screen.blit(block_img, (col * TILE_SIZE, MAP_Y))

        # プレイヤーを描画
        screen.blit(mario_img, (player_x, player_y))

        # スマホ用の操作ボタンを描画
        draw_touch_buttons(screen, active_buttons)

        # ==========================================
        # 4. 画面の更新
        # ==========================================
        pygame.display.flip()

        # ブラウザ側に制御を返す（pygbagで必須）
        await asyncio.sleep(0)

    pygame.quit()


asyncio.run(main())
