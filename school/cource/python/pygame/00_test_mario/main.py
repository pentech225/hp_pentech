import pygame as pg, sys

pg.init()
screen = pg.display.set_mode((800, 600))
clock = pg.time.Clock() # 時計オブジェクトを作成

# --- 四角形（プレイヤー）の設定 ---
x = 375
y = 500
width = 50
height = 50
speed = 5 # 左右の移動スピード

# --- ジャンプ用の設定 ---
is_jump = False # ジャンプ中かどうかを判定するフラグ
vel_y = 0       # Y軸方向の速度（Velocity）
gravity = 1     # 重力（毎フレーム下向きにかかる力）
jump_power = -15 # ジャンプ力（上向きの初速。Pygameでは上がマイナス）
ground_y = 500  # 地面のY座標

while True:
    # 1. イベント処理（×ボタンで閉じる処理など）
    for event in pg.event.get():
        if event.type == pg.QUIT:
            pg.quit()
            sys.exit()

    # 2. 画面の初期化
    screen.fill(pg.Color("WHITE"))

    # 3. キー入力の取得と移動処理
    key = pg.key.get_pressed()
    
    # 左右の移動
    if key[pg.K_RIGHT]:
        x += speed
    if key[pg.K_LEFT]:
        x -= speed

    # ジャンプの開始（上キーが押され、かつジャンプ中でない時）
    if key[pg.K_UP] and not is_jump:
        is_jump = True
        vel_y = jump_power

    # 4. ジャンプ中（空中）の座標計算
    if is_jump:
        vel_y += gravity # 速度に重力を足す（徐々に下向きになる）
        y += vel_y       # Y座標に速度を足して移動させる
        
        # 地面に着地したかどうかの判定
        if y >= ground_y:
            y = ground_y # 地面にめり込まないように位置を補正
            is_jump = False # ジャンプ状態を解除
            vel_y = 0       # Y方向の速度をリセット

    # 5. 四角形の描画 (画面, 色, (X座標, Y座標, 幅, 高さ))
    pg.draw.rect(screen, pg.Color("BLUE"), (x, y, width, height))

    # 6. 画面の更新とフレームレート設定
    pg.display.update()
    clock.tick(60)