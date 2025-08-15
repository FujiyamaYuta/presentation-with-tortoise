// 拡張機能のインストール時の処理
console.log('=== background.js 読み込み完了 ===');

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
});

// presentationStateの変更を監視して即時反映
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (!changes.presentationState) return;

  const newState = changes.presentationState.newValue;
  console.log('Background: storage change detected:', newState);

  if (newState && newState.isRunning) {
    // 走行中: 即バッジ更新し、アラームを確実にセット
    updateBadgeFromStorage();
    chrome.alarms.create('PRESENTATION_TIMER', { periodInMinutes: 1 });
  } else {
    // 停止: バッジクリア＆アラーム解除
    chrome.action.setBadgeText({ text: '' });
    chrome.alarms.clear('PRESENTATION_TIMER');
  }
});

// 起動時に実行中であればアラームをセット
chrome.storage.local.get(['presentationState'], (res) => {
  const state = res.presentationState;
  if (state && state.isRunning) {
    chrome.alarms.create('PRESENTATION_TIMER', { periodInMinutes: 1 });
  }
});

// アラームリスナー（1分ごとにバッジを更新）
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Background: アラーム受信:', alarm.name);
  if (alarm.name === "PRESENTATION_TIMER") {
    console.log('Background: アラーム実行 - バッジ更新');
    updateBadgeFromStorage();
  }
});

// ストレージから状態を読み取ってバッジを更新
function updateBadgeFromStorage() {
  console.log('Background: updateBadgeFromStorage 実行');
  chrome.storage.local.get(['presentationState', 'popupOpen'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('ストレージ読み取りエラー:', chrome.runtime.lastError);
      return;
    }
    
    const state = result.presentationState;
    const popupOpen = Boolean(result.popupOpen);
    console.log('Background: 読み取った状態:', state, 'popupOpen:', popupOpen);

    // 実行中でない、または一時停止、残り0ならクリア
    if (!state || !state.isRunning || state.isPaused || state.timeRemaining <= 0) {
      chrome.action.setBadgeText({ text: '' });
      chrome.alarms.clear('PRESENTATION_TIMER');
      return;
    }

    // popup表示中は干渉しない（更新も減算もしない）
    if (popupOpen) {
      const minutes = Math.floor(state.timeRemaining / 60);
      chrome.action.setBadgeText({ text: minutes.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#ff6b35' });
      return;
    }

    // popupが閉じている時のみ、1分ごとに残り時間を減算し、バッジ更新
    const newRemaining = Math.max(0, state.timeRemaining - 60);
    const minutes = Math.floor(newRemaining / 60);
    chrome.action.setBadgeText({ text: minutes.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#ff6b35' });

    // 状態を保存（timeRemainingを更新）
    const nextState = { ...state, timeRemaining: newRemaining };
    chrome.storage.local.set({ presentationState: nextState });

    // 残り0になったらアラーム停止
    if (newRemaining <= 0) {
      chrome.alarms.clear('PRESENTATION_TIMER');
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
