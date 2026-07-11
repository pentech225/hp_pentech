import pygame
import asyncio
import random
import math

# --- 画面サイズと定数 ---
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
TARGET_RADIUS = 40
COLOR_BACKGROUND = (20, 20, 30) # 濃い紺色
COLOR_TARGET = (230, 60, 60) # 赤色
COLOR_TEXT = (255, 255, 255) # 白色

# --- ゲームの状態 ---
STATE_START = 0
STATE_PLAYING = 1

# --- グローバル変数 ---
game_state = STATE_START
score = 0
target_x = 0
target_y = 0

def generate_target_position():
    """画面内のランダムな位置にターゲットを配置します（端っこを避けて）"""
    global target_x, target_y
    target_x = random.randint(TARGET_RADIUS + 20, SCREEN_WIDTH - TARGET_RADIUS - 20)
    target_y = random.randint(TARGET_RADIUS + 20, SCREEN_HEIGHT - TARGET_RADIUS - 20)

async def main():
    """メインのゲームループ関数（非同期化）"""
    global game_state, score, target_x, target_y
    
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Tap the Circle!")
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 48) # デフォルトフォント

    # 最初のターゲットの位置を設定
    generate_target_position()
    
    running = True
    while running:
        # --- 描画処理の初期化 ---
        screen.fill(COLOR_BACKGROUND)
        
        # --- イベント処理 ---
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            
            # **スマートフォン/PCのタップ・クリック検知**
            if event.type == pygame.MOUSEBUTTONDOWN or event.type == pygame.FINGERDOWN:
                # タップされた座標を取得（MOUSEBUTTONDOWNはピクセル単位、FINGERDOWNは0-1の正規化座標）
                if event.type == pygame.MOUSEBUTTONDOWN:
                    touch_x, touch_y = event.pos
                else: # event.type == pygame.FINGERDOWN
                    # 正規化座標を画面のピクセル座標に変換
                    touch_x = event.x * SCREEN_WIDTH
                    touch_y = event.y * SCREEN_HEIGHT

                if game_state == STATE_START:
                    # スタート画面でタップされたらゲーム開始
                    game_state = STATE_PLAYING
                    score = 0
                    generate_target_position()
                elif game_state == STATE_PLAYING:
                    # プレイ中にターゲットがタップされたかチェック
                    # ターゲットの中心とタップ位置の距離を計算（三平方の定理）
                    distance = math.sqrt((touch_x - target_x)**2 + (touch_y - target_y)**2)
                    
                    if distance <= TARGET_RADIUS:
                        # タップ成功！
                        score += 1
                        generate_target_position() # ターゲットを再配置
        
        # --- ゲームの状態に応じた描画 ---
        if game_state == STATE_START:
            # スタート画面
            title_text = font.render("Tap the Circle!", True, COLOR_TARGET)
            instruct_text = font.render("Tap to Start!", True, COLOR_TEXT)
            screen.blit(title_text, (SCREEN_WIDTH // 2 - title_text.get_width() // 2, SCREEN_HEIGHT // 2 - 50))
            screen.blit(instruct_text, (SCREEN_WIDTH // 2 - instruct_text.get_width() // 2, SCREEN_HEIGHT // 2 + 30))
            
        elif game_state == STATE_PLAYING:
            # プレイ画面
            # ターゲット（円）を描画
            pygame.draw.circle(screen, COLOR_TARGET, (int(target_x), int(target_y)), TARGET_RADIUS)
            
            # スコアを描画
            score_text = font.render(f"Score: {score}", True, COLOR_TEXT)
            screen.blit(score_text, (20, 20))

        # 必須：ブラウザに制御を渡すためのおまじない
        await asyncio.sleep(0) 
        clock.tick(60) # ターゲットタップゲームなので、高フレームレートを維持
        pygame.display.flip()

    pygame.quit()

# 実行部分
if __name__ == "__main__":
    asyncio.run(main())