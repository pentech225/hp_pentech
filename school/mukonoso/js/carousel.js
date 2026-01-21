// トップ画像カルーセル用のJavaScript（無限ループ対応）
(function() {
    const carousel = document.getElementById('topImageCarousel');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const originalWrappers = carousel.querySelectorAll('.carousel-image-wrapper');
    const totalImages = originalWrappers.length;
    
    if (totalImages === 0) return;
    
    // 無限ループ用に最初と最後にラッパーのコピーを追加
    const firstWrapperClone = originalWrappers[0].cloneNode(true);
    const lastWrapperClone = originalWrappers[totalImages - 1].cloneNode(true);
    carousel.insertBefore(lastWrapperClone, originalWrappers[0]);
    carousel.appendChild(firstWrapperClone);
    
    // クローンされた要素を取得
    const allWrappers = carousel.querySelectorAll('.carousel-image-wrapper');
    
    // 実際の位置（コピーを含む）
    let currentPosition = 1; // 最初のコピーをスキップして、実際の最初の画像から開始
    let autoSlideInterval = null;
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;
    let startPosition = 0;
    
    function getMoveDistance() {
        const carouselWidth = carousel.offsetWidth;
        const firstWrapper = carousel.querySelector('.carousel-image-wrapper');
        if (!firstWrapper) return carouselWidth;
        const imageWidth = firstWrapper.offsetWidth;
        const gap = 10;
        return imageWidth + gap;
    }
    
    function updateCarousel(withoutTransition = false) {
        const moveDistance = getMoveDistance();
        
        if (withoutTransition) {
            carousel.style.transition = 'none';
        } else {
            carousel.style.transition = 'transform 0.5s ease-in-out';
        }
        
        carousel.style.transform = `translateX(-${currentPosition * moveDistance}px)`;
        
        // 実際のインデックスを計算（コピーを除く）
        let actualIndex = currentPosition - 1;
        if (actualIndex < 0) actualIndex = totalImages - 1;
        if (actualIndex >= totalImages) actualIndex = 0;
        
        // インジケーターを更新
        indicators.forEach((indicator, index) => {
            if (index === actualIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    function nextImage() {
        currentPosition++;
        updateCarousel();
        
        // 最後のコピーに到達したら、アニメーションなしで最初の実際の画像に戻る
        setTimeout(() => {
            if (currentPosition >= totalImages + 1) {
                currentPosition = 1;
                updateCarousel(true);
            }
        }, 500);
    }
    
    function prevImage() {
        currentPosition--;
        updateCarousel();
        
        // 最初のコピーに到達したら、アニメーションなしで最後の実際の画像に戻る
        setTimeout(() => {
            if (currentPosition <= 0) {
                currentPosition = totalImages;
                updateCarousel(true);
            }
        }, 500);
    }
    
    // スワイプ機能（タッチイベント）
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        startPosition = currentPosition;
        isDragging = true;
        carousel.style.transition = 'none';
    }, { passive: true });
    
    carousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diffX = touchStartX - currentX;
        const moveDistance = getMoveDistance();
        const offset = diffX / moveDistance;
        
        carousel.style.transform = `translateX(-${(startPosition + offset) * moveDistance}px)`;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;
        const threshold = 50; // スワイプの最小距離（ピクセル）
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // 右にスワイプ（次の画像）
                nextImage();
            } else {
                // 左にスワイプ（前の画像）
                prevImage();
            }
        } else {
            // スワイプ距離が足りない場合は元の位置に戻す
            updateCarousel();
        }
    }, { passive: true });
    
    // マウスドラッグ機能（デスクトップ対応）
    let mouseStartX = 0;
    let mouseIsDown = false;
    
    // ドラッグ終了処理（どこでマウスボタンを離しても確実に処理）
    function handleMouseUp(e) {
        if (!mouseIsDown) return;
        
        mouseIsDown = false;
        const mouseEndX = e.clientX;
        const diffX = mouseStartX - mouseEndX;
        const threshold = 50;
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                nextImage();
            } else {
                prevImage();
            }
        } else {
            updateCarousel();
        }
    }
    
    carousel.addEventListener('mousedown', (e) => {
        mouseIsDown = true;
        mouseStartX = e.clientX;
        startPosition = currentPosition;
        carousel.style.transition = 'none';
        
        // リンク要素上でない場合のみpreventDefault（リンク要素上ではカルーセルドラッグを優先）
        if (!e.target.closest('.carousel-link')) {
            e.preventDefault();
        }
        
        // ドキュメント全体でmouseupをリッスン（確実に状態をリセット）
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    });
    
    carousel.addEventListener('mousemove', (e) => {
        if (!mouseIsDown) return;
        const currentX = e.clientX;
        const diffX = mouseStartX - currentX;
        const moveDistance = getMoveDistance();
        const offset = diffX / moveDistance;
        
        carousel.style.transform = `translateX(-${(startPosition + offset) * moveDistance}px)`;
    });
    
    carousel.addEventListener('mouseup', handleMouseUp);
    
    carousel.addEventListener('mouseleave', () => {
        if (mouseIsDown) {
            mouseIsDown = false;
            updateCarousel();
        }
    });
    
    // インジケータークリック時の処理
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentPosition = index + 1; // コピーを考慮
            updateCarousel();
        });
    });
    
    // ウィンドウリサイズ時に再計算
    window.addEventListener('resize', () => {
        updateCarousel(true);
    });
    
    // 3秒ごとに自動で次の画像に切り替え
    autoSlideInterval = setInterval(nextImage, 3000);
    
    // ホバー画像があるラッパーにホバー時は自動切り替えを一時停止
    // すべてのラッパー（オリジナルとクローン）にイベントを設定
    allWrappers.forEach(wrapper => {
        const carouselHover = wrapper.querySelector('.carousel-hover');
        if (carouselHover) {
            wrapper.addEventListener('mouseenter', () => {
                if (autoSlideInterval) {
                    clearInterval(autoSlideInterval);
                    autoSlideInterval = null;
                }
            });
            
            wrapper.addEventListener('mouseleave', () => {
                if (!autoSlideInterval) {
                    autoSlideInterval = setInterval(nextImage, 3000);
                }
            });
        }
    });
    
    // カルーセル画像リンクのクリック判定（ドラッグ時は無効化）
    allWrappers.forEach(wrapper => {
        const link = wrapper.querySelector('.carousel-link');
        if (!link) return;
        
        let linkStartX = 0;
        let linkStartY = 0;
        let linkIsDragging = false;
        const dragThreshold = 10; // ドラッグと判定する移動距離（ピクセル）
        
        // タッチデバイス対応
        link.addEventListener('touchstart', (e) => {
            linkStartX = e.touches[0].clientX;
            linkStartY = e.touches[0].clientY;
            linkIsDragging = false;
        }, { passive: true });
        
        link.addEventListener('touchmove', (e) => {
            if (!linkStartX && !linkStartY) return;
            const diffX = Math.abs(e.touches[0].clientX - linkStartX);
            const diffY = Math.abs(e.touches[0].clientY - linkStartY);
            
            // 移動距離が一定以上の場合、ドラッグと判定
            if (diffX > dragThreshold || diffY > dragThreshold) {
                linkIsDragging = true;
            }
        }, { passive: true });
        
        link.addEventListener('touchend', (e) => {
            if (linkIsDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
            linkStartX = 0;
            linkStartY = 0;
            linkIsDragging = false;
        });
        
        // マウス対応
        let linkMouseDown = false;
        
        // ドキュメント全体でmousemoveをリッスン（マウスが要素外に出ても追跡）
        const handleLinkMouseMove = (e) => {
            if (!linkMouseDown || (!linkStartX && !linkStartY)) return;
            const diffX = Math.abs(e.clientX - linkStartX);
            const diffY = Math.abs(e.clientY - linkStartY);
            
            // 移動距離が一定以上の場合、ドラッグと判定（横方向のみ）
            if (diffX > dragThreshold) {
                linkIsDragging = true;
            }
        };
        
        // ドキュメント全体でmouseupをリッスン（確実に状態をリセット）
        const handleLinkMouseUp = (e) => {
            if (!linkMouseDown) return;
            
            // ドラッグが検知された場合、リンクのクリックを無効化
            if (linkIsDragging) {
                // リンクのhrefを一時的に無効化してクリックを防ぐ
                const originalHref = link.getAttribute('href');
                link.style.pointerEvents = 'none';
                setTimeout(() => {
                    link.style.pointerEvents = 'auto';
                    if (originalHref) {
                        link.setAttribute('href', originalHref);
                    }
                }, 100);
            }
            
            linkStartX = 0;
            linkStartY = 0;
            linkIsDragging = false;
            linkMouseDown = false;
            
            // イベントリスナーを削除
            document.removeEventListener('mousemove', handleLinkMouseMove);
            document.removeEventListener('mouseup', handleLinkMouseUp);
        };
        
        link.addEventListener('mousedown', (e) => {
            // カルーセルのドラッグを優先するため、リンクのmousedownではpreventDefaultしない
            linkMouseDown = true;
            linkStartX = e.clientX;
            linkStartY = e.clientY;
            linkIsDragging = false;
            
            // ドキュメント全体でイベントをリッスン
            document.addEventListener('mousemove', handleLinkMouseMove);
            document.addEventListener('mouseup', handleLinkMouseUp, { once: true });
        });
        
        link.addEventListener('click', (e) => {
            if (linkIsDragging) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    });
    
    // 初期表示（最初の実際の画像を表示）
    updateCarousel(true);
})();

