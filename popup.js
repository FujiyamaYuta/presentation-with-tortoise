class PresentationTimer {
  constructor() {
    this.slideCount = 10; // デフォルト: 10枚
    this.presentationTime = 5; // デフォルト: 5分
    this.currentSlide = 1;
    this.timeRemaining = 0; // 秒単位
    this.isRunning = false;
    this.isPaused = false;
    this.timerInterval = null;
    this.startTime = null;
    
    this.initializeUI();
    this.loadSettings();
    this.setupEventListeners();
  }

  initializeUI() {
    this.slideCountInput = document.getElementById('slideCount');
    this.presentationTimeInput = document.getElementById('presentationTime');
    this.startButton = document.getElementById('startButton');
    this.resetButton = document.getElementById('resetButton');
    this.pauseButton = document.getElementById('pauseButton');
    this.stopButton = document.getElementById('stopButton');


    this.settingsForm = document.getElementById('settingsForm');
    this.timerDisplay = document.getElementById('timerDisplay');
    this.timeRemainingDisplay = document.getElementById('timeRemaining');
    this.currentSlideDisplay = document.getElementById('currentSlide');
    this.remainingSlidesDisplay = document.getElementById('remainingSlides');
    this.timeProgressBar = document.getElementById('timeProgress');
    this.slideProgressBar = document.getElementById('slideProgress');
    this.statusDiv = document.getElementById('status');
  }

  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('presentationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.slideCount = settings.slideCount || 10;
        this.presentationTime = settings.presentationTime || 5;
      }
      
      // UIに値を設定（保存された設定がない場合はデフォルト値）
      this.slideCountInput.value = this.slideCount;
      this.presentationTimeInput.value = this.presentationTime;
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      // エラー時はデフォルト値を設定
      this.slideCountInput.value = this.slideCount;
      this.presentationTimeInput.value = this.presentationTime;
    }
  }

  loadPresentationState() {
    try {
      console.log('=== loadPresentationState開始 ===');
      const savedState = localStorage.getItem('presentationState');
      console.log('保存された状態:', savedState);
      
      if (savedState) {
        const state = JSON.parse(savedState);
        console.log('解析された状態:', state);
        console.log('state.isRunning:', state.isRunning);
        
        // プレゼンが実行中の場合（時間が0でも復元する）
        if (state.isRunning) {
          console.log('プレゼン状態を復元します');
          this.isRunning = true;
          this.isPaused = state.isPaused || false;
          this.currentSlide = state.currentSlide || 1;
          this.startTime = state.startTime ? new Date(state.startTime) : new Date();
          
          // 開始時間から経過時間を計算して残り時間を更新
          if (this.startTime && !this.isPaused) {
            const now = new Date();
            const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
            const totalSeconds = this.presentationTime * 60;
            this.timeRemaining = Math.max(0, totalSeconds - elapsedSeconds);
            
            console.log('時間計算:', {
              startTime: this.startTime,
              now: now,
              elapsedSeconds: elapsedSeconds,
              totalSeconds: totalSeconds,
              timeRemaining: this.timeRemaining
            });
          } else {
            this.timeRemaining = state.timeRemaining || 0;
          }
          
          console.log('復元された状態:', {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentSlide: this.currentSlide,
            timeRemaining: this.timeRemaining
          });
          
          // UIをタイマー表示に切り替え
          this.showTimerDisplay();
          
          // 一時停止中でない場合はタイマーを再開
          if (!this.isPaused && this.timeRemaining > 0) {
            this.startTimer();
          }
          
          this.updateDisplay();
          this.statusDiv.textContent = this.isPaused ? '一時停止中' : 
            (this.timeRemaining > 0 ? 'プレゼン進行中' : 'プレゼン終了');
          console.log('=== loadPresentationState成功 ===');
          return true; // プレゼン状態が復元された
        } else {
          console.log('state.isRunningがfalseのため復元しません');
        }
      } else {
        console.log('savedStateがnullのため復元しません');
      }
    } catch (error) {
      console.error('プレゼン状態の読み込みに失敗しました:', error);
    }
    console.log('=== loadPresentationState失敗 ===');
    return false; // プレゼン状態が復元されなかった
  }

  showSettingsForm() {
    this.settingsForm.style.display = 'block';
    this.timerDisplay.style.display = 'none';
  }

  showTimerDisplay() {
    this.settingsForm.style.display = 'none';
    this.timerDisplay.style.display = 'block';
    this.pauseButton.textContent = this.isPaused ? '再開' : '一時停止';
  }

  saveSettings() {
    try {
      const settings = {
        slideCount: this.slideCount,
        presentationTime: this.presentationTime,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('presentationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  }

  // savePresentationStateメソッドを削除（startとタイムアップ時のみ保存）

  setupEventListeners() {
    // 入力値の変更を監視
    this.slideCountInput.addEventListener('input', (e) => {
      this.slideCount = parseInt(e.target.value) || 0;
      this.saveSettings();
    });

    this.presentationTimeInput.addEventListener('input', (e) => {
      this.presentationTime = parseInt(e.target.value) || 0;
      this.saveSettings();
    });

    // ボタンイベント
    this.startButton.addEventListener('click', () => {
      console.log('プレゼン開始ボタンがクリックされました');
      this.startPresentation();
    });
    this.resetButton.addEventListener('click', () => this.resetSettings());
    this.pauseButton.addEventListener('click', () => this.togglePause());
    this.stopButton.addEventListener('click', () => this.stopPresentation());
  }

  startPresentation() {
    console.log('=== startPresentation開始 ===');
    console.log('入力値:', { slideCount: this.slideCount, presentationTime: this.presentationTime });
    
    if (this.slideCount <= 0 || this.presentationTime <= 0) {
      this.statusDiv.textContent = 'スライド数とプレゼン時間を入力してください';
      console.log('入力値が不正のため終了');
      return;
    }

    console.log('プレゼンを開始します');
    this.isRunning = true;
    this.isPaused = false;
    this.currentSlide = 1;
    this.timeRemaining = this.presentationTime * 60; // 分を秒に変換
    this.startTime = new Date();

    console.log('状態設定後:', {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentSlide: this.currentSlide,
      timeRemaining: this.timeRemaining
    });

    this.showTimerDisplay();
    this.updateDisplay();
    
    // 直接localStorageに保存
    const state = {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentSlide: this.currentSlide,
      timeRemaining: this.timeRemaining,
      startTime: this.startTime.toISOString(),
      timestamp: new Date().toISOString()
    };
    
    console.log('保存する状態:', state);
    
    try {
      const stateJson = JSON.stringify(state);
      console.log('保存するJSON:', stateJson);
      localStorage.setItem('presentationState', stateJson);
      
      // chrome.storage.localにも保存（background.jsでバッジ更新用）
      chrome.storage.local.set({ presentationState: state }, () => {
        if (chrome.runtime.lastError) {
          console.error('chrome.storage.local保存エラー:', chrome.runtime.lastError);
        } else {
          console.log('chrome.storage.localに保存完了');
        }
      });
      
      // 保存されたか確認
      const savedState = localStorage.getItem('presentationState');
      console.log('実際に保存された状態:', savedState);
      
      if (savedState === stateJson) {
        console.log('プレゼン開始時に正常に保存されました');
      } else {
        console.error('保存に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
    }
    
    this.startTimer();
    this.updateBadge(); // バッジを更新
    
    console.log('プレゼン開始後の状態:', {
      isRunning: this.isRunning,
      timeRemaining: this.timeRemaining,
      currentSlide: this.currentSlide
    });

    this.statusDiv.textContent = 'プレゼンを開始しました';
    console.log('=== startPresentation完了 ===');
  }

  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.timeRemaining--;
        this.updateDisplay();
        this.updateBadge(); // バッジを更新

        if (this.timeRemaining <= 0) {
          this.stopPresentation();
          this.statusDiv.textContent = 'プレゼン時間が終了しました！';
        }
      }
    }, 1000);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseButton.textContent = this.isPaused ? '再開' : '一時停止';
    this.statusDiv.textContent = this.isPaused ? '一時停止中' : '再開しました';
    
    // 一時停止状態を保存
    const state = {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentSlide: this.currentSlide,
      timeRemaining: this.timeRemaining,
      startTime: this.startTime ? (this.startTime instanceof Date ? this.startTime.toISOString() : new Date(this.startTime).toISOString()) : null,
      timestamp: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('presentationState', JSON.stringify(state));
      chrome.storage.local.set({ presentationState: state }, () => {
        if (chrome.runtime.lastError) {
          console.error('一時停止時のchrome.storage.local保存エラー:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.error('一時停止時の保存エラー:', error);
    }
    
    this.updateBadge(); // バッジを更新
  }

  stopPresentation() {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // タイムアップ時に状態を保存
    const state = {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentSlide: this.currentSlide,
      timeRemaining: this.timeRemaining,
      startTime: this.startTime ? (this.startTime instanceof Date ? this.startTime.toISOString() : new Date(this.startTime).toISOString()) : null,
      timestamp: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('presentationState', JSON.stringify(state));
      
      // chrome.storage.localにも保存
      chrome.storage.local.set({ presentationState: state }, () => {
        if (chrome.runtime.lastError) {
          console.error('タイムアップ時のchrome.storage.local保存エラー:', chrome.runtime.lastError);
        } else {
          console.log('タイムアップ時にchrome.storage.localに保存完了');
        }
      });
      
      console.log('タイムアップ時に状態を保存:', state);
    } catch (error) {
      console.error('タイムアップ時の保存エラー:', error);
    }

    this.showSettingsForm();
    this.clearBadge(); // バッジをクリア
    this.statusDiv.textContent = 'プレゼンを停止しました';
  }

  resetSettings() {
    this.slideCount = 10; // デフォルト値にリセット
    this.presentationTime = 5; // デフォルト値にリセット
    this.slideCountInput.value = this.slideCount;
    this.presentationTimeInput.value = this.presentationTime;
    
    localStorage.removeItem('presentationSettings');
    localStorage.removeItem('presentationState');
    this.statusDiv.textContent = '設定をリセットしました';
  }

  updateDisplay() {
    // 時間表示
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timeRemainingDisplay.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // スライド情報
    this.currentSlideDisplay.textContent = this.currentSlide;
    this.remainingSlidesDisplay.textContent = this.slideCount - this.currentSlide;

    // プログレスバー
    const timeProgress = ((this.presentationTime * 60 - this.timeRemaining) / (this.presentationTime * 60)) * 100;
    this.timeProgressBar.style.width = `${Math.min(timeProgress, 100)}%`;

    const slideProgress = ((this.currentSlide - 1) / this.slideCount) * 100;
    this.slideProgressBar.style.width = `${Math.min(slideProgress, 100)}%`;
  }



  // 現在の秒数を設定するメソッド（外部から呼び出し可能）
  setCurrentTime(seconds) {
    if (this.isRunning && seconds >= 0 && seconds <= this.presentationTime * 60) {
      this.timeRemaining = seconds;
      this.updateDisplay();
      this.statusDiv.textContent = `時間を ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')} に設定しました`;
    }
  }

  // スライドを進めるメソッド
  nextSlide() {
    if (this.isRunning && this.currentSlide < this.slideCount) {
      this.currentSlide++;
      this.updateDisplay();
      this.statusDiv.textContent = `スライド ${this.currentSlide} に進みました`;
    }
  }

  // スライドを戻すメソッド
  previousSlide() {
    if (this.isRunning && this.currentSlide > 1) {
      this.currentSlide--;
      this.updateDisplay();
      this.statusDiv.textContent = `スライド ${this.currentSlide} に戻りました`;
    }
  }

  // 初期化時にプレゼン状態をチェック
  initialize() {
    console.log('=== 初期化開始 ===');
    
    // localStorageの内容を確認
    const settings = localStorage.getItem('presentationSettings');
    const state = localStorage.getItem('presentationState');
    
    console.log('localStorage presentationSettings:', settings);
    console.log('localStorage presentationState:', state);
    
    this.loadSettings();
    
    // プレゼン状態を復元
    const stateRestored = this.loadPresentationState();
    console.log('状態復元結果:', stateRestored);
    
    if (!stateRestored) {
      console.log('設定画面を表示');
      this.showSettingsForm();
      this.statusDiv.textContent = '設定を入力してください';
      this.clearBadge(); // バッジをクリア
    } else {
      console.log('タイマー画面を表示');
      this.updateBadge(); // バッジを更新
    }
    
    console.log('=== 初期化完了 ===');
  }

  // バッジを更新するメソッド
  updateBadge() {
    console.log('=== updateBadge 開始 ===');
    console.log('isRunning:', this.isRunning);
    console.log('timeRemaining:', this.timeRemaining);
    
    if (this.isRunning && this.timeRemaining > 0) {
      const minutes = Math.floor(this.timeRemaining / 60);
      const badgeText = minutes.toString();
      
      console.log('バッジテキスト:', badgeText);
      
      chrome.runtime.sendMessage({
        action: 'updateBadge',
        text: badgeText
      }, (response) => {
        console.log('バッジ更新レスポンス:', response);
        if (chrome.runtime.lastError) {
          console.error('バッジ更新エラー:', chrome.runtime.lastError);
        }
      });
    } else {
      console.log('バッジをクリアします');
      this.clearBadge();
    }
    console.log('=== updateBadge 完了 ===');
  }

  // バッジをクリアするメソッド
  clearBadge() {
    console.log('=== clearBadge 開始 ===');
    chrome.runtime.sendMessage({
      action: 'updateBadge',
      text: ''
    }, (response) => {
      console.log('バッジクリアレスポンス:', response);
      if (chrome.runtime.lastError) {
        console.error('バッジクリアエラー:', chrome.runtime.lastError);
      }
    });
    console.log('=== clearBadge 完了 ===');
  }


}

// ページ読み込み時にプレゼンツールを初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM読み込み完了');
  window.presentationTimer = new PresentationTimer();
  window.presentationTimer.initialize();
});

// ポップアップが表示された時の処理
window.addEventListener('focus', () => {
  console.log('ポップアップがフォーカスされました');
});

// ポップアップが閉じられる前の処理
window.addEventListener('beforeunload', () => {
  console.log('ポップアップが閉じられます');
});

// ページの可視性が変わった時の処理
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    console.log('ページが非表示になりました');
  }
});

// ページがアンフォーカスされた時の処理
window.addEventListener('blur', () => {
  console.log('ポップアップがアンフォーカスされました');
});
