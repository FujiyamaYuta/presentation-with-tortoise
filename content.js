// メッセージリスナーを設定
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  switch (request.action) {
    case 'performAction':
      // サンプルアクション: ページの背景色を変更
      document.body.style.backgroundColor = getRandomColor();
      sendResponse({ 
        message: 'ページの背景色を変更しました',
        success: true 
      });
      break;

    case 'getPageInfo':
      // ページ情報を取得
      const pageInfo = {
        url: window.location.href,
        title: document.title,
        elementCount: document.querySelectorAll('*').length,
        timestamp: new Date().toISOString()
      };
      sendResponse({ 
        pageInfo: pageInfo,
        success: true 
      });
      break;

    default:
      sendResponse({ 
        message: '不明なアクションです',
        success: false 
      });
  }

  // 非同期レスポンスの場合は true を返す
  return true;
});

// ランダムな色を生成する関数
function getRandomColor() {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
    '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ページ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
  console.log('Content script loaded on:', window.location.href);
  
  // ページに小さなインジケーターを追加
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 12px;
    z-index: 10000;
    opacity: 0.8;
  `;
  indicator.textContent = '拡張機能が有効です';
  document.body.appendChild(indicator);
  
  // 3秒後にインジケーターを非表示
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 500);
  }, 3000);
});
