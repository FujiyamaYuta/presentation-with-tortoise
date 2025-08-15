const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVGファイルのパス
const svgPath = path.join(__dirname, 'icons', 'icon.svg');
const iconsDir = path.join(__dirname, 'icons');

// 生成するアイコンのサイズ
const sizes = [16, 48, 128];

async function convertIcons() {
  try {
    // SVGファイルが存在するかチェック
    if (!fs.existsSync(svgPath)) {
      console.error('SVGファイルが見つかりません:', svgPath);
      return;
    }

    console.log('アイコンの変換を開始します...');

    // 各サイズでPNGを生成
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon${size}.png`);
      
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ icon${size}.png を生成しました`);
    }

    console.log('すべてのアイコンの変換が完了しました！');
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  }
}

// スクリプトを実行
convertIcons();
