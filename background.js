// 拡張機能のインストール時の処理
console.log('=== background.js 読み込み完了 ===');

// バッジ更新用のタイマー
let badgeUpdateTimer = null;

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  // 初期設定を保存
  chrome.storage.local.set({
    extensionEnabled: true,
    installDate: new Date().toISOString(),
    settings: {
      autoRun: false,
      notifications: true
    }
  });
  
  // バッジ更新タイマーを開始
  startBadgeUpdateTimer();
});

// バッジ更新タイマーを開始
function startBadgeUpdateTimer() {
  if (badgeUpdateTimer) {
    clearInterval(badgeUpdateTimer);
  }
  
  badgeUpdateTimer = setInterval(() => {
    updateBadgeFromStorage();
  }, 1000); // 1秒ごとに更新
}

// ストレージから状態を読み取ってバッジを更新
function updateBadgeFromStorage() {
  chrome.storage.local.get(['presentationState'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('ストレージ読み取りエラー:', chrome.runtime.lastError);
      return;
    }
    
    const state = result.presentationState;
    if (state && state.isRunning && !state.isPaused && state.timeRemaining > 0) {
      // 開始時間から経過時間を計算
      const startTime = new Date(state.startTime);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const totalSeconds = state.timeRemaining + elapsedSeconds;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      
      if (remainingSeconds > 0) {
        const minutes = Math.floor(remainingSeconds / 60);
        const badgeText = minutes.toString();
        
        chrome.action.setBadgeText({
          text: badgeText
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('バッジテキスト設定エラー:', chrome.runtime.lastError);
          }
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: '#ff6b35'
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('バッジ背景色設定エラー:', chrome.runtime.lastError);
          }
        });
      } else {
        // 時間切れの場合はバッジをクリア
        chrome.action.setBadgeText({
          text: ''
        });
      }
    } else {
      // プレゼンが実行中でない場合はバッジをクリア
      chrome.action.setBadgeText({
        text: ''
      });
    }
  });
}

// タブが更新された時の処理
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
    
    // 特定のサイトでのみ動作する場合の例
    if (tab.url.includes('google.com')) {
      chrome.tabs.sendMessage(tabId, {
        action: 'pageLoaded',
        url: tab.url
      }).catch(() => {
        // コンテンツスクリプトがまだ読み込まれていない場合のエラーを無視
      });
    }
  }
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  switch (request.action) {
    case 'getSettings':
      chrome.storage.local.get(['settings'], (result) => {
        sendResponse({ settings: result.settings || {} });
      });
      return true; // 非同期レスポンス
      
    case 'updateSettings':
      chrome.storage.local.set({ settings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'showNotification':
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'My Chrome Extension',
        message: request.message || '通知メッセージ'
      });
      sendResponse({ success: true });
      break;
      
    case 'updateBadge':
      console.log('=== updateBadge 処理開始 ===');
      console.log('request.text:', request.text);
      
      if (request.text) {
        console.log('バッジテキストを設定:', request.text);
        chrome.action.setBadgeText({
          text: request.text
        }, () => {
          console.log('バッジテキスト設定完了');
          if (chrome.runtime.lastError) {
            console.error('バッジテキスト設定エラー:', chrome.runtime.lastError);
          }
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: '#ff6b35'
        }, () => {
          console.log('バッジ背景色設定完了');
          if (chrome.runtime.lastError) {
            console.error('バッジ背景色設定エラー:', chrome.runtime.lastError);
          }
        });
      } else {
        console.log('バッジテキストをクリア');
        chrome.action.setBadgeText({
          text: ''
        }, () => {
          console.log('バッジテキストクリア完了');
          if (chrome.runtime.lastError) {
            console.error('バッジテキストクリアエラー:', chrome.runtime.lastError);
          }
        });
      }
      
      console.log('=== updateBadge 処理完了 ===');
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, message: '不明なアクション' });
  }
});

// 拡張機能のアイコンがクリックされた時の処理（ポップアップがない場合）
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
  
  // ポップアップがない場合の代替処理
  // 例: 新しいタブを開く
  // chrome.tabs.create({ url: 'https://example.com' });
});
