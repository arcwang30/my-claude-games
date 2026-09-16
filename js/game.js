const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const GROUND_Y = H - 50; // 木の床の位置に合わせてやや下寄りに調整

// ===== 讀取進度追蹤 =====
// 素材を個別ファイル化した(単一HTMLへのbase64埋め込みをやめた)ことで、
// 読み込み完了までに多数のHTTPリクエストが発生するようになった。
// window.Image をラップし、以降に生成される全画像の読み込み状況を自動集計する
// (個々のsprite宣言側には一切手を入れずに済む)。
let assetLoadTotal = 0, assetLoadDone = 0;
const NativeImage = window.Image;
window.Image = function(...args) {
  const img = new NativeImage(...args);
  assetLoadTotal++;
  const markDone = () => { assetLoadDone++; };
  img.addEventListener('load', markDone);
  img.addEventListener('error', markDone); // 読み込み失敗時もローディング画面が固まらないようにする
  return img;
};
window.Image.prototype = NativeImage.prototype;
// 音声も読み込み状況だけ追跡する(表示や将来の用途向け)が、起動をブロックする条件には含めない。
// iOS Safari等のモバイルブラウザはpreload="auto"を指定してもユーザー操作が発生するまで
// 音声の本体データを取得しないため、'canplaythrough'待ちを起動条件に含めると
// 「入力を受け付けない→ユーザー操作が起きない→音声が読み込まれない」という
// 循環待ちに陥り、画面がずっと読み込み中のまま進めなくなってしまう(実際にモバイル実機で発生)。
let audioLoadTotal = 0, audioLoadDone = 0;
const NativeAudio = window.Audio;
window.Audio = function(...args) {
  const audio = new NativeAudio(...args);
  audioLoadTotal++;
  let settled = false;
  const markDone = () => { if (settled) return; settled = true; audioLoadDone++; };
  audio.addEventListener('canplaythrough', markDone, { once: true });
  audio.addEventListener('error', markDone);
  return audio;
};
window.Audio.prototype = NativeAudio.prototype;
function assetsReady() { return assetLoadTotal > 0 && assetLoadDone >= assetLoadTotal; }

// タイトル画面用:アップロードされた参考イラスト(飛び蹴りポーズ)を実際の画像として使用
// 武道場モード専用の背景イラスト(固定画面)
// スタジオ/制作者ロゴ(タイトル画面左上に表示)
const studioLogoImg = new Image();
let studioLogoImgLoaded = false;
studioLogoImg.onload = () => { studioLogoImgLoaded = true; };
studioLogoImg.src = 'images/studioLogoImg.png';
const dojoStageBg = new Image();
let dojoStageBgLoaded = false;
dojoStageBg.onload = () => { dojoStageBgLoaded = true; };
dojoStageBg.src = 'images/dojoStageBg.jpg';
const heroRefImg = new Image();
let heroRefImgLoaded = false;
heroRefImg.onload = () => { heroRefImgLoaded = true; };
heroRefImg.src = 'images/heroRefImg.png';

// 関卡背景:アップロードされた「風月客棧」イラストを実際の背景画像として使用
const bgImg = new Image();
let bgImgLoaded = false;
bgImg.onload = () => { bgImgLoaded = true; };
bgImg.src = 'images/bgImg.png';

// ===== ボスキャラクター(師父)用スプライト(アップロードされたイラストを使用) =====
const bossSprites = {};
const bossSpritesLoaded = {};
bossSpritesLoaded['stand'] = false;
bossSprites['stand'] = new Image();
bossSprites['stand'].onload = () => { bossSpritesLoaded['stand'] = true; };
bossSprites['stand'].src = 'images/bossSprites_stand.png';
bossSpritesLoaded['walk1'] = false;
bossSprites['walk1'] = new Image();
bossSprites['walk1'].onload = () => { bossSpritesLoaded['walk1'] = true; };
bossSprites['walk1'].src = 'images/bossSprites_walk1.png';
bossSpritesLoaded['walk2'] = false;
bossSprites['walk2'] = new Image();
bossSprites['walk2'].onload = () => { bossSpritesLoaded['walk2'] = true; };
bossSprites['walk2'].src = 'images/bossSprites_walk2.png'
bossSpritesLoaded['walk3'] = false;
bossSprites['walk3'] = new Image();
bossSprites['walk3'].onload = () => { bossSpritesLoaded['walk3'] = true; };
bossSprites['walk3'].src = 'images/bossSprites_walk3.png';;
bossSpritesLoaded['punchOut'] = false;
bossSprites['punchOut'] = new Image();
bossSprites['punchOut'].onload = () => { bossSpritesLoaded['punchOut'] = true; };
bossSprites['punchOut'].src = 'images/bossSprites_punchOut.png';
bossSpritesLoaded['punchBack'] = false;
bossSprites['punchBack'] = new Image();
bossSprites['punchBack'].onload = () => { bossSpritesLoaded['punchBack'] = true; };
bossSprites['punchBack'].src = 'images/bossSprites_punchBack.png';;
bossSpritesLoaded['kickOut'] = false;
bossSprites['kickOut'] = new Image();
bossSprites['kickOut'].onload = () => { bossSpritesLoaded['kickOut'] = true; };
bossSprites['kickOut'].src = 'images/bossSprites_kickOut.png';
bossSpritesLoaded['kickBack'] = false;
bossSprites['kickBack'] = new Image();
bossSprites['kickBack'].onload = () => { bossSpritesLoaded['kickBack'] = true; };
bossSprites['kickBack'].src = 'images/bossSprites_kickBack.png';;
bossSpritesLoaded['death'] = false;
bossSprites['death'] = new Image();
bossSprites['death'].onload = () => { bossSpritesLoaded['death'] = true; };
bossSprites['death'].src = 'images/bossSprites_death.png'
bossSpritesLoaded['hit'] = false;
bossSprites['hit'] = new Image();
bossSprites['hit'].onload = () => { bossSpritesLoaded['hit'] = true; };
bossSprites['hit'].src = 'images/bossSprites_hit.png'
bossSpritesLoaded['hold1'] = false;
bossSprites['hold1'] = new Image();
bossSprites['hold1'].onload = () => { bossSpritesLoaded['hold1'] = true; };
bossSprites['hold1'].src = 'images/bossSprites_hold1.png';
bossSpritesLoaded['hold2'] = false;
bossSprites['hold2'] = new Image();
bossSprites['hold2'].onload = () => { bossSpritesLoaded['hold2'] = true; };
bossSprites['hold2'].src = 'images/bossSprites_hold2.png';
bossSpritesLoaded['hold3'] = false;
bossSprites['hold3'] = new Image();
bossSprites['hold3'].onload = () => { bossSpritesLoaded['hold3'] = true; };
bossSprites['hold3'].src = 'images/bossSprites_hold3.png';
bossSpritesLoaded['cast1'] = false;
bossSprites['cast1'] = new Image();
bossSprites['cast1'].onload = () => { bossSpritesLoaded['cast1'] = true; };
bossSprites['cast1'].src = 'images/bossSprites_cast1.png';
bossSpritesLoaded['cast2'] = false;
bossSprites['cast2'] = new Image();
bossSprites['cast2'].onload = () => { bossSpritesLoaded['cast2'] = true; };
bossSprites['cast2'].src = 'images/bossSprites_cast2.png';
bossSpritesLoaded['cast3'] = false;
bossSprites['cast3'] = new Image();
bossSprites['cast3'].onload = () => { bossSpritesLoaded['cast3'] = true; };
bossSprites['cast3'].src = 'images/bossSprites_cast3.png';;;
bossSpritesLoaded['jumpKick'] = false;
bossSprites['jumpKick'] = new Image();
bossSprites['jumpKick'].onload = () => { bossSpritesLoaded['jumpKick'] = true; };
bossSprites['jumpKick'].src = 'images/bossSprites_jumpKick.png';
bossSpritesLoaded['spin'] = false;
bossSprites['spin'] = new Image();
bossSprites['spin'].onload = () => { bossSpritesLoaded['spin'] = true; };
bossSprites['spin'].src = 'images/bossSprites_spin.png';
bossSpritesLoaded['jumpOver'] = false;
bossSprites['jumpOver'] = new Image();
bossSprites['jumpOver'].onload = () => { bossSpritesLoaded['jumpOver'] = true; };
bossSprites['jumpOver'].src = 'images/bossSprites_jumpOver.png';
function allBossSpritesReady() { return Object.values(bossSpritesLoaded).every(v => v); }

// BOSSの新しい必殺技(火球)の飛行体イラスト
const spriteBossFireball = new Image();
let spriteBossFireballLoaded = false;
spriteBossFireball.onload = () => { spriteBossFireballLoaded = true; };
spriteBossFireball.src = 'images/spriteBossFireball.png';


// 残機(ライフ)表示用の主人公アイコン(アップロードされた頭部イラストを使用)
const lifeIconImg = new Image();
let lifeIconImgLoaded = false;
lifeIconImg.onload = () => { lifeIconImgLoaded = true; };
lifeIconImg.src = 'images/lifeIconImg.png';

// 波動拳(チャージ攻撃)用イラスト:溜めポーズ(hado1)・発射ポーズ(hado2)・飛行道具(wave)
const spriteHado1 = new Image();
let spriteHado1Loaded = false;
spriteHado1.onload = () => { spriteHado1Loaded = true; };
spriteHado1.src = 'images/spriteHado1.png';

const spriteHado2 = new Image();
let spriteHado2Loaded = false;
spriteHado2.onload = () => { spriteHado2Loaded = true; };
spriteHado2.src = 'images/spriteHado2.png';

const spriteHadoWave = new Image();
let spriteHadoWaveLoaded = false;
spriteHadoWave.onload = () => { spriteHadoWaveLoaded = true; };
spriteHadoWave.src = 'images/spriteHadoWave.png';

// 波動拳の効果音(実音源):集気中はループ再生、発射時に専用の音を1回再生
const hadoHoldAudio = new Audio('audio/hadoHoldAudio.mp3');
hadoHoldAudio.loop = true;
hadoHoldAudio.preload = 'auto';
hadoHoldAudio.volume = 0.7;
function playHadoHold() {
  if (hadoHoldAudio.paused) {
    hadoHoldAudio.play().catch(() => {});
  }
}
function stopHadoHold() {
  hadoHoldAudio.pause();
  hadoHoldAudio.currentTime = 0;
}

const hadoFlyAudio = new Audio('audio/hadoFlyAudio.mp3');
hadoFlyAudio.loop = false;
hadoFlyAudio.preload = 'auto';
hadoFlyAudio.volume = 0.8;
function playHadoFly() {
  const node = hadoFlyAudio.cloneNode(true);
  node.volume = hadoFlyAudio.volume;
  node.play().catch(() => {});
}

// 主人公が死亡した瞬間の効果音(実音源)
const playerDeadAudio = new Audio('audio/playerDeadAudio.mp3');
playerDeadAudio.loop = false;
playerDeadAudio.preload = 'auto';
playerDeadAudio.volume = 1.0;
function playPlayerDeadSfx() {
  playerDeadAudio.currentTime = 0;
  playerDeadAudio.play().catch(() => {});
}

// BOSS(師父)が倒れた瞬間の効果音(実音源)
const bossDeadAudio = new Audio('audio/bossDeadAudio.mp3');
bossDeadAudio.loop = false;
bossDeadAudio.preload = 'auto';
bossDeadAudio.volume = 1.0;
function playBossDeadSfx() {
  bossDeadAudio.currentTime = 0;
  bossDeadAudio.play().catch(() => {});
}

// 格擋(パリィ)成功時の効果音
const parrySfxAudio = new Audio('audio/parrySfxAudio.mp3');
parrySfxAudio.loop = false;
parrySfxAudio.preload = 'auto';
parrySfxAudio.volume = 0.9;
function playParrySfx() {
  const node = parrySfxAudio.cloneNode(true);
  node.volume = parrySfxAudio.volume;
  node.play().catch(() => {});
}

// タイトル画面で「press any key」を押した瞬間の効果音
const titleConfirmSfxAudio = new Audio('audio/titleConfirmSfxAudio.mp3');
titleConfirmSfxAudio.loop = false;
titleConfirmSfxAudio.preload = 'auto';
titleConfirmSfxAudio.volume = 0.9;
function playTitleConfirmSfx() {
  const node = titleConfirmSfxAudio.cloneNode(true);
  node.volume = titleConfirmSfxAudio.volume;
  node.play().catch(() => {});
}

// メニュー項目の切替(カーソル移動)用の効果音
const menuMoveSfxAudio = new Audio('audio/menuMoveSfxAudio.mp3');
menuMoveSfxAudio.loop = false;
menuMoveSfxAudio.preload = 'auto';
menuMoveSfxAudio.volume = 0.7;
function playMenuMoveSfx() {
  const node = menuMoveSfxAudio.cloneNode(true);
  node.volume = menuMoveSfxAudio.volume;
  node.play().catch(() => {});
}

// BOSSの火球発射時の効果音
const bossFireballSfxAudio = new Audio('audio/bossFireballSfxAudio.mp3');
bossFireballSfxAudio.loop = false;
bossFireballSfxAudio.preload = 'auto';
bossFireballSfxAudio.volume = 0.9;
function playBossFireballSfx() {
  const node = bossFireballSfxAudio.cloneNode(true);
  node.volume = bossFireballSfxAudio.volume;
  node.play().catch(() => {});
}

// 主人公の被弾(ヒットストップ)イラスト
// 主人公の格擋(パリィ)イラスト
// 主人公の格擋(パリィ)構え(出手前/収手中に使う準備ポーズ)
const spriteParryReady = new Image();
let spriteParryReadyLoaded = false;
spriteParryReady.onload = () => { spriteParryReadyLoaded = true; };
spriteParryReady.src = 'images/spriteParryReady.png';
const spriteParry = new Image();
let spriteParryLoaded = false;
spriteParry.onload = () => { spriteParryLoaded = true; };
spriteParry.src = 'images/spriteParry.png';
const spritePlayerHit = new Image();
let spritePlayerHitLoaded = false;
spritePlayerHit.onload = () => { spritePlayerHitLoaded = true; };
spritePlayerHit.src = 'images/spritePlayerHit.png';

// 主人公・雑魚敵(小兵)の死亡イラスト(倒れて伏せたポーズ)
const spritePlayerDead = new Image();
let spritePlayerDeadLoaded = false;
spritePlayerDead.onload = () => { spritePlayerDeadLoaded = true; };
spritePlayerDead.src = 'images/spritePlayerDead.png';

// 小兵の被弾(ヒットストップ)イラスト
const spriteZakoHit = new Image();
let spriteZakoHitLoaded = false;
spriteZakoHit.onload = () => { spriteZakoHitLoaded = true; };
spriteZakoHit.src = 'images/spriteZakoHit.png';

const spriteZakoDead = new Image();
let spriteZakoDeadLoaded = false;
spriteZakoDead.onload = () => { spriteZakoDeadLoaded = true; };
spriteZakoDead.src = 'images/spriteZakoDead.png';

// 雑魚敵(小兵)の3コマ歩行アニメーション(アップロードされたイラストを使用、なめらかにループ)
const zakoWalk1 = new Image();
const zakoWalk2 = new Image();
const zakoWalk3 = new Image();
let zakoWalk1Loaded = false, zakoWalk2Loaded = false, zakoWalk3Loaded = false;
zakoWalk1.onload = () => { zakoWalk1Loaded = true; };
zakoWalk2.onload = () => { zakoWalk2Loaded = true; };
zakoWalk3.onload = () => { zakoWalk3Loaded = true; };
zakoWalk1.src = 'images/zakoWalk1.png';
zakoWalk2.src = 'images/zakoWalk2.png';
zakoWalk3.src = 'images/zakoWalk3.png';
function zakoWalkReady() { return zakoWalk1Loaded && zakoWalk2Loaded && zakoWalk3Loaded; }

// 踢腿型小兵(kicker)専用スプライト:上衣を白、ズボンを紫に配色を変更した歩行3コマ+踢腿攻撃
const kickerWalk1 = new Image();
const kickerWalk2 = new Image();
const kickerWalk3 = new Image();
const kickerAttack = new Image();
let kickerWalk1Loaded = false, kickerWalk2Loaded = false, kickerWalk3Loaded = false, kickerAttackLoaded = false;
kickerWalk1.onload = () => { kickerWalk1Loaded = true; };
kickerWalk2.onload = () => { kickerWalk2Loaded = true; };
kickerWalk3.onload = () => { kickerWalk3Loaded = true; };
kickerAttack.onload = () => { kickerAttackLoaded = true; };
kickerWalk1.src = 'images/kickerWalk1.png';
kickerWalk2.src = 'images/kickerWalk2.png';
kickerWalk3.src = 'images/kickerWalk3.png';
kickerAttack.src = 'images/kickerAttack.png';
function kickerSpritesReady() { return kickerWalk1Loaded && kickerWalk2Loaded && kickerWalk3Loaded && kickerAttackLoaded; }
// 踢腿型小兵(kicker)専用の被弾(ヒットストップ)イラスト
const kickerHit = new Image();
let kickerHitLoaded = false;
kickerHit.onload = () => { kickerHitLoaded = true; };
kickerHit.src = 'images/kickerHit.png'
// 踢腿型小兵(kicker)専用の死亡イラスト
const kickerDead = new Image();
let kickerDeadLoaded = false;
kickerDead.onload = () => { kickerDeadLoaded = true; };
kickerDead.src = 'images/kickerDead.png';;



// 雑魚敵キャラクター用スプライト(アップロードされた少林拳キャラ)
const enemySpriteWalk = new Image();
const enemySpritePunch = new Image();
let enemySpriteWalkLoaded = false, enemySpritePunchLoaded = false;
enemySpriteWalk.onload = () => { enemySpriteWalkLoaded = true; };
enemySpritePunch.onload = () => { enemySpritePunchLoaded = true; };
enemySpriteWalk.src = 'images/enemySpriteWalk.png';
enemySpritePunch.src = 'images/enemySpritePunch.png';
// 前景・背景の植栽オーバーレイ(キャラクターの奥行き表現用)
// bgBushImg: 画面上部寄りの茂み(遠景) -> 背景の一部として先に描画し、常にキャラクターの後方に表示
// fgBushImg: 画面下部寄りの茂み(近景) -> キャラクター描画後に重ねて描画し、キャラクターがその奥を通り抜けるように見せる
const bgBushImg = new Image();
let bgBushImgLoaded = false;
bgBushImg.onload = () => { bgBushImgLoaded = true; };
bgBushImg.src = 'images/bgBushImg.png';

const fgBushImg = new Image();
let fgBushImgLoaded = false;
fgBushImg.onload = () => { fgBushImgLoaded = true; };
fgBushImg.src = 'images/fgBushImg.png';

function drawBackgroundBushes() {
  if (gameMode === 'dojo') return; // 武道場は専用の固定背景を使うため重ねない
  if (!bgBushImgLoaded) return;
  const imgW = bgBushImg.naturalWidth, imgH = bgBushImg.naturalHeight;
  // 元画像の上部(0〜280px相当)の切り出しなので、拡大せず原寸のまま画面上部に配置する
  const dispW = imgW, dispH = imgH;
  let startX = (-camX) % dispW;
  if (startX > 0) startX -= dispW;
  for (let x = startX; x < W; x += dispW) {
    ctx.drawImage(bgBushImg, x, 0, dispW, dispH);
  }
}

function drawForegroundBushes() {
  if (gameMode === 'dojo') return; // 武道場は専用の固定背景を使うため重ねない
  if (!fgBushImgLoaded) return;
  const imgW = fgBushImg.naturalWidth, imgH = fgBushImg.naturalHeight;
  // 元画像の下部(280〜360px相当)の切り出しなので、拡大せず原寸のまま画面下部(H-imgH)に配置する
  const dispW = imgW, dispH = imgH;
  const offsetY = H - dispH;
  let startX = (-camX) % dispW;
  if (startX > 0) startX -= dispW;
  for (let x = startX; x < W; x += dispW) {
    ctx.drawImage(fgBushImg, x, offsetY, dispW, dispH);
  }
}


function enemySpritesReady() {
  return enemySpriteWalkLoaded && enemySpritePunchLoaded;
}

// タイトル画面:新しい主人公イラストとロゴ画像
const titleHeroImg = new Image();
let titleHeroImgLoaded = false;
titleHeroImg.onload = () => { titleHeroImgLoaded = true; };
titleHeroImg.src = 'images/titleHeroImg.png';

// ===== オープニング漫画(ストーリー導入)画像 =====
const storyImgs = [];
const storyImgsLoaded = [];
const storyCaptions = {
  zh: [
    '在熟悉的公園裡，兩人度過了幸福的時光。',
    '某一天，他鼓起勇氣獻上戒指——「請和我結婚吧」',
    '然而幸福並沒有持續太久。黑衣男子們把她強行帶走了！',
    '眼前發生的一切，讓他只能呆呆地愣在原地……',
    '腦海中浮現的，是那個胖男人的臉。「我絕不會放過你！」',
    '懷著滿腔怒火，他騎上機車疾馳而去。目標是深山中的道場。',
    '終於抵達的，是一座被寂靜包圍的古老道場。他要在這裡奪回她。',
  ],
  ja: [
    '慣れ親しんだ公園で、二人は幸せな時間を過ごしていた。',
    'ある日、彼は勇気を振り絞って指輪を差し出した——「結婚してほしい」',
    'しかし、その幸せは長くは続かなかった。黒ずくめの男たちが彼女を無理やり連れ去ってしまった！',
    '目の前で起きたことに、彼はただ呆然と立ち尽くすことしかできなかった……',
    '脳裏に浮かぶのは、あの太った男の顔。「絶対に許さない！」',
    '怒りに満ちた彼は、バイクにまたがり疾走する。目指すは山奥の道場。',
    'ついにたどり着いたのは、静寂に包まれた古い道場だった。彼はここで彼女を取り戻す。',
  ],
  en: [
    'In the familiar park, the two of them shared happy times together.',
    'One day, he mustered the courage to offer a ring — "Will you marry me?"',
    "But happiness didn't last. Men in black forcibly dragged her away!",
    'Stunned by what just happened, all he could do was stand there in a daze...',
    "The fat man's face flashed through his mind. \"I will never forgive you!\"",
    'Consumed by rage, he sped off on his motorcycle, heading for a dojo deep in the mountains.',
    'He finally arrived at an ancient dojo wrapped in silence. Here, he would take her back.',
  ],
};
storyImgsLoaded[0] = false;
storyImgs[0] = new Image();
storyImgs[0].onload = () => { storyImgsLoaded[0] = true; };
storyImgs[0].src = 'images/storyImgs_0.jpg';
storyImgsLoaded[1] = false;
storyImgs[1] = new Image();
storyImgs[1].onload = () => { storyImgsLoaded[1] = true; };
storyImgs[1].src = 'images/storyImgs_1.jpg';
storyImgsLoaded[2] = false;
storyImgs[2] = new Image();
storyImgs[2].onload = () => { storyImgsLoaded[2] = true; };
storyImgs[2].src = 'images/storyImgs_2.jpg';
storyImgsLoaded[3] = false;
storyImgs[3] = new Image();
storyImgs[3].onload = () => { storyImgsLoaded[3] = true; };
storyImgs[3].src = 'images/storyImgs_3.jpg';
storyImgsLoaded[4] = false;
storyImgs[4] = new Image();
storyImgs[4].onload = () => { storyImgsLoaded[4] = true; };
storyImgs[4].src = 'images/storyImgs_4.jpg';
storyImgsLoaded[5] = false;
storyImgs[5] = new Image();
storyImgs[5].onload = () => { storyImgsLoaded[5] = true; };
storyImgs[5].src = 'images/storyImgs_5.jpg';
storyImgsLoaded[6] = false;
storyImgs[6] = new Image();
storyImgs[6].onload = () => { storyImgsLoaded[6] = true; };
storyImgs[6].src = 'images/storyImgs_6.jpg';
function allStoryImgsReady() { return storyImgsLoaded.length === 7 && storyImgsLoaded.every(v => v); }

const titleLogoImg = new Image();
let titleLogoImgLoaded = false;
titleLogoImg.onload = () => { titleLogoImgLoaded = true; };
titleLogoImg.src = 'images/titleLogoImg.png';

// ===== 新主人公スプライトセット(SUNSTRIKE FIST 全アクション) =====
const newSpritesLoaded = {};
const spriteStandIdle = new Image();
newSpritesLoaded['spriteStandIdle'] = false;
spriteStandIdle.onload = () => { newSpritesLoaded['spriteStandIdle'] = true; };
spriteStandIdle.src = 'images/spriteStandIdle.png';
const spriteWalk1 = new Image();
newSpritesLoaded['spriteWalk1'] = false;
spriteWalk1.onload = () => { newSpritesLoaded['spriteWalk1'] = true; };
spriteWalk1.src = 'images/spriteWalk1.png';
const spriteWalk2 = new Image();
newSpritesLoaded['spriteWalk2'] = false;
spriteWalk2.onload = () => { newSpritesLoaded['spriteWalk2'] = true; };
spriteWalk2.src = 'images/spriteWalk2.png';
const spriteWalk3 = new Image();
newSpritesLoaded['spriteWalk3'] = false;
spriteWalk3.onload = () => { newSpritesLoaded['spriteWalk3'] = true; };
spriteWalk3.src = 'images/spriteWalk3.png';
const spritePunchStand = new Image();
newSpritesLoaded['spritePunchStand'] = false;
spritePunchStand.onload = () => { newSpritesLoaded['spritePunchStand'] = true; };
spritePunchStand.src = 'images/spritePunchStand.png';
const spriteKickChamber = new Image();
newSpritesLoaded['spriteKickChamber'] = false;
spriteKickChamber.onload = () => { newSpritesLoaded['spriteKickChamber'] = true; };
spriteKickChamber.src = 'images/spriteKickChamber.png';
const spriteKickOut = new Image();
newSpritesLoaded['spriteKickOut'] = false;
spriteKickOut.onload = () => { newSpritesLoaded['spriteKickOut'] = true; };
spriteKickOut.src = 'images/spriteKickOut.png';
const spriteJumpLift = new Image();
newSpritesLoaded['spriteJumpLift'] = false;
spriteJumpLift.onload = () => { newSpritesLoaded['spriteJumpLift'] = true; };
spriteJumpLift.src = 'images/spriteJumpLift.png';
const spriteJumpPunch = new Image();
newSpritesLoaded['spriteJumpPunch'] = false;
spriteJumpPunch.onload = () => { newSpritesLoaded['spriteJumpPunch'] = true; };
spriteJumpPunch.src = 'images/spriteJumpPunch.png';
const spriteJumpKick = new Image();
newSpritesLoaded['spriteJumpKick'] = false;
spriteJumpKick.onload = () => { newSpritesLoaded['spriteJumpKick'] = true; };
spriteJumpKick.src = 'images/spriteJumpKick.png';
const spriteDuckIdle = new Image();
newSpritesLoaded['spriteDuckIdle'] = false;
spriteDuckIdle.onload = () => { newSpritesLoaded['spriteDuckIdle'] = true; };
spriteDuckIdle.src = 'images/spriteDuckIdle.png';
const spriteDuckPunch = new Image();
newSpritesLoaded['spriteDuckPunch'] = false;
spriteDuckPunch.onload = () => { newSpritesLoaded['spriteDuckPunch'] = true; };
spriteDuckPunch.src = 'images/spriteDuckPunch.png';
const spriteDuckKick = new Image();
newSpritesLoaded['spriteDuckKick'] = false;
spriteDuckKick.onload = () => { newSpritesLoaded['spriteDuckKick'] = true; };
spriteDuckKick.src = 'images/spriteDuckKick.png';
const spriteFlip1 = new Image();
newSpritesLoaded['spriteFlip1'] = false;
spriteFlip1.onload = () => { newSpritesLoaded['spriteFlip1'] = true; };
spriteFlip1.src = 'images/spriteFlip1.png';
const spriteFlip2 = new Image();
newSpritesLoaded['spriteFlip2'] = false;
spriteFlip2.onload = () => { newSpritesLoaded['spriteFlip2'] = true; };
spriteFlip2.src = 'images/spriteFlip2.png';
const spriteFlip3 = new Image();
newSpritesLoaded['spriteFlip3'] = false;
spriteFlip3.onload = () => { newSpritesLoaded['spriteFlip3'] = true; };
spriteFlip3.src = 'images/spriteFlip3.png';
const spriteFlip4 = new Image();
newSpritesLoaded['spriteFlip4'] = false;
spriteFlip4.onload = () => { newSpritesLoaded['spriteFlip4'] = true; };
spriteFlip4.src = 'images/spriteFlip4.png';
const spriteFlip5 = new Image();
newSpritesLoaded['spriteFlip5'] = false;
spriteFlip5.onload = () => { newSpritesLoaded['spriteFlip5'] = true; };
spriteFlip5.src = 'images/spriteFlip5.png';
const spriteFlip6 = new Image();
newSpritesLoaded['spriteFlip6'] = false;
spriteFlip6.onload = () => { newSpritesLoaded['spriteFlip6'] = true; };
spriteFlip6.src = 'images/spriteFlip6.png';
const spriteFlipFrames = [null, spriteFlip1, spriteFlip2, spriteFlip3, spriteFlip4, spriteFlip5, spriteFlip6];

// 各ポーズ素材は別々に描かれたイラストで縦横比・体感サイズにばらつきがあるため、
// 目視確認した上で特に目立つポーズにだけ補正倍率をかけ、キャラクターの見た目の
// 大きさを全アクションで揃える(1.0が基準、値が大きいほど画面上で大きく見える)。
const spriteSizeAdjustMap = new Map([
  [spriteDuckIdle, 0.72],
  [spriteDuckPunch, 0.78],
  [spriteDuckKick, 0.95],
  [spriteJumpKick, 0.9],
  [spriteWalk1, 0.9],
  [spriteWalk2, 0.9],
  [spriteWalk3, 0.9],
  [spritePunchStand, 0.82],
  [spriteHado1, 0.92],
  [spriteHado2, 0.95],
  [spriteParry, 0.9],
]);
// 一部の素材は絵の中の足の位置が微妙にずれており、地面(GROUND_Y)にきちんと
// 接地して見えるよう、描画位置を上下に微調整するための対応表(単位:px、プラスで下へ)。
const spriteYOffsetMap = new Map([
  [spriteDuckKick, 10],
]);
function allNewSpritesReady() {
  return Object.values(newSpritesLoaded).every(v => v);
}

function allPlayerSpritesReady() {
  return allNewSpritesReady();
}

// ヒロイン(女主角)のスプライト:エンディング(BOSS撃破後)で主人公の元へ歩いてくる演出に使用
const girlSprites = {};
const girlSpritesLoaded = {};
['stand','walk1','walk2','walk3'].forEach(k => { girlSpritesLoaded[k] = false; girlSprites[k] = new Image(); girlSprites[k].onload = () => { girlSpritesLoaded[k] = true; }; });
girlSprites['stand'].src = 'images/girlSprites_stand.png';
girlSprites['walk1'].src = 'images/girlSprites_walk1.png';
girlSprites['walk2'].src = 'images/girlSprites_walk2.png';
girlSprites['walk3'].src = 'images/girlSprites_walk3.png';
function girlSpritesReady() { return Object.values(girlSpritesLoaded).every(v => v); }
// エンディングの抱擁イラスト(主人公とヒロインが再会するシーン専用)
const spriteHappyEnding = new Image();
let spriteHappyEndingLoaded = false;
spriteHappyEnding.onload = () => { spriteHappyEndingLoaded = true; };
spriteHappyEnding.src = 'images/spriteHappyEnding.png';




// ================= Audio =================
let actx;
function initAudio() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume().catch(() => {});
}
function beep(freq, dur, type='square', vol=0.15) {
  if (!actx) return;
  const now = actx.currentTime;
  const osc1 = actx.createOscillator();
  const gain1 = actx.createGain();
  osc1.type = type;
  osc1.frequency.value = freq;
  gain1.gain.setValueAtTime(vol, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc1.connect(gain1); gain1.connect(actx.destination);
  osc1.start(now); osc1.stop(now + dur);

  const osc2 = actx.createOscillator();
  const gain2 = actx.createGain();
  osc2.type = type === 'square' ? 'triangle' : type;
  osc2.frequency.value = freq * 1.006;
  gain2.gain.setValueAtTime(vol * 0.5, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc2.connect(gain2); gain2.connect(actx.destination);
  osc2.start(now); osc2.stop(now + dur);
}
// ===== 実録音の効果音(パンチ/キック/ジャンプ/攻撃ヒット/敵の悲鳴) =====
const sfxClips = {
  punch: new Audio('audio/sfxClips_punch.mp3'),
  kick: new Audio('audio/sfxClips_kick.mp3'),
  jump: new Audio('audio/sfxClips_jump.mp3'),
  pong: new Audio('audio/sfxClips_pong.mp3'),
  hurt: new Audio('audio/sfxClips_hurt.mp3'),
};
Object.values(sfxClips).forEach(a => { a.preload = 'auto'; a.volume = 0.85; });
function playSfxClip(name) {
  const base = sfxClips[name];
  if (!base) return;
  // 連続再生(コンボ等)でも音が途切れないよう、再生の度に複製する
  const node = base.cloneNode(true);
  node.volume = base.volume;
  node.play().catch(() => {});
}
const sfx = {
  punch: () => playSfxClip('punch'),
  kick: () => playSfxClip('kick'),
  hit: () => playSfxClip('pong'),
  jump: () => playSfxClip('jump'),
  enemyDown: () => beep(300, 0.2, 'square', 0.2),
  bossHit: () => playSfxClip('pong'),
  gameOver: () => {
    [392, 349, 293, 261, 220, 174, 130].forEach((f,i)=>setTimeout(()=>beep(f,0.24,'triangle',0.22), i*135));
  },
  win: () => { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,0.2,'square',0.2), i*140)); },
  scream: () => playSfxClip('hurt'),
  timeWarning: () => beep(880, 0.12, 'square', 0.22)
};

// ================= 音楽エンジン =================
function createMusicEngine() {
  let playing = false, timeoutId = null, activeNodes = [];
  function playNote(freq, startTime, dur, type, vol) {
    if (!actx) return;
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(startTime); osc.stop(startTime + dur + 0.05);

    const osc2 = actx.createOscillator();
    const gain2 = actx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 1.004;
    gain2.gain.setValueAtTime(0.0001, startTime);
    gain2.gain.linearRampToValueAtTime(vol * 0.4, startTime + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
    osc2.connect(gain2); gain2.connect(actx.destination);
    osc2.start(startTime); osc2.stop(startTime + dur + 0.05);

    const e1 = { osc, gain }, e2 = { osc: osc2, gain: gain2 };
    activeNodes.push(e1, e2);
    osc.onended = () => { activeNodes = activeNodes.filter(n => n !== e1); };
    osc2.onended = () => { activeNodes = activeNodes.filter(n => n !== e2); };
  }
  function stop() {
    playing = false;
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    if (actx) {
      const now = actx.currentTime;
      activeNodes.forEach(({ osc, gain }) => {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0.0001, now + 0.03);
          osc.stop(now + 0.05);
        } catch (e) {}
      });
    }
    activeNodes = [];
  }
  return { playNote, stop, isPlaying: () => playing, setPlaying: v => { playing = v; }, setTimeoutId: id => { timeoutId = id; } };
}
// タイトル画面BGM(実音源、45秒ループ)
const titleThemeAudio = new Audio('audio/titleThemeAudio.mp3');
titleThemeAudio.loop = true;
titleThemeAudio.preload = 'auto';
titleThemeAudio.volume = 0.65;
function playChinaMusic() {
  if (titleThemeAudio.paused) {
    titleThemeAudio.play().catch(() => {});
  }
}
function stopChinaMusic() {
  titleThemeAudio.pause();
  titleThemeAudio.currentTime = 0;
}

// ステージ(プレイ中)BGM(実音源、約64秒ループ)
const gameThemeAudio = new Audio('audio/gameThemeAudio.mp3');
gameThemeAudio.loop = true;
gameThemeAudio.preload = 'auto';
gameThemeAudio.volume = 0.65;
function playGameMusic() {
  if (gameThemeAudio.paused) {
    gameThemeAudio.play().catch(() => {});
  }
}
function stopGameMusic() {
  gameThemeAudio.pause();
  gameThemeAudio.currentTime = 0;
}

// 武道場モード専用BGM(実音源、ループ)
const dojoThemeAudio = new Audio('audio/dojoThemeAudio.mp3');
dojoThemeAudio.loop = true;
dojoThemeAudio.preload = 'auto';
function playDojoMusic() {
  if (dojoThemeAudio.paused) dojoThemeAudio.play().catch(() => {});
}
function stopDojoMusic() {
  dojoThemeAudio.pause();
  dojoThemeAudio.currentTime = 0;
}

// 「了解歷史」画面専用BGM(実音源、ループ)
const historyThemeAudio = new Audio('audio/historyThemeAudio.mp3');
historyThemeAudio.loop = true;
historyThemeAudio.preload = 'auto';
function playHistoryMusic() {
  if (historyThemeAudio.paused) historyThemeAudio.play().catch(() => {});
}
function stopHistoryMusic() {
  historyThemeAudio.pause();
  historyThemeAudio.currentTime = 0;
}

// 漫画(オープニングストーリー)再生中のBGM(実音源、ループ)
const openingThemeAudio = new Audio('audio/openingThemeAudio.mp3');
openingThemeAudio.loop = true;
openingThemeAudio.preload = 'auto';
openingThemeAudio.volume = 0.6;
function playOpeningMusic() {
  if (openingThemeAudio.paused) {
    openingThemeAudio.play().catch(() => {});
  }
}
function stopOpeningMusic() {
  openingThemeAudio.pause();
  openingThemeAudio.currentTime = 0;
}

// 「Kungfu Start」効果音(主人公の入場演出用、1回再生)
const kungfuStartAudio = new Audio('audio/kungfuStartAudio.mp3');
kungfuStartAudio.loop = false;
kungfuStartAudio.preload = 'auto';
kungfuStartAudio.volume = 0.8;

// ボス戦BGM(実音源、約60秒ループ)
const bossThemeAudio = new Audio('audio/bossThemeAudio.mp3');
bossThemeAudio.loop = true;
bossThemeAudio.preload = 'auto';
bossThemeAudio.volume = 0.65;
function playBossMusic() {
  if (bossThemeAudio.paused) {
    bossThemeAudio.play().catch(() => {});
  }
}
function stopBossMusic() {
  bossThemeAudio.pause();
  bossThemeAudio.currentTime = 0;
}

// ステージクリアBGM(実音源、ループ)
const clearThemeAudio = new Audio('audio/clearThemeAudio.mp3');
clearThemeAudio.loop = false;
clearThemeAudio.preload = 'auto';
clearThemeAudio.volume = 0.75;
function playStageClearMusic() {
  if (clearThemeAudio.paused) {
    clearThemeAudio.play().catch(() => {});
  }
}
function stopStageClearMusic() {
  clearThemeAudio.pause();
  clearThemeAudio.currentTime = 0;
}

// エンディング(BOSS撃破後の再会シーン)専用BGM。BOSS撃破の瞬間から抱擁演出が終わるまで再生する
const fxEndingAudio = new Audio('audio/fxEndingAudio.mp3');
fxEndingAudio.loop = true;
fxEndingAudio.preload = 'auto';
fxEndingAudio.volume = 1.0;
function playFxEnding() {
  if (fxEndingAudio.paused) {
    fxEndingAudio.play().catch(() => {});
  }
}
function stopFxEnding() {
  fxEndingAudio.pause();
  fxEndingAudio.currentTime = 0;
}

// GAME OVER画面用BGM(実音源、1回のみ再生・ループしない)
const gameOverThemeAudio = new Audio('audio/gameOverThemeAudio.mp3');
gameOverThemeAudio.loop = false;
gameOverThemeAudio.preload = 'auto';
gameOverThemeAudio.volume = 0.7;
function playGameOverMusic() {
  gameOverThemeAudio.currentTime = 0;
  gameOverThemeAudio.play().catch(() => {});
}
function stopGameOverMusic() {
  gameOverThemeAudio.pause();
  gameOverThemeAudio.currentTime = 0;
}

// CREDIT画面用BGM(ループ再生)
const creditThemeAudio = new Audio('audio/creditThemeAudio.mp3');
creditThemeAudio.loop = true;
creditThemeAudio.preload = 'auto';
function playCreditMusic() {
  creditThemeAudio.currentTime = 0;
  creditThemeAudio.play().catch(() => {});
}
function stopCreditMusic() {
  creditThemeAudio.pause();
  creditThemeAudio.currentTime = 0;
}

// ===== 音量設定(設定メニューの「音樂」「音效」から調整、0~10) =====
let musicVolume = 3, sfxVolume = 3; // 初回起動時のデフォルト値(以降はloadSettings()で上書きされる)
let controlModeOverride = 'auto'; // 'auto' | 'keyboard' | 'gamepad'
let displayScale = 1; // 1 | 2 | 3 (設定メニューの「畫面大小」で変更、canvasのCSS表示サイズを拡大する)
function applyDisplayScale() {
  canvas.style.width = (W * displayScale) + 'px';
  canvas.style.height = (H * displayScale) + 'px';
  // 外枠(gameWrapの装飾フレーム)もcanvasの拡大率に合わせて太さを連動させる
  const gameWrap = document.getElementById('gameWrap');
  if (gameWrap) {
    const frameW = 56 * displayScale;
    gameWrap.style.borderWidth = frameW + 'px';
    gameWrap.style.borderImageWidth = frameW + 'px';
  }
}

const musicAudioBaseVolumes = new Map([
  [titleThemeAudio, 0.55],
  [gameThemeAudio, 0.55],
  [bossThemeAudio, 0.55],
  [clearThemeAudio, 0.6],
  [openingThemeAudio, 0.5],
  [gameOverThemeAudio, 0.55],
  [fxEndingAudio, 0.6],
  [creditThemeAudio, 0.55],
  [dojoThemeAudio, 0.55],
  [historyThemeAudio, 0.55],
]);
function applyMusicVolume() {
  musicAudioBaseVolumes.forEach((base, audio) => { audio.volume = base * (musicVolume/10); });
}
const sfxAudioBaseVolumes = new Map([
  [kungfuStartAudio, 0.8],
  [hadoHoldAudio, 0.7],
  [hadoFlyAudio, 0.8],
  [playerDeadAudio, 1.0],
  [bossDeadAudio, 1.0],
  [parrySfxAudio, 0.9],
  [bossFireballSfxAudio, 0.9],
  [titleConfirmSfxAudio, 0.9],
  [menuMoveSfxAudio, 0.7],
]);
function applySfxVolume() {
  sfxAudioBaseVolumes.forEach((base, audio) => { audio.volume = base * (sfxVolume/10); });
  Object.values(sfxClips).forEach(a => { a.volume = 0.85 * (sfxVolume/10); });
}

// ===== 設定の保存/読み込み(音樂・音效・語言・操作方法をブラウザに記憶させる) =====
const SETTINGS_STORAGE_KEY = 'kungfuFistSettings';
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      musicVolume, sfxVolume, currentLang, controlModeOverride, displayScale, keyBindings, gamepadBindings,
    }));
  } catch (e) { /* localStorageが使えない環境では何もしない */ }
}
// ===== 排行榜(ランキング)の保存/読み込み =====
// ===== Firebase(全球共用ランキング):静的サイトでも全員が同じ排行榜を見られるようにする =====
const firebaseConfig = {
  apiKey: "AIzaSyDZyFTlxH7CSelALHzYjUXxcXEjGFMK2cY",
  authDomain: "dojo-fist.firebaseapp.com",
  projectId: "dojo-fist",
  storageBucket: "dojo-fist.firebasestorage.app",
  messagingSenderId: "341156877262",
  appId: "1:341156877262:web:0823217663168372c5119f",
};
let fbDb = null;
let fbAvailable = false;
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    fbDb = firebase.firestore();
    fbAvailable = true;
  }
} catch (e) { fbAvailable = false; }

const LEADERBOARD_KEY = 'kungfuFistLeaderboard';
const LEADERBOARD_MAX = 50; // 保存件数の上限(1ページ10件 × 5ページ)
const LEADERBOARD_PAGE_SIZE = 10;
let leaderboardData = { easy: [], normal: [], hard: [], dojo: [] }; // 難易度ごと+武道場モード分を個別集計(表示用キャッシュ)
let leaderboardViewDiff = 'easy'; // 現在閲覧中/表示中の難易度タブ
let leaderboardPage = 0; // 現在のページ(0~4、1ページ10件)
let leaderboardLoading = false; // クラウドから取得中かどうか(読み込み中の表示切替用)
let leaderboardInputUnlockTime = 0; // この時刻までは重新挑戰/返回主畫面の操作を受け付けない(誤連打防止)
let gameOverStageClearInputUnlockTime = 0; // GAME OVER/STAGE CLEARジングルの再生が終わるまで操作を受け付けない
function setPostGameInputUnlock(audio) {
  const durMs = (audio && !isNaN(audio.duration) && audio.duration > 0) ? audio.duration * 1000 : 4000;
  gameOverStageClearInputUnlockTime = Date.now() + durMs;
}
let postGameChoiceIndex = 0; // 排行榜閲覧後の選択画面(0:重新挑戰 1:返回主畫面)
function confirmPostGameChoice() {
  if (postGameChoiceIndex === 0) retryFromLeaderboard();
  else {
    gameMode = 'story'; // メニュー背景が武道場モードのまま残らないようにリセット
    state = 'start';
    titleAnimStart = frame;
    playChinaMusic();
  }
}

// オフライン時のフォールバック用ローカルキャッシュ(localStorage)
function loadLeaderboardLocal() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const clean = key => {
      const arr = parsed && Array.isArray(parsed[key]) ? parsed[key] : [];
      return arr.filter(e => e && typeof e.score === 'number').slice(0, LEADERBOARD_MAX);
    };
    if (parsed && !Array.isArray(parsed)) {
      leaderboardData = { easy: clean('easy'), normal: clean('normal'), hard: clean('hard'), dojo: clean('dojo') };
    } else {
      leaderboardData = { easy: [], normal: [], hard: [], dojo: [] };
    }
  } catch (e) { leaderboardData = { easy: [], normal: [], hard: [], dojo: [] }; }
}
function saveLeaderboardLocal() {
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboardData)); } catch (e) { /* 保存できない環境では何もしない */ }
}
function addToLeaderboardLocal(name, score, diff) {
  const key = leaderboardData[diff] ? diff : 'easy';
  const entry = { name: (name || '').trim() || '----', score };
  leaderboardData[key].push(entry);
  leaderboardData[key].sort((a, b) => b.score - a.score);
  leaderboardData[key] = leaderboardData[key].slice(0, LEADERBOARD_MAX);
  saveLeaderboardLocal();
  return leaderboardData[key].indexOf(entry);
}

// 起動時に呼ぶ:通信前にまずローカルの控えを表示しておく(オフライン時の保険)
function loadLeaderboard() {
  loadLeaderboardLocal();
}

// Firestoreから3難易度分すべてを取得してキャッシュする(タブ切替時に毎回通信しないため)
async function fetchLeaderboardFromCloud() {
  if (!fbAvailable) return false;
  try {
    const diffs = ['easy', 'normal', 'hard', 'dojo'];
    // 難易度ごとに専用のコレクションを使うことで、where+orderByの複合索引が不要になり
    // (単純なorderByだけなら索引作成なしで動く)、書き込みは成功するのに表示が
    // 更新されない、という不具合を避ける
    const results = await Promise.all(diffs.map(d =>
      fbDb.collection('scores_' + d).orderBy('score', 'desc').limit(LEADERBOARD_MAX).get()
    ));
    diffs.forEach((d, i) => {
      leaderboardData[d] = results[i].docs.map(doc => {
        const data = doc.data();
        return { name: data.name, score: data.score };
      });
    });
    saveLeaderboardLocal(); // オフライン時用にも控えておく
    return true;
  } catch (e) {
    console.warn('leaderboard fetch failed:', e);
    return false;
  }
}

// スコアをクラウドに登録し、登録後の最新順位(0始まり、見つからなければ-1)を返す。
// 通信に失敗した場合はローカルのみに記録して進行を止めない。
async function addToLeaderboard(name, score, diff) {
  const key = leaderboardData[diff] ? diff : 'easy';
  const cleanName = (name || '').trim() || '----';
  if (fbAvailable) {
    try {
      await fbDb.collection('scores_' + key).add({
        name: cleanName, score,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await fetchLeaderboardFromCloud();
      const idx2 = leaderboardData[key].findIndex(e => e.name === cleanName && e.score === score);
      if (idx2 >= 0) return idx2;
    } catch (e) {
      console.warn('leaderboard submit failed, falling back to local:', e);
    }
  }
  return addToLeaderboardLocal(cleanName, score, key);
}

// GAME OVER/STAGE CLEAR画面を確認後、名前入力画面へ進む
// 現在のキャッシュ済みランキングと比較し、TOP50に入る見込みがあるかどうかを判定する
function qualifiesForLeaderboard(scoreVal, key) {
  const list = leaderboardData[key] || [];
  if (list.length < LEADERBOARD_MAX) return true;
  const lowest = list[list.length - 1];
  return !lowest || scoreVal > lowest.score;
}
function proceedToNameEntry(source) {
  if (source === 'gameover') stopGameOverMusic();
  const lbKey = gameMode === 'dojo' ? 'dojo' : difficulty;
  if (!qualifiesForLeaderboard(score, lbKey)) {
    // TOP50圏外の場合は名前入力を省略し、直接排行榜画面へ進む(最新データを取得し直して確認する)
    leaderboardViewDiff = lbKey;
    leaderboardFromMenu = false;
    leaderboardHighlightIndex = -1;
    leaderboardPage = 0;
    leaderboardLoading = true;
    state = 'leaderboard';
    leaderboardInputUnlockTime = Date.now() + 500;
    fetchLeaderboardFromCloud().finally(() => { leaderboardLoading = false; });
    return;
  }
  state = 'nameEntry';
  nameEntrySource = source;
  nameEntryChars = ['', '', '', ''];
  nameEntryIndex = 0;
}
const NAME_ENTRY_SLOTS = 4;
const NAME_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // ゲームパッドの上下キーで巡回選択する文字セット(A始まり)
// ゲームパッド用:上下キーで現在の枠の文字を巡回選択する(未選択なら'0'から開始)
function cycleNameEntryChar(dir) {
  const cur = nameEntryChars[nameEntryIndex];
  let idx = cur ? NAME_CHARSET.indexOf(cur) : -1;
  idx = (idx + dir + NAME_CHARSET.length) % NAME_CHARSET.length;
  nameEntryChars[nameEntryIndex] = NAME_CHARSET[idx];
  playMenuMoveSfx();
}
// 1つの文字枠を確定して次へ進める:未入力なら「-」で確定する。最後の枠(4文字目)が
// 確定したら、そこで初めて名前を送信する。
function confirmNameEntrySlot() {
  if (!nameEntryChars[nameEntryIndex]) nameEntryChars[nameEntryIndex] = ' ';
  if (nameEntryIndex < NAME_ENTRY_SLOTS - 1) {
    nameEntryIndex++;
    playMenuMoveSfx();
  } else {
    submitNameEntry();
  }
}
// 1つ前の文字枠へ戻る(現在の枠に入力済みならまずそれだけ消し、空欄ならひとつ前の枠へ戻って消す)
function nameEntryStepBack() {
  if (nameEntryChars[nameEntryIndex]) {
    nameEntryChars[nameEntryIndex] = '';
  } else if (nameEntryIndex > 0) {
    nameEntryIndex--;
    nameEntryChars[nameEntryIndex] = '';
  }
  playMenuMoveSfx();
}

async function submitNameEntry() {
  const name = nameEntryChars.join('');
  const lbKey = gameMode === 'dojo' ? 'dojo' : difficulty; // 武道場モードは専用のランキング区分に記録する
  leaderboardViewDiff = lbKey; // 今回プレイしたモード/難易度のタブを表示する
  leaderboardFromMenu = false;
  leaderboardHighlightIndex = -1;
  leaderboardPage = 0;
  leaderboardLoading = true;
  state = 'leaderboard';
  leaderboardInputUnlockTime = Date.now() + 500; // 直後の連打(名前送信からの惰性連打など)で誤って重新挑戰しないよう猶予を設ける
  const idx = await addToLeaderboard(name, score, lbKey);
  leaderboardHighlightIndex = idx;
  if (idx >= 0) leaderboardPage = Math.floor(idx / LEADERBOARD_PAGE_SIZE); // 新記録が載ったページへ自動ジャンプ
  leaderboardLoading = false;
}
// 排行榜のタブ(難易度)をぐるっと切り替える。切り替えたら別難易度のハイライトは意味がないので消す
function leaderboardSwitchTab(dir) {
  const order = ['easy', 'normal', 'hard', 'dojo'];
  const idx = order.indexOf(leaderboardViewDiff);
  leaderboardViewDiff = order[(idx + dir + order.length) % order.length];
  leaderboardHighlightIndex = -1;
  leaderboardPage = 0;
  playMenuMoveSfx();
}
function leaderboardSwitchPage(dir) {
  const totalPages = Math.ceil(LEADERBOARD_MAX / LEADERBOARD_PAGE_SIZE);
  leaderboardPage = (leaderboardPage + dir + totalPages) % totalPages;
  playMenuMoveSfx();
}
// 排行榜画面でEnter(確定/重新遊戲)が押された時の処理
// 排行榜画面で確定/取消操作(Enter/Esc/A/B等)が押された時の処理:
// メニューから開いた場合はメニューへ戻り、ゲーム後の場合は専用の選択画面(重新挑戰/返回主畫面)へ進む
function leaderboardConfirm() {
  if (leaderboardLoading || Date.now() < leaderboardInputUnlockTime) return; // 送信/読み込み中・直後の連打を防ぐ
  if (leaderboardFromMenu) {
    state = 'menu'; menuScreen = 'main'; menuIndex = 0;
  } else {
    postGameChoiceIndex = 0;
    state = 'postGameChoice';
  }
}
function leaderboardBack() {
  leaderboardConfirm();
}
// [重新遊戲]:武道場モードはそのまま再挑戦、劇情模式は難易度選択画面へ
function retryFromLeaderboard() {
  if (gameMode === 'dojo') {
    startDojoMode();
  } else {
    gameMode = 'story';
    state = 'menu'; menuScreen = 'difficulty'; menuIndex = 0;
    playChinaMusic();
  }
}
// GAME OVER画面の選択を確定する:[重新遊戲]は難易度選択へ、[返回主畫面]はタイトルへ
function confirmGameOverChoice() {
  stopGameOverMusic();
  if (gameOverIndex === 0) {
    if (gameMode === 'dojo') {
      startDojoMode(); // 武道場モードは難易度選択がないため、そのまま再挑戦させる
    } else {
      state = 'menu'; menuScreen = 'difficulty'; menuIndex = 0;
      playChinaMusic();
    }
  } else {
    gameMode = 'story'; // メニュー背景が武道場モードのまま残らないようにリセット
    state = 'start'; titleAnimStart = frame; playChinaMusic();
  }
}
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (typeof saved.musicVolume === 'number') musicVolume = Math.max(0, Math.min(10, saved.musicVolume));
    if (typeof saved.sfxVolume === 'number') sfxVolume = Math.max(0, Math.min(10, saved.sfxVolume));
    if (['zh','ja','en'].includes(saved.currentLang)) currentLang = saved.currentLang;
    if (['auto','keyboard','gamepad'].includes(saved.controlModeOverride)) controlModeOverride = saved.controlModeOverride;
    if ([1,2,3].includes(saved.displayScale)) displayScale = saved.displayScale;
    if (saved.keyBindings && typeof saved.keyBindings === 'object') {
      const validCodes = v => typeof v === 'string' && /^[A-Za-z0-9]+$/.test(v);
      const merged = Object.assign({}, DEFAULT_KEY_BINDINGS);
      Object.keys(DEFAULT_KEY_BINDINGS).forEach(k => {
        if (validCodes(saved.keyBindings[k])) merged[k] = saved.keyBindings[k];
      });
      keyBindings = merged;
      rebuildKeyAliasMap();
    }
    if (saved.gamepadBindings && typeof saved.gamepadBindings === 'object') {
      const mergedGp = Object.assign({}, DEFAULT_GAMEPAD_BINDINGS);
      Object.keys(DEFAULT_GAMEPAD_BINDINGS).forEach(k => {
        if (typeof saved.gamepadBindings[k] === 'number' && saved.gamepadBindings[k] >= 0) mergedGp[k] = saved.gamepadBindings[k];
      });
      gamepadBindings = mergedGp;
    }
  } catch (e) { /* 保存データが壊れている等の場合は初期値のまま使う */ }
}

// ================= Input =================
const keys = {};

// キーボード操作の再定義:WASD(移動/ジャンプ/しゃがみ) + J/K(揮拳/踢腿)
// 内部的には従来のArrowUp/Arrow.../KeyZ/KeyXという名前のまま扱うことで、
// 既存のゲームロジック(プレイヤー移動・攻撃判定など)を変更せずに済ませている。
// なお、Arrow系キーはメニュー/PAUSE画面のカーソル操作用として引き続き機能する
// (そちらはkeys{}を介さずe.codeを直接見ているため、ここで無効化してもメニュー操作には影響しない)。
const DEFAULT_KEY_BINDINGS = { left: 'KeyA', right: 'KeyD', jump: 'KeyW', duck: 'KeyS', punch: 'KeyJ', kick: 'KeyK', parry: 'KeyL' };
let keyBindings = Object.assign({}, DEFAULT_KEY_BINDINGS); // 玩家がカスタマイズ可能なキー配置(設定メニューの[控制]で変更・保存)
const DEFAULT_GAMEPAD_BINDINGS = { punch: 2, kick: 0, parry: 3 }; // X, A, Y(標準ゲームパッド配列のボタン番号)
let gamepadBindings = Object.assign({}, DEFAULT_GAMEPAD_BINDINGS); // 玩家がカスタマイズ可能なゲームパッドボタン配置
let awaitingGamepadBind = null; // null | 'punch' | 'kick' | 'parry' (ゲームパッドのボタン再割当て待ち状態)
let prevGamepadBtnSnapshot = []; // ボタン再割当て時に「新たに押されたボタン」を検出するための前フレーム状態
function findConflictingGamepadAction(idx, currentAction) {
  for (const action of ['punch', 'kick', 'parry']) {
    if (action === currentAction) continue;
    if (gamepadBindings[action] === idx) return action;
  }
  return null;
}
let GAMEPLAY_KEY_ALIAS = {};
function rebuildKeyAliasMap() {
  GAMEPLAY_KEY_ALIAS = {
    Space: 'ArrowUp', // SPACEキーは常にジャンプの補助キーとして固定(カスタマイズ対象外)
  };
  GAMEPLAY_KEY_ALIAS[keyBindings.jump] = 'ArrowUp';
  GAMEPLAY_KEY_ALIAS[keyBindings.left] = 'ArrowLeft';
  GAMEPLAY_KEY_ALIAS[keyBindings.duck] = 'ArrowDown';
  GAMEPLAY_KEY_ALIAS[keyBindings.right] = 'ArrowRight';
  GAMEPLAY_KEY_ALIAS[keyBindings.punch] = 'KeyZ';
  GAMEPLAY_KEY_ALIAS[keyBindings.kick] = 'KeyX';
}
rebuildKeyAliasMap();
let awaitingKeyBind = null; // null | 'left' | 'right' | 'jump' | 'duck' | 'punch' | 'kick' | 'parry' (設定[控制]でのキー再割当て待ち状態)
function startKeyCapture(action) {
  awaitingKeyBind = action;
  keyCaptureWarning = null;
}
function startGamepadCapture(action) {
  awaitingGamepadBind = action;
  keyCaptureWarning = null;
  // 選択に使ったボタンがまだ押しっぱなしでも誤検出しないよう、現在の押下状態を基準値にしておく
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = gamepadIndex !== null ? pads[gamepadIndex] : null;
  prevGamepadBtnSnapshot = gp ? Array.from(gp.buttons, b => isGamepadButtonPressed(b)) : [];
}
let keyCaptureWarning = null; // { action, timer } : 重複キー検出時に警告を表示するための状態
const ACTION_LABEL_KEYS = { left: 'bindMove', right: 'bindMove', jump: 'helpJump', duck: 'helpDuck', punch: 'helpPunch', kick: 'helpKick', parry: 'helpParry' };
// codeが既に別のアクションに割り当てられていないか調べる(移動の左右キー自身は互いに除外する)
function findConflictingAction(code, currentAction) {
  const exclude = (currentAction === 'left' || currentAction === 'right') ? ['left', 'right'] : [currentAction];
  for (const action of ['left', 'right', 'jump', 'duck', 'punch', 'kick', 'parry']) {
    if (exclude.includes(action)) continue;
    if (keyBindings[action] === code) return action;
  }
  if (code === 'Space' && currentAction !== 'jump') return 'jump'; // SPACEは常にジャンプ専用の予約キー
  return null;
}
function applyKeyCapture(code) {
  if (!awaitingKeyBind) return;
  const conflict = findConflictingAction(code, awaitingKeyBind);
  if (conflict) {
    keyCaptureWarning = { action: conflict, timer: 100 }; // 割り当てずに警告だけ出し、再入力を待つ
    return;
  }
  keyCaptureWarning = null;
  if (awaitingKeyBind === 'left') {
    keyBindings.left = code;
    rebuildKeyAliasMap();
    saveSettings();
    awaitingKeyBind = 'right'; // 移動キーは左に続けて右も受け付ける
  } else if (awaitingKeyBind === 'right') {
    keyBindings.right = code;
    rebuildKeyAliasMap();
    saveSettings();
    awaitingKeyBind = null;
  } else {
    keyBindings[awaitingKeyBind] = code;
    rebuildKeyAliasMap();
    saveSettings();
    awaitingKeyBind = null;
  }
  updateControlHintText();
}
const OLD_GAMEPLAY_CODES = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyZ', 'KeyX'];

// タイトル/漫画/ゲームオーバー画面などで「決定」操作(Enterキー相当)が
// 押された時の共通処理。キーボードのEnterキーだけでなく、
// ゲームパッドのボタンからも同じ処理を呼び出せるよう関数化してある。
// 格擋(パリィ)を試みる:クールダウン中/死亡中/被弾硬直中でなければ発動する
function tryParry() {
  if (player.dead || player.pendingDeath || player.hitStun > 0) return;
  if (player.parryCooldown > 0) return;
  player.parryTimer = 14; // 格擋の受付+ポーズ表示時間
  player.parryCooldown = 45; // 連発防止のクールダウン
  player.vx = 0;
  if (player.attackType === 'hadoCharge') { stopHadoHold(); player.chargeTimer = 0; player.fullChargeFxDone = false; }
  player.attackType = null;
  player.ducking = false;
}
function handlePrimaryPress(isEnterLike) {
  initAudio();
  if (state === 'start' && !titleConfirming) playChinaMusic();
  if (state === 'stageclear') {
    if (Date.now() < gameOverStageClearInputUnlockTime) return; // ジングル再生中は誤操作を防ぐ
    stopStageClearMusic();
    proceedToNameEntry('stageclear');
    return;
  }
  if (isEnterLike) {
    if (state === 'start' && !titleConfirming) {
      titleConfirming = true;
      stopChinaMusic();
      playTitleConfirmSfx();
      setTimeout(() => {
        state = 'menu';
        menuScreen = 'main';
        menuIndex = 0;
        titleConfirming = false;
      }, 1000);
    } else if (state === 'story') {
      if (storyIndex >= 6) {
        beginStageEntry();
      } else {
        storyIndex++;
        storyFadeIn = 0;
      }
    } else if (state === 'gameover') {
      proceedToNameEntry('gameover');
    }
  }
}

// ===== ゲームメニューの操作ロジック =====
function menuItemCount() {
  if (menuScreen === 'main') return 7;
  if (menuScreen === 'settings') return 5;
  if (menuScreen === 'language') return 3;
  if (menuScreen === 'difficulty') return 3;
  if (menuScreen === 'modeSelect') return 2;
  if (menuScreen === 'controls') return gamepadConnected ? 4 : 7;
  if (menuScreen === 'history') return 3;
  return 0; // help/credits/historyArticle は一覧選択なし
}
function menuMove(dir) {
  const count = menuItemCount();
  if (count <= 0) return;
  menuIndex = (menuIndex + dir + count) % count;
  playMenuMoveSfx();
}
function menuAdjust(dir) {
  playMenuMoveSfx();
  if (menuScreen === 'settings') {
    if (menuIndex === 0) { musicVolume = Math.max(0, Math.min(10, musicVolume + dir)); applyMusicVolume(); saveSettings(); }
    else if (menuIndex === 1) { sfxVolume = Math.max(0, Math.min(10, sfxVolume + dir)); applySfxVolume(); saveSettings(); }
    else if (menuIndex === 2) {
      const modes = ['auto', 'keyboard', 'gamepad'];
      let idx = (modes.indexOf(controlModeOverride) + dir + modes.length) % modes.length;
      controlModeOverride = modes[idx];
      updateGamepadHintUI();
      saveSettings();
    } else if (menuIndex === 3) {
      const scales = [1, 2, 3];
      let idx = (scales.indexOf(displayScale) + dir + scales.length) % scales.length;
      displayScale = scales[idx];
      applyDisplayScale();
      saveSettings();
    }
  } else if (menuScreen === 'main') {
    menuMove(dir); // メイン画面では左右キーも上下と同じ扱いにする
  }
}
function menuConfirm() {
  if (menuScreen === 'main') {
    if (menuIndex === 0) {
      menuScreen = 'modeSelect';
      menuIndex = 0;
    } else if (menuIndex === 1) { menuReturnTo = 'title'; menuScreen = 'settings'; menuIndex = 0; }
    else if (menuIndex === 2) { menuScreen = 'help'; menuIndex = 0; }
    else if (menuIndex === 3) { menuScreen = 'language'; menuIndex = ['zh','ja','en'].indexOf(currentLang); }
    else if (menuIndex === 4) {
      leaderboardFromMenu = true;
      leaderboardHighlightIndex = -1;
      leaderboardPage = 0;
      leaderboardLoading = true;
      state = 'leaderboard';
      fetchLeaderboardFromCloud().finally(() => { leaderboardLoading = false; });
    }
    else if (menuIndex === 5) { menuScreen = 'credits'; menuIndex = 0; playCreditMusic(); }
    else if (menuIndex === 6) { menuScreen = 'history'; menuIndex = 0; historyScroll = 0; playHistoryMusic(); }
  } else if (menuScreen === 'modeSelect') {
    if (menuIndex === 0) {
      // 劇情模式:従来通り難易度選択へ
      gameMode = 'story';
      menuScreen = 'difficulty';
      menuIndex = 0;
    } else {
      // 武道模式:難易度選択・四格漫画を経ずに直接カウントダウンへ
      startDojoMode();
    }
  } else if (menuScreen === 'difficulty') {
    stopChinaMusic(); // 重新遊戲等の経路で流れっぱなしになっていたタイトル曲を確実に止める
    difficulty = ['easy', 'normal', 'hard'][menuIndex] || 'easy';
    state = 'story';
    storyIndex = 0;
    storyFadeIn = 0;
    playOpeningMusic();
  } else if (menuScreen === 'settings') {
    if (menuIndex === 2 || menuIndex === 3) menuAdjust(1); // 操作方法/畫面大小はEnterでも切り替え可能にする
    else if (menuIndex === 4) { menuScreen = 'controls'; menuIndex = 0; }
  } else if (menuScreen === 'controls') {
    const resetIndex = gamepadConnected ? 3 : 6;
    if (menuIndex === resetIndex) {
      // [預設]:キーボード/ゲームパッドの全ボタンをデフォルトへ戻す
      keyBindings = Object.assign({}, DEFAULT_KEY_BINDINGS);
      gamepadBindings = Object.assign({}, DEFAULT_GAMEPAD_BINDINGS);
      rebuildKeyAliasMap();
      saveSettings();
      updateControlHintText();
      keyCaptureWarning = null;
    } else if (gamepadConnected) {
      // ゲームパッド接続中は揮拳/踢腿/格擋ボタンの再割当てのみ表示する
      const gpOrder = ['punch', 'kick', 'parry'];
      startGamepadCapture(gpOrder[menuIndex]);
    } else {
      const order = ['left', 'punch', 'jump', 'kick', 'duck', 'parry'];
      // menuIndex 0 = 移動(left→rightの2キー分を連続で受け付ける)、1~5はそれぞれ単一キー
      startKeyCapture(menuIndex === 0 ? 'left' : order[menuIndex]);
    }
  } else if (menuScreen === 'language') {
    currentLang = ['zh','ja','en'][menuIndex];
    saveSettings();
    updateControlHintText();
    menuScreen = 'main'; menuIndex = 3;
  } else if (menuScreen === 'history') {
    historyArticleIndex = menuIndex;
    historyScroll = 0;
    aboutFanPageFocused = false;
    menuScreen = 'historyArticle';
  } else if (menuScreen === 'help' || menuScreen === 'credits') {
    stopCreditMusic();
    menuScreen = 'main'; menuIndex = 0;
  }
}
function menuBack() {
  if (menuScreen === 'controls') {
    // [控制]画面からは常に[設定]画面へ戻る(そこから先は設定側の戻り先ロジックに任せる)
    menuScreen = 'settings';
    menuIndex = 4;
    return;
  }
  if (menuScreen === 'history') {
    // 記事選択画面から戻る時は、了解歴史専用BGMを止めてメインメニューへ
    stopHistoryMusic();
    menuScreen = 'main';
    menuIndex = 6;
    return;
  }
  if (menuReturnTo === 'paused') {
    // PAUSEメニューの[設定]/[操作説明]から開いた場合は、PAUSEメニューへ直接戻す
    const cameFromHelp = menuScreen === 'help';
    menuReturnTo = 'title';
    state = 'paused';
    pauseScreen = 'main';
    pauseIndex = cameFromHelp ? 2 : 1; // 開いていた項目に合わせておく
    return;
  }
  if (menuScreen === 'main') {
    state = 'start';
    titleAnimStart = frame;
    playChinaMusic();
  } else {
    stopCreditMusic();
    menuScreen = 'main';
    menuIndex = 0;
  }
}

// ===== PAUSE(一時停止)メニューの操作ロジック =====
function enterPause() {
  state = 'paused';
  pauseScreen = 'main';
  pauseIndex = 0;
  pausedMusicRefs = [gameThemeAudio, bossThemeAudio, dojoThemeAudio].filter(a => !a.paused);
  pausedMusicRefs.forEach(a => a.pause());
  stopHadoHold(); // 集気中のループ音がポーズ中も鳴り続けないよう停止(再開後は再度押し直しで鳴る)
  if (player.attackType === 'hadoCharge') { player.attackType = null; player.chargeTimer = 0; player.fullChargeFxDone = false; }
}
function resumeFromPause() {
  state = 'playing';
  pausedMusicRefs.forEach(a => a.play().catch(() => {}));
  pausedMusicRefs = [];
}
function returnToMainMenuFromPause() {
  pausedMusicRefs = [];
  stopGameMusic();
  stopBossMusic();
  stopDojoMusic();
  gameMode = 'story'; // メニュー背景などが武道場モードのまま誤って表示され続けないようリセットする
  hadoukens = [];
  state = 'start';
  titleAnimStart = frame;
  playChinaMusic();
}
function pauseItemCount() {
  if (pauseScreen === 'main') return 4;
  if (pauseScreen === 'confirmReturn') return 2;
  return 0;
}
function pauseMove(dir) {
  const count = pauseItemCount();
  if (count <= 0) return;
  pauseIndex = (pauseIndex + dir + count) % count;
  playMenuMoveSfx();
}
function pauseConfirm() {
  if (pauseScreen === 'main') {
    if (pauseIndex === 0) { resumeFromPause(); }
    else if (pauseIndex === 1) {
      menuReturnTo = 'paused';
      state = 'menu';
      menuScreen = 'settings';
      menuIndex = 0;
    } else if (pauseIndex === 2) {
      menuReturnTo = 'paused';
      state = 'menu';
      menuScreen = 'help';
      menuIndex = 0;
    } else if (pauseIndex === 3) {
      pauseScreen = 'confirmReturn';
      pauseIndex = 1; // デフォルトは「否」を選択しておく(誤操作防止)
    }
  } else if (pauseScreen === 'confirmReturn') {
    if (pauseIndex === 0) returnToMainMenuFromPause();
    else { pauseScreen = 'main'; pauseIndex = 0; }
  }
}
function pauseBack() {
  if (pauseScreen === 'confirmReturn') { pauseScreen = 'main'; pauseIndex = 0; }
  else resumeFromPause();
}

window.addEventListener('keydown', e => {
  if (!assetsReady()) return; // 素材の讀取が完了するまでは入力を一切受け付けない
  if (e.repeat) return; // キー長押しによるOSのオートリピートは無視する(名前入力等への意図しない連続入力を防ぐ)
  if (controlModeOverride === 'auto' && lastInputDevice !== 'keyboard') {
    lastInputDevice = 'keyboard';
    updateGamepadHintUI();
  }
  if (awaitingKeyBind) {
    e.preventDefault();
    if (e.code === 'Escape') { awaitingKeyBind = null; keyCaptureWarning = null; }
    else { applyKeyCapture(e.code); }
    return;
  }
  if (awaitingGamepadBind && e.code === 'Escape') {
    e.preventDefault();
    awaitingGamepadBind = null;
    keyCaptureWarning = null;
    return;
  }
  if ([...Object.keys(GAMEPLAY_KEY_ALIAS), keyBindings.parry, 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  if (GAMEPLAY_KEY_ALIAS[e.code]) {
    keys[GAMEPLAY_KEY_ALIAS[e.code]] = true;
  } else if (!OLD_GAMEPLAY_CODES.includes(e.code)) {
    keys[e.code] = true;
  }
  if (state === 'playing' && (e.code === 'Escape' || e.code === 'KeyP')) {
    initAudio();
    enterPause();
    return;
  }
  if (state === 'playing' && e.code === keyBindings.parry) {
    initAudio();
    tryParry();
    return;
  }
  if (state === 'paused') {
    initAudio();
    if (e.code === 'ArrowUp' || e.code === 'KeyW') pauseMove(-1);
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') pauseMove(1);
    else if (e.code === 'Enter') pauseConfirm();
    else if (e.code === 'Escape' || e.code === 'Backspace' || e.code === 'KeyP') pauseBack();
    return;
  }
  if (state === 'menu') {
    initAudio();
    if (menuScreen === 'historyArticle') {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (historyArticleIndex === 2 && historyScroll <= 0) aboutFanPageFocused = true;
        else { aboutFanPageFocused = false; historyScroll -= 60; }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (aboutFanPageFocused) aboutFanPageFocused = false;
        else historyScroll += 60;
      } else if (e.code === 'Enter') {
        if (aboutFanPageFocused) window.open(FAN_PAGE_URL, '_blank', 'noopener,noreferrer');
        else { menuScreen = 'history'; menuIndex = historyArticleIndex; }
      } else if (e.code === 'Escape' || e.code === 'Backspace') {
        menuScreen = 'history'; menuIndex = historyArticleIndex; aboutFanPageFocused = false;
      }
      return;
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') menuMove(-1);
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') menuMove(1);
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') menuAdjust(-1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') menuAdjust(1);
    else if (e.code === 'Enter') menuConfirm();
    else if (e.code === 'Escape' || e.code === 'Backspace') menuBack();
    return;
  }
  if (state === 'nameEntry') {
    initAudio();
    if (e.code === 'Enter' || e.code === 'Escape') { confirmNameEntrySlot(); return; }
    if (e.code === 'Backspace') { nameEntryStepBack(); return; }
    if (/^Key[A-Z]$/.test(e.code) && nameEntryIndex < 4) {
      nameEntryChars[nameEntryIndex] = e.code.slice(3);
      return;
    }
    if (/^Digit[0-9]$/.test(e.code) && nameEntryIndex < 4) {
      nameEntryChars[nameEntryIndex] = e.code.slice(5);
      return;
    }
    return;
  }
  if (state === 'leaderboard') {
    initAudio();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') leaderboardSwitchTab(-1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') leaderboardSwitchTab(1);
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') leaderboardSwitchPage(-1);
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') leaderboardSwitchPage(1);
    else if (e.code === 'Enter') leaderboardConfirm();
    else if (e.code === 'Escape') leaderboardBack();
    return;
  }
  if (state === 'gameover') {
    initAudio();
    if (Date.now() < gameOverStageClearInputUnlockTime) return; // ジングル再生中は誤操作を防ぐ
    proceedToNameEntry('gameover');
    return;
  }
  if (state === 'postGameChoice') {
    initAudio();
    if (['ArrowUp','KeyW','ArrowDown','KeyS'].includes(e.code)) {
      postGameChoiceIndex = 1 - postGameChoiceIndex;
      playMenuMoveSfx();
    } else if (e.code === 'Enter') {
      confirmPostGameChoice();
    }
    return;
  }
  handlePrimaryPress(state === 'start' || e.code === 'Enter');
});
window.addEventListener('keyup', e => {
  if (GAMEPLAY_KEY_ALIAS[e.code]) keys[GAMEPLAY_KEY_ALIAS[e.code]] = false;
  else if (!OLD_GAMEPLAY_CODES.includes(e.code)) keys[e.code] = false;
});
canvas.addEventListener('click', e => {
  if (state === 'menu' && menuScreen === 'historyArticle' && historyArticleIndex === 2 && aboutFanPageBtn) {
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (canvas.width / r.width);
    const cy = (e.clientY - r.top) * (canvas.height / r.height);
    const b = aboutFanPageBtn;
    if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
      window.open(FAN_PAGE_URL, '_blank', 'noopener,noreferrer');
      return;
    }
  }
  if (!assetsReady()) return; initAudio(); if (state === 'start' && !titleConfirming) playChinaMusic();
});
function tryAutoStartMusic() {
  if (!assetsReady()) { setTimeout(tryAutoStartMusic, 200); return; } // 讀取完了まで再試行し続ける
  initAudio();
  const go = () => { if (state === 'start' && !titleConfirming) playChinaMusic(); };
  if (actx.state === 'suspended') actx.resume().then(go).catch(() => {});
  else go();
}
window.addEventListener('load', tryAutoStartMusic);

// ================= ゲームパッド(コントローラー)対応 =================
// XBOXコントローラー等、ブラウザの標準Gamepad APIに対応した機器を自動検出して操作可能にする。
// ボタン配置: 方向鍵(D-Pad)/左スティック=移動、X=揮拳、A=踢腿、B/Y=予備ボタン、Start=決定/開始
let gamepadIndex = null;
let gamepadConnected = false;
let lastInputDevice = 'keyboard'; // 'auto'設定時、実際に最後に使われた入力機器を反映するための追跡

function updateGamepadHintUI() {
  const kb = document.getElementById('hintKeyboard');
  const gp = document.getElementById('hintGamepad');
  if (!kb || !gp) return;
  const showGamepad = controlModeOverride === 'gamepad' ? true
    : controlModeOverride === 'keyboard' ? false
    : (gamepadConnected && lastInputDevice === 'gamepad');
  kb.style.display = showGamepad ? 'none' : '';
  gp.style.display = showGamepad ? '' : 'none';
}

// 下部の操作説明バー(キーボード版/コントローラー版)の文言を、現在の言語設定に合わせて書き換える
function updateControlHintText() {
  const kb = document.getElementById('hintKeyboard');
  const gp = document.getElementById('hintGamepad');
  if (!kb || !gp) return;
  const L = c => keyLabelDisplay(c);
  kb.innerHTML =
    '<span class="key">' + L(keyBindings.left) + '</span><span class="key">' + L(keyBindings.right) + '</span> ' + t('hintMove') + '　' +
    '<span class="key">' + L(keyBindings.jump) + '</span>/<span class="key">SPACE</span> ' + t('hintJump') + '　' +
    '<span class="key">' + L(keyBindings.duck) + '</span> ' + t('hintDuck') + '　' +
    '<span class="key">' + L(keyBindings.punch) + '</span> ' + t('hintPunch') + '　' +
    '<span class="key">' + L(keyBindings.kick) + '</span> ' + t('hintKick') + '　' +
    '<span class="key">' + L(keyBindings.parry) + '</span> ' + t('hintParry') + '　' +
    '<span class="key">Esc</span>/<span class="key">P</span> ' + t('hintPause');
  gp.innerHTML =
    '🎮 <span class="key">' + t('hintStick') + '</span> ' + t('hintMove') + '　' +
    '<span class="key">' + gamepadBtnLabel('punch') + '</span> ' + t('hintPunch') + '　' +
    '<span class="key">' + gamepadBtnLabel('kick') + '</span> ' + t('hintKick') + '　' +
    '<span class="key">' + gamepadBtnLabel('parry') + '</span> ' + t('hintParry') + '　' +
    '<span class="key">' + (gamepadIsPlayStation ? 'OPTIONS' : 'Start') + '</span> ' + t('hintPause');
}

// PS4/PS5のDualShock/DualSenseコントローラーを識別し、ボタン表記を✕○□△に切り替えるための判定
let gamepadIsPlayStation = false;
function detectPlayStationController(id) {
  if (!id) return false;
  const s = id.toLowerCase();
  return s.includes('054c') || s.includes('dualsense') || s.includes('dualshock') ||
    s.includes('playstation') || s.includes('sony') || s.includes('wireless controller');
}
window.addEventListener('gamepadconnected', e => {
  gamepadIndex = e.gamepad.index;
  gamepadConnected = true;
  gamepadConfirmHeld = false;
  gamepadIsPlayStation = detectPlayStationController(e.gamepad.id);
  updateGamepadHintUI();
  updateControlHintText();
});
window.addEventListener('gamepaddisconnected', e => {
  if (gamepadIndex === e.gamepad.index) {
    gamepadIndex = null;
    gamepadConnected = false;
    gamepadConfirmHeld = false;
    updateGamepadHintUI();
  }
});

const GAMEPAD_CONFIRM_BUTTONS = [0, 1, 2, 3, 9]; // A, B, X, Y, Start
const GAMEPAD_DEADZONE = 0.35;
let gamepadConfirmHeld = false; // 決定ボタン群(A/B/X/Y/Start)のいずれかが押されているか(まとめて1つの状態として管理)
let prevPollState = null; // 前フレームのstateを記録し、他画面→タイトル復帰の瞬間を検出するため
let prevDpadMenu = { up: false, down: false, left: false, right: false }; // メニュー操作用の方向キーedge検出
let prevMenuConfirm = false, prevMenuBack = false; // メニュー操作用の確定/戻るボタンedge検出
let prevStartBtn = false; // プレイ中のポーズ切り替え(Startボタン)用edge検出
let prevParryBtn = false; // プレイ中の格擋(Yボタン)用edge検出

// 画面上の「決定キー」表示を、キーボード/ゲームパッドの接続状況(または手動設定)に応じて切り替える
function confirmKeyLabel() {
  const useGamepad = controlModeOverride === 'gamepad' ? true
    : controlModeOverride === 'keyboard' ? false
    : gamepadConnected;
  return useGamepad ? 'A/Start' : t('enterLabel');
}

// ブラウザ/コントローラーによっては .pressed が正しく反映されないことがあるため、
// アナログ値(.value)もあわせて確認し、押下判定を取りこぼさないようにする。
function isGamepadButtonPressed(btn) {
  if (!btn) return false;
  if (btn.pressed) return true;
  return typeof btn.value === 'number' && btn.value > 0.5;
}

function pollGamepad() {
  if (gamepadIndex === null) return;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads[gamepadIndex];
  if (!gp) return;

  initAudio();

  // 'auto'設定時、実際にボタン/スティックが操作されたらゲームパッド表示へ切り替える
  if (controlModeOverride === 'auto' && lastInputDevice !== 'gamepad') {
    const anyBtn = gp.buttons.some(b => isGamepadButtonPressed(b));
    const anyAxis = gp.axes.some(a => Math.abs(a) > 0.35);
    if (anyBtn || anyAxis) {
      lastInputDevice = 'gamepad';
      updateGamepadHintUI();
    }
  }

  // 設定[控制]でゲームパッドのボタンを再割当て中は、新しく押されたボタンを検出して確定させる
  if (awaitingGamepadBind) {
    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = isGamepadButtonPressed(gp.buttons[i]);
      if (pressed && !prevGamepadBtnSnapshot[i]) {
        if (RESERVED_GAMEPAD_BUTTONS.includes(i)) {
          keyCaptureWarning = { reserved: true, timer: 100 };
        } else {
          const conflict = findConflictingGamepadAction(i, awaitingGamepadBind);
          if (conflict) {
            keyCaptureWarning = { action: conflict, timer: 100 };
          } else {
            gamepadBindings[awaitingGamepadBind] = i;
            saveSettings();
            updateControlHintText();
            keyCaptureWarning = null;
            awaitingGamepadBind = null; // 成功した時だけキャプチャを終了する
          }
        }
        break;
      }
    }
    prevGamepadBtnSnapshot = Array.from(gp.buttons, b => isGamepadButtonPressed(b));
    // メニューの確定/取消ボタンの押下状態もここで同期しておかないと、キャプチャ終了直後に
    // 「押しっぱなしだったBボタン」が新規押下と誤検出され、[控制]画面から誤って戻されてしまう
    prevMenuConfirm = isGamepadButtonPressed(gp.buttons[0]);
    prevMenuBack = isGamepadButtonPressed(gp.buttons[1]);
    return;
  }
  prevGamepadBtnSnapshot = Array.from(gp.buttons, b => isGamepadButtonPressed(b));

  if (state === 'start' && prevPollState !== 'start') {
    // メニュー等の他画面からタイトルへ戻った直後は、その場面遷移に使ったボタンが
    // まだ物理的に押しっぱなしの可能性があるため、「press any key」が誤って
    // 再発火しないよう一旦「既に押されている」ものとして扱う(離して押し直すまで無反応にする)
    gamepadConfirmHeld = true;
  }
  prevPollState = state;

  const axLX = gp.axes[0] || 0;
  const axLY = gp.axes[1] || 0;
  const dpadLeft  = isGamepadButtonPressed(gp.buttons[14]);
  const dpadRight = isGamepadButtonPressed(gp.buttons[15]);
  const dpadUp    = isGamepadButtonPressed(gp.buttons[12]);
  const dpadDown  = isGamepadButtonPressed(gp.buttons[13]);

  keys['ArrowLeft']  = dpadLeft  || axLX < -GAMEPAD_DEADZONE;
  keys['ArrowRight'] = dpadRight || axLX >  GAMEPAD_DEADZONE;
  keys['ArrowUp']    = dpadUp    || axLY < -GAMEPAD_DEADZONE;
  keys['ArrowDown']  = dpadDown  || axLY >  GAMEPAD_DEADZONE;

  const btnA = isGamepadButtonPressed(gp.buttons[0]); // メニュー確定用(固定、カスタマイズ対象外)
  const btnB = isGamepadButtonPressed(gp.buttons[1]); // メニュー取消用(固定、カスタマイズ対象外)
  const btnPunch = isGamepadButtonPressed(gp.buttons[gamepadBindings.punch]);
  const btnKick = isGamepadButtonPressed(gp.buttons[gamepadBindings.kick]);
  const btnParryBtn = isGamepadButtonPressed(gp.buttons[gamepadBindings.parry]);
  keys['KeyZ'] = btnPunch;
  keys['KeyX'] = btnKick;

  // メニュー操作は方向キーだけでなく左アナログスティックの傾きにも対応させる
  const navUp    = dpadUp    || axLY < -GAMEPAD_DEADZONE;
  const navDown  = dpadDown  || axLY >  GAMEPAD_DEADZONE;
  const navLeft  = dpadLeft  || axLX < -GAMEPAD_DEADZONE;
  const navRight = dpadRight || axLX >  GAMEPAD_DEADZONE;

  if (state === 'menu') {
    initAudio();
    if (menuScreen === 'historyArticle') {
      if (navUp && !prevDpadMenu.up) {
        if (historyArticleIndex === 2 && historyScroll <= 0) aboutFanPageFocused = true;
        else { aboutFanPageFocused = false; historyScroll -= 60; }
      }
      if (navDown && !prevDpadMenu.down) {
        if (aboutFanPageFocused) aboutFanPageFocused = false;
        else historyScroll += 60;
      }
      prevDpadMenu = { up: navUp, down: navDown, left: navLeft, right: navRight };
      if (btnA && !prevMenuConfirm) {
        if (aboutFanPageFocused) window.open(FAN_PAGE_URL, '_blank', 'noopener,noreferrer');
        else { menuScreen = 'history'; menuIndex = historyArticleIndex; }
      } else if (btnB && !prevMenuBack) {
        menuScreen = 'history'; menuIndex = historyArticleIndex; aboutFanPageFocused = false;
      }
      prevMenuConfirm = btnA; prevMenuBack = btnB;
      return;
    }
    // メニュー中は方向キー/スティック/ボタンを1回の入力ごとに1ステップだけ反応させる(edge検出)
    if (navUp && !prevDpadMenu.up) menuMove(-1);
    if (navDown && !prevDpadMenu.down) menuMove(1);
    if (navLeft && !prevDpadMenu.left) menuAdjust(-1);
    if (navRight && !prevDpadMenu.right) menuAdjust(1);
    prevDpadMenu = { up: navUp, down: navDown, left: navLeft, right: navRight };
    // メニュー操作: [確認]=A、[取消]=B
    if (btnA && !prevMenuConfirm) menuConfirm();
    prevMenuConfirm = btnA;
    if (btnB && !prevMenuBack) menuBack();
    prevMenuBack = btnB;
    return;
  }

  if (state === 'paused') {
    initAudio();
    if (navUp && !prevDpadMenu.up) pauseMove(-1);
    if (navDown && !prevDpadMenu.down) pauseMove(1);
    prevDpadMenu = { up: navUp, down: navDown, left: navLeft, right: navRight };
    // メニュー操作: [確認]=A、[取消]=B
    if (btnA && !prevMenuConfirm) pauseConfirm();
    prevMenuConfirm = btnA;
    if (btnB && !prevMenuBack) pauseBack();
    prevMenuBack = btnB;
    return;
  }

  if (state === 'nameEntry' || state === 'leaderboard') {
    initAudio();
    if (state === 'leaderboard') {
      if (navLeft && !prevDpadMenu.left) leaderboardSwitchTab(-1);
      if (navRight && !prevDpadMenu.right) leaderboardSwitchTab(1);
      if (navUp && !prevDpadMenu.up) leaderboardSwitchPage(-1);
      if (navDown && !prevDpadMenu.down) leaderboardSwitchPage(1);
      prevDpadMenu = { up: navUp, down: navDown, left: navLeft, right: navRight };
    } else if (state === 'nameEntry') {
      // ゲームパッドでは上下キー/スティックで文字を切り替えて選ぶ(0-9→A-Zの順に循環)
      if (navUp && !prevDpadMenu.up) cycleNameEntryChar(1);
      if (navDown && !prevDpadMenu.down) cycleNameEntryChar(-1);
      prevDpadMenu = { up: navUp, down: navDown, left: navLeft, right: navRight };
    }
    // ゲームパッドはAボタンで確定/次へ、Bボタンで一つ戻る
    if (btnA && !prevMenuConfirm) { if (state === 'nameEntry') confirmNameEntrySlot(); else leaderboardConfirm(); }
    prevMenuConfirm = btnA;
    if (btnB && !prevMenuBack) { if (state === 'nameEntry') nameEntryStepBack(); else leaderboardBack(); }
    prevMenuBack = btnB;
    return;
  }

  if (state === 'gameover') {
    initAudio();
    if (btnA && !prevMenuConfirm && Date.now() >= gameOverStageClearInputUnlockTime) proceedToNameEntry('gameover');
    prevMenuConfirm = btnA;
    return;
  }
  if (state === 'postGameChoice') {
    initAudio();
    if (navUp && !prevDpadMenu.up) { postGameChoiceIndex = 1 - postGameChoiceIndex; playMenuMoveSfx(); }
    if (navDown && !prevDpadMenu.down) { postGameChoiceIndex = 1 - postGameChoiceIndex; playMenuMoveSfx(); }
    prevDpadMenu = { up: navUp, down: navDown, left: navLeft, right: navRight };
    if (btnA && !prevMenuConfirm) confirmPostGameChoice();
    prevMenuConfirm = btnA;
    return;
  }

  // プレイ中はStartボタンでポーズを開閉する(edge検出)
  const startBtnPressed = isGamepadButtonPressed(gp.buttons[9]);
  if (state === 'playing' && startBtnPressed && !prevStartBtn) {
    enterPause();
  }
  prevStartBtn = startBtnPressed;

  // プレイ中はパリィ用に割り当てられたボタンで格擋(パリィ)を発動する(edge検出)
  if (state === 'playing' && btnParryBtn && !prevParryBtn) {
    tryParry();
  }
  prevParryBtn = btnParryBtn;

  // 決定操作(A/B/X/Y/Start)はボタンごとに個別追跡せず、
  // 「どれか1つでも押されているか」という単一の状態としてまとめて立ち上がりを検出する。
  // (個別ボタンごとの追跡だと、複数ボタンを使い分けた際に一部の環境で
  //  押下判定を取りこぼすことがあったための対策)
  const anyConfirmPressed = GAMEPAD_CONFIRM_BUTTONS.some(i => isGamepadButtonPressed(gp.buttons[i]));
  if (anyConfirmPressed && !gamepadConfirmHeld) {
    handlePrimaryPress(true);
  }
  gamepadConfirmHeld = anyConfirmPressed;
}
['pointerdown','touchstart','mousemove','wheel'].forEach(evt => {
  window.addEventListener(evt, tryAutoStartMusic, { once: true, passive: true });
});

// ================= Palette(彩色動漫・賽璐璐風) =================
const PAL = {
  skin: '#ffcf9e',
  skinShade: '#e8b47e',
  gi: '#8a9f5e',
  giShade: '#6f8548',
  belt: '#7a2f2f',
  hair: '#171210',
  outline: '#1a1410',
  enemy1: '#3d8bff',
  enemy1shade: '#1e5fd9',
  enemy2: '#c04dff',
  enemy2shade: '#8a1fd9',
  boss: '#e83a3a',
  bossShade: '#a80000',
  bossGold: '#ffd23d',
  lantern: '#ff8a1e',
  skyTop: '#7fc7ff',
  skyBottom: '#ffe08a',
  roofTile: '#ff4d4d',
  roofTileDark: '#b31e1e',
  wallWood: '#e0a15a',
  wallWoodDark: '#a8672f',
  signRed: '#e02020',
  signGold: '#ffe14d',
  windowFrame: '#5a3418',
  lattice: '#7a4a24',
  floorWood: '#e8b878',
  floorWoodDark: '#c08a4a'
};

function rect(x,y,w,h,c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function lerp(a, b, t) { return a + (b - a) * t; }
// 漫画風の黒縁取りブロック(セル画風)
function rectO(x,y,w,h,c) {
  ctx.fillStyle = PAL.outline;
  ctx.fillRect(Math.round(x)-1, Math.round(y)-1, w+2, h+2);
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// ================= ドットマトリックス タイトル「功夫之拳」 =================
let kungfuDots = null;
function buildKungfuDotTitle() {
  const text = '功夫之拳';
  const fontSize = 84, sample = 5;
  const off = document.createElement('canvas');
  const mctx = off.getContext('2d');
  const fontStack = `900 ${fontSize}px "Microsoft JhengHei","PMingLiU","Heiti TC","SimHei","Noto Sans TC",sans-serif`;
  mctx.font = fontStack;
  const measured = Math.ceil(mctx.measureText(text).width);
  off.width = measured + 30;
  off.height = Math.ceil(fontSize * 1.35);
  mctx.font = fontStack;
  mctx.fillStyle = '#fff';
  mctx.textBaseline = 'top';
  mctx.textAlign = 'left';
  mctx.fillText(text, 15, fontSize * 0.06);
  const img = mctx.getImageData(0, 0, off.width, off.height).data;
  const dots = [];
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for (let y=0; y<off.height; y+=sample) for (let x=0; x<off.width; x+=sample) {
    const idx=(y*off.width+x)*4;
    if (img[idx+3]>128) { dots.push({x,y}); if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
  }
  const cx0=(minX+maxX)/2, cy0=(minY+maxY)/2;
  kungfuDots = dots.map(d => ({ x: d.x-cx0, y: d.y-cy0 }));
}
function drawKungfuDotTitle(cx, cy) {
  if (!kungfuDots) return;
  const scale = 1.1;
  const dotSize = 3.4 * scale;
  const flicker = 0.9 + Math.sin(frame * 0.15) * 0.1;
  for (let i = 0; i < kungfuDots.length; i++) {
    const d = kungfuDots[i];
    const dx = cx + d.x * scale, dy = cy + d.y * scale;
    const glowMix = (Math.sin(frame * 0.05 + i * 0.15) + 1) / 2;
    const r = 255, g = Math.round(60 + glowMix*70), b = Math.round(60 + glowMix*40);
    ctx.fillStyle = `rgba(${r},${g},${b},${flicker})`;
    ctx.fillRect(Math.round(dx - dotSize/2), Math.round(dy - dotSize/2), dotSize, dotSize);
  }
}

// ================= ドットマトリックス 主人公シルエット =================
let heroDots = null;
function buildHeroDotSilhouette() {
  const w=130,h=190;
  const off=document.createElement('canvas'); off.width=w; off.height=h;
  const mctx=off.getContext('2d');
  mctx.fillStyle='#fff';
  mctx.beginPath(); mctx.arc(70,22,15,0,Math.PI*2); mctx.fill();
  mctx.fillRect(56,13,16,5); mctx.fillRect(83,15,15,4); mctx.fillRect(95,21,13,4);
  mctx.fillRect(63,36,14,8);
  mctx.fillRect(45,44,50,55);
  mctx.fillRect(42,92,56,8);
  mctx.fillRect(78,46,14,14); mctx.fillRect(90,50,34,12);
  mctx.beginPath(); mctx.arc(128,56,9,0,Math.PI*2); mctx.fill();
  mctx.fillRect(30,58,12,26);
  mctx.beginPath(); mctx.arc(36,86,8,0,Math.PI*2); mctx.fill();
  mctx.fillRect(50,100,16,32); mctx.fillRect(44,128,14,38); mctx.fillRect(38,164,24,10);
  mctx.fillRect(72,100,16,38); mctx.fillRect(76,134,14,44); mctx.fillRect(82,176,26,10);
  const img=mctx.getImageData(0,0,w,h).data;
  const dots=[]; const sample=3;
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for (let y=0;y<h;y+=sample) for (let x=0;x<w;x+=sample) {
    const idx=(y*w+x)*4;
    if (img[idx+3]>128) { dots.push({x,y}); if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
  }
  const cx0=(minX+maxX)/2, cy0=(minY+maxY)/2;
  heroDots = dots.map(d => ({ x: d.x-cx0, y: d.y-cy0 }));
}
function drawHeroDotSilhouette(cx, cy, scale, alpha) {
  if (!heroDots) return;
  const dotSize = 2.6 * scale;
  for (let i = 0; i < heroDots.length; i++) {
    const d = heroDots[i];
    const dx = cx + d.x * scale, dy = cy + d.y * scale;
    ctx.fillStyle = `rgba(255,90,50,${alpha})`;
    ctx.fillRect(Math.round(dx - dotSize/2), Math.round(dy - dotSize/2), dotSize, dotSize);
  }
}

// ================= 漫画エフェクト:速度線 & 擬音字 =================
function drawSpeedLines(cx, cy, facing) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const ang = (Math.random()-0.5) * 0.9;
    const len = 26 + Math.random()*22;
    const dx = facing;
    ctx.beginPath();
    const sx = cx - dx*6, sy = cy + (i-3)*5 + (Math.random()-0.5)*6;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - dx*len, sy + ang*10);
    ctx.stroke();
  }
  ctx.restore();
}

// 衝撃波風のバースト背景(タイトル画面のヒーロー後ろに配置)
function drawImpactBurst(cx, cy, r1, r2, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  const spikes = 16;
  for (let i = 0; i < spikes*2; i++) {
    const ang = (i/(spikes*2)) * Math.PI*2 + frame*0.003;
    const rad = i % 2 === 0 ? r2 : r1;
    const px = Math.cos(ang)*rad, py = Math.sin(ang)*rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

let mangaTexts = [];
let mangaCooldown = 0;
const HIT_WORDS = ['バキ!','ドン!','ズガッ!','ガツン!'];
const DEFEAT_WORDS = ['轟!','KO!'];
function spawnMangaText(word, x, y, big, color) {
  mangaTexts.push({ word, x, y: y - 10, life: 0, maxLife: 34, big: !!big, rot: (Math.random()-0.5)*0.3, color: color || null });
}
function maybeSpawnHitText(x, y) {
  if (mangaCooldown > 0) return;
  spawnMangaText(HIT_WORDS[Math.floor(Math.random()*HIT_WORDS.length)], x, y, false);
  mangaCooldown = 16;
}
function updateMangaTexts() {
  if (mangaCooldown > 0) mangaCooldown--;
  mangaTexts.forEach(t => { t.life++; t.y -= 0.4; });
  mangaTexts = mangaTexts.filter(t => t.life < t.maxLife);
}
function drawMangaTexts() {
  mangaTexts.forEach(t => {
    const p = t.life / t.maxLife;
    const scale = t.big ? (1.4 - p*0.3) : (1 - p*0.25);
    const alpha = p < 0.75 ? 1 : (1 - (p-0.75)/0.25);
    const sx = t.x - camX;
    ctx.save();
    ctx.translate(sx, t.y);
    ctx.rotate(t.rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = (t.big ? 'bold 26px' : 'bold 18px') + ' "Microsoft JhengHei","Arial Black",sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#1a1410';
    ctx.strokeText(t.word, 0, 0);
    ctx.fillStyle = t.color || (t.big ? '#ffdd33' : '#fff44d');
    ctx.fillText(t.word, 0, 0);
    ctx.restore();
  });
}

// 漫画パネル風フレーム(外枠)
function drawComicFrame() {
  ctx.save();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W-6, H-6);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(7, 7, W-14, H-14);
  // コーナーの集中線アクセント(左上)
  ctx.strokeStyle = 'rgba(20,20,20,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(6 + 40 - i*7, 6 + 8 + i*6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStory() {
  ctx.fillStyle = '#0c0a08';
  ctx.fillRect(0, 0, W, H);

  const idx = Math.max(0, Math.min(6, storyIndex));
  const img = storyImgs[idx];

  if (storyImgsLoaded[idx]) {
    // 画像をコマ枠内に収めて中央配置(アスペクト比維持)
    const padX = 30, padTop = 26, padBottom = 54;
    const areaW = W - padX * 2;
    const areaH = H - padTop - padBottom;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.min(areaW / iw, areaH / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (W - dw) / 2, dy = padTop + (areaH - dh) / 2;

    // フェードイン
    const a = Math.min(1, storyFadeIn / 12);

    // コマ枠(白フチ+黒フチの漫画風)
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff';
    ctx.fillRect(dx - 6, dy - 6, dw + 12, dh + 12);
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.strokeStyle = '#1a1410';
    ctx.lineWidth = 4;
    ctx.strokeRect(dx - 6, dy - 6, dw + 12, dh + 12);
    ctx.restore();

    // キャプション(吹き出し風の帯)
    ctx.save();
    ctx.globalAlpha = a;
    const capY = dy + dh + 24;
    ctx.font = 'bold 13px "Microsoft JhengHei","Yu Gothic","Noto Sans JP",sans-serif';
    ctx.textAlign = 'center';
    const text = (storyCaptions[currentLang] || storyCaptions.zh)[idx] || '';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.strokeText(text, W/2, capY);
    ctx.fillStyle = '#ffdd88';
    ctx.fillText(text, W/2, capY);
    ctx.restore();

    if (storyFadeIn < 12) storyFadeIn++;
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', W/2, H/2);
  }

  // ページ番号 & 進行プロンプト
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText(`${idx+1} / 7`, 14, H - 14);

  ctx.textAlign = 'right';
  ctx.fillStyle = frame % 60 < 30 ? '#ffdd33' : '#aa8800';
  ctx.font = 'bold 13px monospace';
  const promptText = (idx >= 6) ? tf('startBattlePrompt', confirmKeyLabel()) : tf('continuePrompt', confirmKeyLabel());
  ctx.fillText(promptText, W - 14, H - 14);
  ctx.textAlign = 'center';
}

// ================= Game state =================
let state = 'start';
// ===== ゲームメニュー(タイトル画面でENTER確定後に表示) =====
let menuScreen = 'main'; // 'main' | 'settings' | 'help' | 'language' | 'credits'
let menuIndex = 0;
let menuReturnTo = 'title'; // 設定画面を閉じた時にどこへ戻るか: 'title'(通常のメインメニュー) | 'paused'(PAUSEメニューから開いた場合)

// ===== PAUSE(一時停止)メニュー =====
let pauseScreen = 'main'; // 'main' | 'confirmReturn'
let pauseIndex = 0;
let pausedMusicRefs = []; // ポーズ時に一時停止したBGMを記録し、解除時に再開する

// ===== 多言語対応(中文/日文/英文) =====
let currentLang = 'zh';
const STR = {
  zh: {
    menuStart: '開始遊戲', menuSettings: '設定', menuHelp: '操作說明', menuLang: '語言', menuLeaderboard: '排行榜', menuCredit: 'CREDIT', menuHistory: '了解歷史', historyScrollHint: '捲動',
    historyArticleTimeline: '橫捲軸遊戲發展史', historyArticleConcept: '概念與結構組成', historyArticleAbout: '關於Arc概遊庫', historyAboutFanPage: '前往粉絲團',
    nameEntryTitle: '姓名', nameEntryConfirmAgain: '請再按%s次確認送出',
    nameEntryHint: '↑↓選字(手把)　Enter/A:確定此字(空白則為-)　Backspace/B:退回一格', nameEntryHint1: '按字母鍵輸入(最多4個字元)', nameEntryHint2: 'Enter確定(留空亦可送出)',
    leaderboardTitle: '排行榜', leaderboardEmpty: '尚無紀錄', leaderboardSwitch: '切換難度', leaderboardPageSwitch: '換頁', leaderboardLoading: '讀取中',
    difficultyTitle: '選擇難度',
    modeSelectTitle: '選擇模式', modeStory: '劇情模式', modeDojo: '武道模式',
    modeStoryDesc: '循序漸進的劇情關卡,可選擇難度', modeDojoDesc: '固定畫面生存戰,殘機1,限時1分鐘拚高分', difficultyEasy: '簡單', difficultyNormal: '普通', difficultyHard: '困難',
    difficultyEasyDesc: '敵人較少較弱,殘機較多(3隻)', difficultyNormalDesc: '標準挑戰,敵人稍強、殘機較少(2隻)',
    difficultyHardDesc: '敵人更多更強,BOSS更硬,殘機僅1隻',
    settingsTitle: '設定', settingsMusic: '音樂', settingsSfx: '音效', settingsControl: '操作', settingsScale: '畫面大小',
    settingsKeyBind: '控制', bindMove: '移動', bindReset: '預設',
    bindHint: '選擇項目後按下新按鍵即可替換,方向鍵/Enter/Esc除外',
    bindMoveLeft: '向左移動', bindMoveRight: '向右移動',
    bindWaiting: '請按下[%s]的新按鍵...(Esc取消)', bindCancelHint: '按Esc取消變更', bindConflict: '此按鍵已被[%s]使用,請換一個',
    bindReserved: '此按鍵為系統保留(SELECT/START/L3/R3),無法指定',
    bindKeyboardSection: '鍵盤', bindGamepadSection: '手把(按鈕編號)',
    controlAuto: '自動偵測', controlKeyboard: '鍵盤', controlGamepad: '控制器',
    back: '返回上一頁', navHint: '↑↓選擇　←→調整　Enter確定　Esc/B返回',
    helpTitle: '操作說明',
    helpMove: '移動', helpMoveDesc: '左右方向鍵移動角色',
    helpJump: '跳躍', helpJumpDesc: '按上方向鍵起跳',
    helpDuck: '蹲下', helpDuckDesc: '按下方向鍵蹲下閃避',
    helpPunch: '揮拳', helpPunchDesc: '快速攻擊(輕按即出拳)',
    helpKick: '踢腿', helpKickDesc: '範圍較大的攻擊',
    helpCharge: '波動拳', helpChargeDesc: '長按揮拳鍵蓄力,放開後發射飛行道具', helpChargeKey: '氣功',
    helpParry: '招架/彈返', helpParryDesc: '在敵人攻擊命中前按下,可擊退小兵並反彈BOSS火球',
    langTitle: '選擇語言',
    langZh: '中文', langJa: '日文', langEn: '英文',
    creditTitle: 'CREDIT', creditPlan: '企劃', creditAI: '程式',
    creditArt: '美術', creditMusic: '音樂', creditThanks: '特別感謝',
    hpLabel: 'HP', scoreLabel: 'SCORE', chargeLabel: '氣', bossLabel: 'MASTER',
    gameOver: 'GAME OVER', stageClear: 'STAGE CLEAR!', retry: '重新挑戰',
    gameOverRetry: '重新挑戰', gameOverToTitle: '返回主畫面', pressAnyKeyContinue: '按任意鍵繼續',
    enterLabel: 'ENTER', startLabel: '開始', continueLabel: '繼續', startBattleLabel: '開始戰鬥',
    backToTitle: '按任意鍵回到標題畫面',
    retryPrompt: '按%s重新挑戰', continuePrompt: '按%s繼續', startBattlePrompt: '按%s開始戰鬥', startPrompt: '按%s開始',
    pauseTitle: 'PAUSE', pauseResume: '繼續遊戲', pauseSettings: '設定', pauseHelp: '操作說明', pauseReturnMain: '返回主選單',
    confirmReturnText: '確定返回?', confirmYes: '是', confirmNo: '否',
    hintMove: '移動', hintJump: '跳躍', hintDuck: '蹲下', hintPunch: '揮拳(長按蓄力放波動拳)', hintKick: '踢腿', hintStart: '開始', hintParry: '格擋', hintPause: '暫停', hintStick: '方向鍵/左搖桿',
    pressAnyKey: '請按任意鍵', loading: '載入中',
  },
  ja: {
    menuStart: 'ゲーム開始', menuSettings: '設定', menuHelp: '操作説明', menuLang: '言語', menuLeaderboard: 'ランキング', menuCredit: 'CREDIT', menuHistory: '歴史を知る', historyScrollHint: 'スクロール',
    historyArticleTimeline: '横スクロールゲームの歴史', historyArticleConcept: '概念と構成要素', historyArticleAbout: 'ARCの概遊庫について', historyAboutFanPage: 'ファンページへ',
    nameEntryTitle: '名前', nameEntryConfirmAgain: 'あと%s回押すと送信されます',
    nameEntryHint: '↑↓文字選択(パッド)　Enter/A:確定(空欄は-)　Backspace/B:戻る', nameEntryHint1: '文字キーで入力(最大4文字)', nameEntryHint2: 'Enterで決定(空欄のまま送信も可)',
    leaderboardTitle: 'ランキング', leaderboardEmpty: '記録はまだありません', leaderboardSwitch: '難易度切替', leaderboardPageSwitch: 'ページ切替', leaderboardLoading: '読み込み中',
    difficultyTitle: '難易度選択',
    modeSelectTitle: 'モード選択', modeStory: 'ストーリーモード', modeDojo: '道場モード',
    modeStoryDesc: '難易度を選べる通常のストーリーステージ', modeDojoDesc: '固定画面のサバイバル戦、残機1、制限時間1分でハイスコアを狙う', difficultyEasy: 'かんたん', difficultyNormal: 'ふつう', difficultyHard: 'むずかしい',
    difficultyEasyDesc: '敵が少なく弱め、残機が多い(3機)', difficultyNormalDesc: '標準的な難易度、敵がやや強く残機が少ない(2機)',
    difficultyHardDesc: '敵が多く強力、BOSSも強化、残機は1機のみ',
    settingsTitle: '設定', settingsMusic: '音楽', settingsSfx: '効果音', settingsControl: '操作方法', settingsScale: '画面サイズ',
    settingsKeyBind: 'キー設定', bindMove: '移動', bindReset: 'デフォルト',
    bindHint: '項目を選んで新しいキーを押すと変更されます(方向キー/Enter/Esc除く)',
    bindMoveLeft: '左移動', bindMoveRight: '右移動',
    bindWaiting: '[%s]の新しいキーを押してください...(Escでキャンセル)', bindCancelHint: 'Escでキャンセル', bindConflict: 'このキーは既に[%s]で使用されています',
    bindReserved: 'このボタンはシステム予約(SELECT/START/L3/R3)のため指定できません',
    bindKeyboardSection: 'キーボード', bindGamepadSection: 'ゲームパッド(ボタン番号)',
    controlAuto: '自動検出', controlKeyboard: 'キーボード', controlGamepad: 'コントローラー',
    back: '戻る', navHint: '↑↓選択　←→調整　Enter決定　Esc/B戻る',
    helpTitle: '操作説明',
    helpMove: '移動', helpMoveDesc: '左右キーでキャラクターを移動',
    helpJump: 'ジャンプ', helpJumpDesc: '上キーでジャンプ',
    helpDuck: 'しゃがみ', helpDuckDesc: '下キーでしゃがんで回避',
    helpPunch: 'パンチ', helpPunchDesc: '素早い攻撃(軽く押すと繰り出す)',
    helpKick: 'キック', helpKickDesc: '範囲の広い攻撃',
    helpCharge: '波動拳', helpChargeDesc: 'パンチキーを長押しでチャージ、離すと飛び道具発射', helpChargeKey: '気功',
    helpParry: 'パリィ/反射', helpParryDesc: '敵の攻撃が当たる直前に押すと、雑魚を撃退しBOSSの火球を跳ね返せる',
    langTitle: '言語選択',
    langZh: '中国語', langJa: '日本語', langEn: '英語',
    creditTitle: 'CREDIT', creditPlan: '企画', creditAI: 'AIツール',
    creditArt: '美術', creditMusic: '音楽', creditThanks: 'スペシャルサンクス',
    hpLabel: 'HP', scoreLabel: 'SCORE', chargeLabel: '気', bossLabel: 'MASTER',
    gameOver: 'GAME OVER', stageClear: 'STAGE CLEAR!', retry: 'リトライ',
    gameOverRetry: 'リトライ', gameOverToTitle: 'タイトルへ戻る', pressAnyKeyContinue: '何かキーを押して続行',
    enterLabel: 'ENTER', startLabel: 'スタート', continueLabel: '続ける', startBattleLabel: '戦闘開始',
    backToTitle: '任意のキーでタイトルへ戻る',
    retryPrompt: '%sでリトライ', continuePrompt: '%sで進む', startBattlePrompt: '%sで戦闘開始', startPrompt: '%sでスタート',
    pauseTitle: 'PAUSE', pauseResume: 'ゲームに戻る', pauseSettings: '設定', pauseHelp: '操作説明', pauseReturnMain: 'メインメニューへ戻る',
    confirmReturnText: '本当に戻りますか?', confirmYes: 'はい', confirmNo: 'いいえ',
    hintMove: '移動', hintJump: 'ジャンプ', hintDuck: 'しゃがみ', hintPunch: 'パンチ(長押しで波動拳)', hintKick: 'キック', hintStart: 'スタート', hintParry: 'パリィ', hintPause: 'ポーズ', hintStick: '方向キー/左スティック',
    pressAnyKey: 'どれかキーを押してください', loading: '読み込み中',
  },
  en: {
    menuStart: 'Start Game', menuSettings: 'Settings', menuHelp: 'How to Play', menuLang: 'Language', menuLeaderboard: 'Leaderboard', menuCredit: 'CREDIT', menuHistory: 'Learn about history', historyScrollHint: 'Scroll',
    historyArticleTimeline: 'History of Side-Scrollers', historyArticleConcept: 'Concepts & Structure', historyArticleAbout: "About Arc's Game Archive", historyAboutFanPage: 'Visit Fan Page',
    nameEntryTitle: 'Name', nameEntryConfirmAgain: 'Press %s more time(s) to confirm',
    nameEntryHint: 'Up/Down: pick letter (pad)   Enter/A: Confirm (blank = -)   Backspace/B: Go back', nameEntryHint1: 'Type letter keys (up to 4 chars)', nameEntryHint2: 'Enter to confirm (blank is OK too)',
    leaderboardTitle: 'Leaderboard', leaderboardEmpty: 'No records yet', leaderboardSwitch: 'Switch difficulty', leaderboardPageSwitch: 'Page', leaderboardLoading: 'Loading',
    difficultyTitle: 'Select Difficulty',
    modeSelectTitle: 'Select Mode', modeStory: 'Story Mode', modeDojo: 'Dojo Mode',
    modeStoryDesc: 'Standard story stages with difficulty selection', modeDojoDesc: 'Fixed-screen survival, 1 life, 1-minute high score challenge', difficultyEasy: 'Easy', difficultyNormal: 'Normal', difficultyHard: 'Hard',
    difficultyEasyDesc: 'Fewer, weaker enemies and more lives (3)', difficultyNormalDesc: 'Standard challenge, tougher enemies, fewer lives (2)',
    difficultyHardDesc: 'More/tougher enemies, stronger boss, only 1 life',
    settingsTitle: 'Settings', settingsMusic: 'Music', settingsSfx: 'SFX', settingsControl: 'Controls', settingsScale: 'Screen Size',
    settingsKeyBind: 'Controls', bindMove: 'Move', bindReset: 'Default',
    bindHint: 'Select an item and press a new key to rebind (arrow keys/Enter/Esc excluded)',
    bindMoveLeft: 'Move Left', bindMoveRight: 'Move Right',
    bindWaiting: 'Press a new key for [%s]...(Esc to cancel)', bindCancelHint: 'Press Esc to cancel', bindConflict: 'This key is already used by [%s]',
    bindReserved: 'This button is reserved by the system (SELECT/START/L3/R3)',
    bindKeyboardSection: 'Keyboard', bindGamepadSection: 'Gamepad (button #)',
    controlAuto: 'Auto-detect', controlKeyboard: 'Keyboard', controlGamepad: 'Gamepad',
    back: 'Back', navHint: 'Up/Down: Select  Left/Right: Adjust  Enter: OK  Esc/B: Back',
    helpTitle: 'How to Play',
    helpMove: 'Move', helpMoveDesc: 'Left/Right arrow keys to move',
    helpJump: 'Jump', helpJumpDesc: 'Up arrow key to jump',
    helpDuck: 'Duck', helpDuckDesc: 'Down arrow key to duck',
    helpPunch: 'Punch', helpPunchDesc: 'Fast attack (quick tap)',
    helpKick: 'Kick', helpKickDesc: 'Attack with longer reach',
    helpCharge: 'Hadouken', helpChargeDesc: 'Hold punch key to charge, release to fire a projectile', helpChargeKey: 'Ki Charge',
    helpParry: 'Parry/Reflect', helpParryDesc: 'Press right before an attack lands to knock back enemies or reflect the boss\'s fireball',
    langTitle: 'Select Language',
    langZh: 'Chinese', langJa: 'Japanese', langEn: 'English',
    creditTitle: 'CREDIT', creditPlan: 'Planning', creditAI: 'AI Tool',
    creditArt: 'Art', creditMusic: 'Music', creditThanks: 'Special Thanks',
    hpLabel: 'HP', scoreLabel: 'SCORE', chargeLabel: 'KI', bossLabel: 'MASTER',
    gameOver: 'GAME OVER', stageClear: 'STAGE CLEAR!', retry: 'Retry',
    gameOverRetry: 'Retry', gameOverToTitle: 'Return to Title', pressAnyKeyContinue: 'Press any key to continue',
    enterLabel: 'ENTER', startLabel: 'Start', continueLabel: 'Continue', startBattleLabel: 'Start Battle',
    backToTitle: 'Press any key to return to title',
    retryPrompt: 'Press %s to retry', continuePrompt: 'Press %s to continue', startBattlePrompt: 'Press %s to start battle', startPrompt: 'Press %s to start',
    pauseTitle: 'PAUSE', pauseResume: 'Resume', pauseSettings: 'Settings', pauseHelp: 'How to Play', pauseReturnMain: 'Return to Main Menu',
    confirmReturnText: 'Return to main menu?', confirmYes: 'Yes', confirmNo: 'No',
    hintMove: 'Move', hintJump: 'Jump', hintDuck: 'Duck', hintPunch: 'Punch (hold to charge Hadouken)', hintKick: 'Kick', hintStart: 'Start', hintParry: 'Parry', hintPause: 'Pause', hintStick: 'D-Pad/Left Stick',
    pressAnyKey: 'Press any key', loading: 'Loading',
  },
};
function t(key) { return (STR[currentLang] && STR[currentLang][key]) || STR.zh[key] || key; }
function tf(key, param) { return t(key).replace('%s', param); }

let storyIndex = 0;
let titleConfirming = false; // ENTER押下後、点滅演出を挟んでから漫画へ遷移するためのフラグ
let titleAnimStart = 0; // タイトル画面演出(ロゴのズームイン→主人公のスライドイン)の開始フレーム
let storyFadeIn = 0;
let score = 0, lives = 3, camX = 0, frame = 0, demoTimer = 0;
let GAME_TIME_LIMIT = 2 * 60 * 60; // 制限時間(60fps換算、難易度に応じてresetGame()で再設定する)
let gameTimeFrames = GAME_TIME_LIMIT; // 残り時間(フレーム数でカウントダウン)

let girlX = null, girlWalkFrame = 0, girlArrived = false; // エンディングで主人公の元へ歩いてくるヒロインの状態
let demoPhase = 'walkCenter', demoPhaseTimer = 0; // エンディング演出の進行フェーズ
// ===== 排行榜(ランキング)関連の状態 =====
let nameEntryChars = ['', '', '', '']; // 名前入力(最大4文字)
let nameEntryIndex = 0; // 入力カーソル位置
let nameEntrySource = 'gameover'; // 'gameover' | 'stageclear' : 名前入力後にどちらの画面へ進むか
let leaderboardFromMenu = false; // true: メインメニューから閲覧のみで開いた場合(戻り先が異なる)
let leaderboardHighlightIndex = -1; // 直前に登録した順位をハイライト表示するためのインデックス
// ===== 難易度設定 =====
// [簡單]を基準とし、[普通][困難]は敵の生成頻度・同時出現数・攻撃力・BOSSの体力/攻撃力・制限時間・残機を段階的に厳しくする
const DIFFICULTY_PRESETS = {
  // bossApproachSpeed/bossEnragedApproachSpeed: 通常時/覚醒時の接近速度
  // bossMoveTriggerMul: 必殺技・跳躍攻撃・旋轉攻撃の発動確率にかける倍率
  // bossMoveCooldownMul: 上記3種の(通常時)クールダウンにかける倍率(大きいほど間隔が長い)
  // bossEnrageCooldownMul: 覚醒中の必殺技クールダウンにかける倍率
  // bossQuirkMul: 後退/一時停止(隙)の発生確率にかける倍率(大きいほど隙が多い)
  // enrageThreshold: 覚醒が発動するHP割合(この値を下回った瞬間に発動)
  easy:   { spawnMin: 90, spawnRange: 50, maxEnemies: 5, enemyDmgMul: 1.0, bossHpMul: 1.0, bossDmgMul: 1.0, timeLimitSec: 240, lives: 3,
            bossApproachSpeed: 0.9, bossEnragedApproachSpeed: 1.3, bossMoveTriggerMul: 0.6, bossMoveCooldownMul: 1.4,
            bossEnrageCooldownMul: 0.6, bossQuirkMul: 1.8, enrageThreshold: 0.3 },
  normal: { spawnMin: 65, spawnRange: 40, maxEnemies: 6, enemyDmgMul: 1.3, bossHpMul: 1.25, bossDmgMul: 1.2, timeLimitSec: 240, lives: 2,
            bossApproachSpeed: 1.1, bossEnragedApproachSpeed: 1.6, bossMoveTriggerMul: 1.0, bossMoveCooldownMul: 1.0,
            bossEnrageCooldownMul: 0.4, bossQuirkMul: 1.0, enrageThreshold: 0.5 },
  hard:   { spawnMin: 45, spawnRange: 30, maxEnemies: 7, enemyDmgMul: 1.6, bossHpMul: 1.5, bossDmgMul: 1.4, timeLimitSec: 240, lives: 1,
            bossApproachSpeed: 1.4, bossEnragedApproachSpeed: 2.0, bossMoveTriggerMul: 1.6, bossMoveCooldownMul: 0.7,
            bossEnrageCooldownMul: 0.25, bossQuirkMul: 0.4, enrageThreshold: 0.65 },
};
let difficulty = 'easy';
function diffSettings() { return DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.easy; }
// ===== ゲームモード(劇情模式/武道模式) =====
let gameMode = 'story'; // 'story' | 'dojo'
const DOJO_TIME_LIMIT_SEC = 60; // 武道場モードの制限時間(1分固定)
const DOJO_LIVES = 1; // 武道場モードは残機1固定
let dojoElapsedFrames = 0; // 武道場モード開始からの経過フレーム数(難易度の漸進上昇に使用)
let dojoCountdown = 0; // 開始前カウントダウン(5→1→FIGHT!!)用のタイマー
let dojoCountdownActive = false; // 入場効果音の再生が終わり、カウントダウンを実際に進めてよいか
let dojoCountdownFailsafe = 0; // 音声endedイベント未発火時の保険タイマー
let dojoFightTextTimer = 0; // "FIGHT!!"表示用タイマー
let enteringFailsafe = 0; // 劇情模式の入場演出:kungfuStartAudioが再生できない(素材読込失敗等)場合でも進行が止まらないようにする保険タイマー
// ===== COMBO(連続撃破ボーナス) =====
let comboCount = 0; // 現在の連続撃破数(被弾すると0にリセット)
let comboFlashTimer = 0; // "COMBO+N"表示のポップ演出用タイマー
let comboBreakTimer = 0; // 連續が途切れた瞬間の「破碎」演出用タイマー
let comboBreakValue = 0; // 破碎演出で表示する、途切れる直前の連續数
function comboTier(count) {
  return count >= 10 ? 2 : count >= 5 ? 1 : 0; // 0=cyan, 1=orange, 2=gold
}
const COMBO_TIER_COLORS = ['#00e5ff', '#ffb200', '#ffdd33'];
function registerComboKill() {
  comboCount++;
  if (comboCount >= 2) {
    const bonus = comboCount * 10; // 連続数に応じてボーナス加算(2連続=+20、3連続=+30…)
    score += bonus;
    comboFlashTimer = 45;
  }
}
function resetCombo() {
  if (comboCount >= 2) {
    comboBreakValue = comboCount;
    comboBreakTimer = 30;
  }
  comboCount = 0;
}
// 武道場モードの難易度は経過時間に応じて段階的(5秒ごと)に上昇させる(最大12段階)
function dojoDifficultyLevel() {
  return Math.min(12, Math.floor(dojoElapsedFrames / (5 * 60))); // 5秒ごとに難易度上昇(1分間で最大12段階=上限まで到達)
}
function dojoMaxEnemies() {
  return Math.min(12, 6 + dojoDifficultyLevel()); // 開始時から6体、最大12体まで増加
}
function dojoSpawnInterval() {
  const interval = 55 - dojoDifficultyLevel() * 4; // 開始時から間隔を詰め、段階ごとにさらに短縮
  return Math.max(15, interval);
}
let gameOverIndex = 0; // GAME OVER画面の選択項目(0:重新遊戲 1:返回主畫面)
// 攻撃ボタンの連射防止用:前フレームでの押下状態を記録し、押しっぱなしでは
// 再発動しない(離してもう一度押した時だけ次の攻撃が出る)ようにする。
let prevAttackKeyZ = false, prevAttackKeyX = false;
let prevJumpKey = false; // ジャンプキーの押しっぱなしで連続ジャンプしないようにするためのedge検出
const LEVEL_LENGTH = 4000;

const player = {
  x: 100, y: 0, w: 44, h: 84, vx: 0, vy: 0, onGround: true, facing: 1, ducking: false,
  hp: 100, maxHp: 100, attackTimer: 0, attackType: null, hitCooldown: 0, invuln: 0,
  dead: false, pendingDeath: false, deathTimer: 0, walkFrame: 0, chargeTimer: 0, fullChargeFxDone: false, hitStun: 0,
  parryTimer: 0, parryCooldown: 0
};

let enemies = [], particles = [], bossSpawned = false, boss = null, nextEnemyX = 500, enemiesDefeated = 0;
let enemySpawnTimer = 60; // 小兵の自動生成タイマー(プレイヤーの移動有無に関わらず一定間隔で生成)
let hadoukens = []; // 波動拳(飛行道具)のリスト
let bossFireballs = []; // BOSSの火球(飛行道具)のリスト
const CHARGE_POSE_FRAMES = 25;  // 溜めポーズ(hado_01)へ切り替わるタイミング(満タンより必ず前になるよう調整)
const CHARGE_FULL_FRAMES = 60;  // 1.0秒で満タン(フルチャージ)演出

function resetGame() {
  score = 0; lives = gameMode === 'dojo' ? DOJO_LIVES : diffSettings().lives; camX = 0; frame = 0; demoTimer = 0;
  GAME_TIME_LIMIT = (gameMode === 'dojo' ? DOJO_TIME_LIMIT_SEC : diffSettings().timeLimitSec) * 60;
  gameTimeFrames = GAME_TIME_LIMIT;
  dojoElapsedFrames = 0;
  dojoFightTextTimer = 0; dojoCountdownActive = false; dojoCountdownFailsafe = 0; enteringFailsafe = 0;
  comboCount = 0; comboFlashTimer = 0; comboBreakTimer = 0;
  girlX = null; girlWalkFrame = 0; girlArrived = false;
  demoPhase = 'walkCenter'; demoPhaseTimer = 0; heartParticles = [];
  nameEntryChars = ['', '', '', '']; nameEntryIndex = 0; leaderboardHighlightIndex = -1; gameOverIndex = 0; leaderboardLoading = false; postGameChoiceIndex = 0;
  player.x = 100; player.y = 0; player.vx = 0; player.vy = 0;
  player.hp = player.maxHp; player.onGround = true; player.dead = false; player.pendingDeath = false;
  player.facing = 1; player.attackTimer = 0; player.attackType = null; player.invuln = 0;
  player.chargeTimer = 0; player.fullChargeFxDone = false; player.hitStun = 0;
  player.parryTimer = 0; player.parryCooldown = 0;
  stopHadoHold();
  enemies = []; particles = []; mangaTexts = []; hadoukens = []; impactFlashes = []; bossFireballs = [];
  bossSpawned = false; boss = null; nextEnemyX = 500; enemiesDefeated = 0;
  enemySpawnTimer = 60;
  prevAttackKeyZ = false; prevAttackKeyX = false;
}
function startGame() { resetGame(); state = 'playing'; stopStageClearMusic(); stopBossMusic(); stopGameOverMusic(); stopFxEnding(); stopCreditMusic(); stopDojoMusic(); playGameMusic(); }

// 武道場モード:難易度選択・四格漫画を経ず、固定画面ですぐにカウントダウン→FIGHT!!へ進む
function startDojoMode() {
  gameMode = 'dojo';
  resetGame();
  player.x = W/2 - player.w/2;
  player.facing = -1;
  enemySpawnTimer = 25; // FIGHT!!直後からすぐに敵が来るよう、初回の生成待ちを短くする
  stopStageClearMusic(); stopBossMusic(); stopGameOverMusic(); stopFxEnding(); stopCreditMusic(); stopChinaMusic();
  state = 'dojoCountdown';
  dojoCountdown = 180; // 3秒(60fps換算)のカウントダウン
  // 劇情模式の主人公入場と同じ効果音を先に再生し、終わってからカウントダウンを開始する
  dojoCountdownActive = false;
  dojoCountdownFailsafe = 150; // 音声イベントが発火しない場合の保険(2.5秒後には強制的に開始)
  kungfuStartAudio.currentTime = 0;
  kungfuStartAudio.play().catch(() => {});
  kungfuStartAudio.addEventListener('ended', onDojoEntranceSfxEnded, { once: true });
}
function onDojoEntranceSfxEnded() {
  if (state === 'dojoCountdown') dojoCountdownActive = true;
}

// 武道場モード:時間切れまで生き残った場合はSTAGE CLEAR扱いにする(死亡演出を経ずに直接クリア画面へ)
function triggerDojoStageClear() {
  stopGameMusic(); stopBossMusic(); stopDojoMusic(); stopHadoHold();
  playStageClearMusic();
  setPostGameInputUnlock(clearThemeAudio);
  state = 'stageclear';
}

// 漫画終了後の主人公入場演出:画面左端の外から歩いて登場してから戦闘を開始する
// 1) 主人公が画面外(左)から歩いて入場しつつ「Kungfu Start」を再生
// 2) 入場後は所定の位置で立ち止まり、Kungfu Startの再生が終わるのを待つ
// 3) Kungfu Start終了と同時にステージBGMを再生開始し、その時点でプレイヤーに操作を渡す
//    (入場演出中はプレイヤーの操作を受け付けない)
function beginStageEntry() {
  gameMode = 'story';
  resetGame();
  player.x = -90; // 画面外(左端の外側)からスタート
  player.facing = 1;
  state = 'entering';
  stopOpeningMusic();
  stopStageClearMusic();
  stopBossMusic();
  stopGameMusic();
  stopGameOverMusic();
  stopFxEnding();
  stopCreditMusic();
  stopDojoMusic();
  kungfuStartAudio.currentTime = 0;
  kungfuStartAudio.play().catch(() => {});
  kungfuStartAudio.addEventListener('ended', onKungfuStartEnded, { once: true });
  enteringFailsafe = 150; // 音声イベントが発火しない場合の保険(2.5秒後には強制的に開始)
}
function onKungfuStartEnded() {
  if (state !== 'entering') return; // 既に他の状態へ進んでいた場合は何もしない(念のため)
  player.vx = 0;
  playGameMusic();
  state = 'playing';
}
// 武道場モード開始前のカウントダウン(5→1)を進め、0になったら試合開始(FIGHT!!)へ
function updateDojoCountdown() {
  if (!dojoCountdownActive) {
    // 音声のendedイベントが発火しない環境向けの保険:一定時間で強制的に開始する
    if (dojoCountdownFailsafe > 0) { dojoCountdownFailsafe--; if (dojoCountdownFailsafe <= 0) dojoCountdownActive = true; }
    return;
  }
  dojoCountdown--;
  if (dojoCountdown >= 0 && dojoCountdown % 60 === 59) {
    sfx.timeWarning(); // 劇情模式の残り10秒警告と同じ効果音を、カウントダウンの各秒の頭で鳴らす
  }
  if (dojoCountdown <= 0) {
    state = 'playing';
    dojoFightTextTimer = 50;
    playDojoMusic();
  }
}
function updateEntering() {
  const ENTRY_TARGET_X = 100; // 通常の戦闘開始位置(resetGameのplayer.xと同じ)
  if (player.x < ENTRY_TARGET_X) {
    player.vx = 1.9; // 入場速度(見た目のテンポを上げるため早歩き。Kungfu Start再生中は到着後その場で待機する)
    player.walkFrame += 0.18;
    player.x = Math.min(ENTRY_TARGET_X, player.x + player.vx);
  } else {
    player.vx = 0; // 到着後はKungfu Startが終わるまで立ち姿で待機
  }
  if (enteringFailsafe > 0) { enteringFailsafe--; if (enteringFailsafe <= 0) onKungfuStartEnded(); }
}

function spawnEnemy(x, type) {
  enemies.push({ x, y:0, w:44, h:84, type, hp: type==='walker'?20:18, vx:0, facing:-1,
    state:'approach', attackTimer:0, hitCooldown:0, walkFrame:0, dead:false, deathTimer:0 });
}
function spawnBoss(x) {
  const bossHp = Math.round(300 * diffSettings().bossHpMul); // 体力を底上げ(以前より倒れにくく。3難易度とも適度に増量)
  boss = { x, y:0, w:60, h:84, hp:bossHp, maxHp:bossHp, vx:0, knockbackVx:0, facing:-1, state:'approach',
    attackTimer:0, attackVariant:0, hitCooldown:0, walkFrame:0, dead:false, deathTimer:0,
    specialTimer:0, specialCooldown:180, specialHit:false, specialShotsTotal:1, enraged:false,
    moveQuirk:null, moveQuirkTimer:0, enrageIntroTimer:0,
    jumpAttackTimer:0, jumpAttackCooldown:150, jumpAttackHit:false, deathFallVy:0,
    spinAttackTimer:0, spinAttackCooldown:240, spinAttackHit:false, spinAngle:0, spinReboundVx:0, spinReboundVy:0,
    jumpOverTimer:0, jumpOverCooldown:200, jumpOverStartX:0, jumpOverTargetX:0, hitFallVy:0 };
}

// 残りHPが半分を切った瞬間に一度だけ発動:必殺技の予備動作ポーズ+炎の粒子で覚醒を演出し、
// 演出が終わるまでは攻撃も接近もしない(演出後は接近速度アップ+必殺技クールダウン短縮で攻勢を強める)
function maybeTriggerBossEnrage() {
  if (!boss || boss.enraged || boss.hp <= 0 || boss.hp / boss.maxHp >= diffSettings().enrageThreshold) return;
  boss.enraged = true;
  boss.specialCooldown = Math.min(boss.specialCooldown, 90);
  boss.state = 'enrageIntro';
  boss.enrageIntroTimer = 90;
  boss.vx = 0;
  boss.moveQuirk = null; boss.moveQuirkTimer = 0;
  spawnMangaText('覺醒!!', boss.x+boss.w/2, GROUND_Y-boss.h-45, true, '#ff3344');
  // 覚醒の瞬間、身体全体から炎が噴き出すような派手な初期バーストにする
  for (let i=0;i<8;i++) {
    const px = boss.x + boss.w/2 + (Math.random()-0.5)*boss.w*1.4;
    const py = GROUND_Y - boss.h*Math.random();
    spawnParticles(px, py, Math.random() < 0.5 ? '#ff6622' : '#ffcc55', 5, 7);
  }
  spawnParticles(boss.x+boss.w/2, GROUND_Y-boss.h/2, '#ff3344', 10, 5);
}

function rectsOverlap(a, b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

// キャラクターの足元に薄い楕円形の影を描く(worldXは中心のワールド座標、widthはキャラの横幅目安)
function drawGroundShadow(worldX, width) {
  const sx = worldX - camX;
  if (sx < -60 || sx > W + 60) return; // 画面外は描画をスキップ
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(sx, GROUND_Y - 6, width * 0.42, width * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 波動拳(飛行道具)を発射する
function spawnHadouken() {
  const w = 34, h = 26;
  const x = player.facing === 1 ? player.x + player.w - 6 : player.x - w + 6;
  const y = GROUND_Y + player.y - player.h * 0.58 - h/2;
  hadoukens.push({ x, y, w, h, vx: player.facing * 6.5, facing: player.facing, life: 90, hitEnemies: new Set() });
}

let parryFlashTimer = 0; // 格擋成功時の画面フラッシュ演出タイマー
function spawnParrySuccessFx(x, y) {
  parryFlashTimer = 8;
  playParrySfx();
  spawnMangaText('啪!!', x, y - 20, true, '#5CE1FF');
  for (let i=0;i<14;i++) {
    const angle = Math.random()*Math.PI*2;
    const spd = 2 + Math.random()*3;
    particles.push({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, life: 18, color: Math.random()<0.5 ? '#ffffff' : '#7CF5FF' });
  }
}
function drawParryFlash() {
  if (parryFlashTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = (parryFlashTimer/8) * 0.45;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// 武道場モード:開始前カウントダウン(5→1)とFIGHT!!表示を描く
function drawDojoCountdownOverlay() {
  if (state === 'dojoCountdown' && dojoCountdownActive) {
    const secLeft = Math.ceil(dojoCountdown / 60);
    const t01 = 1 - ((dojoCountdown % 60) / 60); // 1秒ごとにポップするスケール演出
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 90px monospace';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1a1410';
    ctx.translate(W/2, H/2);
    const scale = 1.4 - t01 * 0.4;
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(1, t01 * 3);
    ctx.strokeText(String(secLeft), 0, 30);
    ctx.fillStyle = '#ffdd33';
    ctx.fillText(String(secLeft), 0, 30);
    ctx.restore();
  } else if (dojoFightTextTimer > 0) {
    const p = dojoFightTextTimer / 50;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px monospace';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#1a1410';
    ctx.translate(W/2, H/2);
    const scale = p > 0.8 ? 1.5 - (1 - p) * 2.5 : 1;
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(1, p * 4);
    ctx.strokeText('FIGHT!!', 0, 20);
    ctx.fillStyle = '#ff3d3d';
    ctx.fillText('FIGHT!!', 0, 20);
    ctx.restore();
  }
}

// BOSSの必殺技(火球)を発射する
function spawnBossFireball() {
  const w = 34, h = 26;
  const x = boss.facing === 1 ? boss.x + boss.w - 10 : boss.x - w + 10;
  // ランダムで「低空(ジャンプで回避)」か「中空(しゃがみで回避)」のどちらかを飛ばす
  const isHigh = Math.random() < 0.5;
  const y = isHigh ? (GROUND_Y - 72 - h/2) : (GROUND_Y - 30 - h/2); // 中空版はもう少し高めにして、頭髪をかすめる違和感を解消
  bossFireballs.push({ x, y, w, h, vx: boss.facing * (boss.enraged ? 8 : 5), facing: boss.facing, life: 150, hit: false, high: isHigh }); // 覚醒後は飛行速度を強化
}

function updateBossFireballs() {
  bossFireballs.forEach(fb => {
    fb.x += fb.vx;
    fb.life--;
    if (frame % 3 === 0) spawnParticles(fb.x+fb.w/2, fb.y+fb.h/2, fb.reflected ? '#7CF5FF' : (Math.random()<0.5 ? '#ff6622' : '#ffcc55'));

    if (!fb.reflected) {
      // 格擋(パリィ)判定:成功時は火球をBOSS方向へ反射する(しゃがみ調整なしの通常判定で受け付ける)
      const parryBox = { x: player.x, y: GROUND_Y + player.y - player.h, w: player.w, h: player.h };
      const facingFireball = (fb.x >= player.x && player.facing === 1) || (fb.x < player.x && player.facing === -1);
      if (!fb.hit && player.parryTimer > 0 && facingFireball && rectsOverlap(fb, parryBox)) {
        fb.reflected = true;
        fb.vx = -fb.vx;
        fb.facing = -fb.facing;
        spawnParrySuccessFx(player.x + player.w/2, GROUND_Y - player.h/2);
        return;
      }
      const effH = player.ducking ? player.h * 0.48 : player.h; // しゃがみ中は判定の高さを低くし、中空の火球を回避できるようにする
      const pBox = { x: player.x, y: GROUND_Y + player.y - effH, w: player.w, h: effH }; // player.yを考慮し、ジャンプ中は判定を上へずらして回避可能にする
      if (!fb.hit && player.invuln<=0 && !player.dead && rectsOverlap(fb, pBox)) {
        player.hp -= Math.round(14 * diffSettings().bossDmgMul); player.invuln = 40; player.hitStun = 14; resetCombo(); sfx.hit();
        spawnParticles(player.x+player.w/2, GROUND_Y-player.h/2, '#ff8822');
        fb.hit = true;
      }
    } else if (boss && !boss.dead && !fb.hit) {
      // 反射された火球がBOSSに命中したかを判定(命中でHPを大きく削る)
      const bossBox = { x: boss.x, y: GROUND_Y - boss.h, w: boss.w, h: boss.h };
      if (rectsOverlap(fb, bossBox)) {
        boss.hp -= 20; // 「2格」相当のダメージ
        boss.hitCooldown = 12;
        spawnImpactFlash(boss.x+boss.w/2, GROUND_Y-boss.h/2);
        sfx.bossHit();
        fb.hit = true;
        if (boss.hp <= 0) {
          boss.dead = true; boss.deathTimer = 0; score += 1500; // パリィで反射した火球によるトドメは通常撃破(1000)の1.5倍
          playBossDeadSfx();
          spawnMangaText('轟!!', boss.x+boss.w/2, GROUND_Y-boss.h-45, true);
        }
      }
    }
  });
  bossFireballs = bossFireballs.filter(fb => !fb.hit && fb.life > 0 && fb.x > camX-100 && fb.x < camX+W+100);
}

// 火球の描画。素材は右向きに飛んでいく絵のため、左向きの時だけ反転する
function drawBossFireballs() {
  if (!spriteBossFireballLoaded) return;
  const naturalW = spriteBossFireball.naturalWidth, naturalH = spriteBossFireball.naturalHeight;
  bossFireballs.forEach(fb => {
    const dispH = 38, dispW = dispH * naturalW / naturalH;
    const sx = fb.x - camX;
    const pulse = 1 + Math.sin(frame * 0.25) * 0.08; // 飛行中にわずかに拡大縮小させて生き生きとした印象にする
    ctx.save();
    ctx.translate(sx + fb.w/2, fb.y + fb.h/2);
    if (fb.facing === -1) ctx.scale(-1, 1);
    ctx.scale(pulse, pulse);
    ctx.drawImage(spriteBossFireball, -dispW/2, -dispH/2, dispW, dispH);
    ctx.restore();
  });
}

function updateHadoukens() {
  hadoukens.forEach(hd => {
    hd.x += hd.vx;
    hd.life--;
    if (frame % 3 === 0) spawnParticles(hd.x + hd.w/2, hd.y + hd.h/2, '#8fe8ff');

    // 雑魚敵との当たり判定(パンチ2発分のダメージ)。貫通させるため、命中しても消滅させず、
    // 同じ敵に二重ヒットしないよう命中済みリストで管理する
    for (const en of enemies) {
      if (en.dead || hd.hitEnemies.has(en)) continue;
      const enBox = { x: en.x, y: GROUND_Y-en.h+20, w: en.w, h: 40 };
      if (rectsOverlap(hd, enBox)) {
        en.hp -= 16; // 一撃必殺にならないよう抑えた威力(揮拳型20/踢腿型18のHPを一発では削りきれない)
        en.hitCooldown = 14;
        en.knockbackVx = hd.facing * 4; // 波動拳ヒットでも軽く押し出す(格擋ほど強くはしない、要望により1/3ほど減量)
        hd.hitEnemies.add(en);
        spawnImpactFlash(en.x+en.w/2, GROUND_Y-en.h/2);
        maybeSpawnHitText(en.x+en.w/2, GROUND_Y-en.h-30);
        if (en.hp <= 0 && !en.dead) {
          en.dead = true; en.deathTimer = 0; score += 100; enemiesDefeated++;
          registerComboKill();
          sfx.scream();
          spawnMangaText(DEFEAT_WORDS[Math.floor(Math.random()*DEFEAT_WORDS.length)], en.x+en.w/2, GROUND_Y-en.h-40, true);
        }
      }
    }
    // ボスとの当たり判定(パンチ2発分のダメージ)。貫通させるため命中しても消滅させず、
    // 同じ波動拳がボスに連続ヒットし続けないようフラグで一度だけに制限する
    if (boss && !boss.dead && !hd.hitBoss) {
      const bBox = { x: boss.x, y: GROUND_Y-boss.h+15, w: boss.w, h: 36 };
      if (rectsOverlap(hd, bBox)) {
        boss.hp -= 18; // 通常パンチ(6)の3倍相当
        boss.hitCooldown = 12;
        boss.knockbackVx = hd.facing * 4; // 雑魚敵と同様、波動拳ヒットで軽く後退させる
        hd.hitBoss = true;
        spawnImpactFlash(boss.x+boss.w/2, GROUND_Y-boss.h/2);
        sfx.bossHit();
        maybeSpawnHitText(boss.x+boss.w/2, GROUND_Y-boss.h-36);
        maybeTriggerBossEnrage();
        if (boss.hp <= 0) {
          boss.dead = true; boss.deathTimer = 0; score += 1000;
          playBossDeadSfx();
          spawnMangaText('轟!!', boss.x+boss.w/2, GROUND_Y-boss.h-45, true);
        }
      }
    }
  });
  hadoukens = hadoukens.filter(hd => !hd.hit && hd.life > 0 && hd.x > camX - 60 && hd.x < camX + W + 60);
}

function update() {
  if (state === 'dojoCountdown') { updateDojoCountdown(); return; }
  if (state === 'entering') { updateEntering(); return; }
  if (state === 'victoryDemo') { updateVictoryDemo(); return; }
  if (state !== 'playing') return;
  frame++;

  if (gameMode === 'dojo' && dojoFightTextTimer > 0) dojoFightTextTimer--;

  // 自動再生がブロックされた場合の保険:プレイ中は毎フレーム再生を試みる
  // (既に再生中なら playGameMusic 内で何もしない、停止していた場合のみ再開する)
  if (gameMode === 'dojo') {
    if (dojoThemeAudio.paused) playDojoMusic();
  } else {
    if (!bossSpawned && gameThemeAudio.paused) playGameMusic();
    if (bossSpawned && boss && !boss.dead && bossThemeAudio.paused) playBossMusic();
  }
  if (parryFlashTimer > 0) parryFlashTimer--;
  if (comboFlashTimer > 0) comboFlashTimer--;
  if (comboBreakTimer > 0) comboBreakTimer--;

  // ===== 制限時間のカウントダウン =====
  if (!player.dead && !player.pendingDeath && gameTimeFrames > 0) {
    gameTimeFrames--;
    // 残り10秒を切ったら、1秒ごとに警告音を鳴らす
    if (gameTimeFrames <= 600 && gameTimeFrames % 60 === 0 && gameTimeFrames > 0) {
      sfx.timeWarning();
    }
    if (gameTimeFrames <= 0) {
      gameTimeFrames = 0;
      if (gameMode === 'dojo') {
        triggerDojoStageClear(); // 武道場モードは時間切れまで生き残ればクリア扱いにする
      } else {
        // 時間切れ:残機を問答無用で0にし、通常の死亡演出を経て確実にGAME OVERへ向かわせる
        lives = 1;
        if (player.hp > 0) player.hp = 0;
      }
    }
  }

  if (gameMode === 'dojo') {
    dojoElapsedFrames++;
    if (!player.dead && enemies.length < dojoMaxEnemies()) {
      enemySpawnTimer--;
      if (enemySpawnTimer <= 0) {
        const type = Math.random() < 0.5 ? 'walker' : 'kicker';
        const spawnFromLeft = Math.random() < 0.5; // 武道場は固定画面なので、開始直後から左右どちらからも生成する
        const spawnX = spawnFromLeft ? -30 : W + 30;
        spawnEnemy(spawnX, type);
        enemySpawnTimer = dojoSpawnInterval() + Math.random() * 15;
      }
    }
  } else if (!bossSpawned && enemies.length < diffSettings().maxEnemies) {
    enemySpawnTimer--;
    if (enemySpawnTimer <= 0) {
      const type = Math.random() < 0.5 ? 'walker' : 'kicker';
      // ゲーム開始直後(まだ最初の画面分の距離を進んでいない間)は右側のみから出現させ、
      // 2画面目の距離まで進んでから左側からの出現も有効にする
      const allowLeftSpawn = camX >= W;
      const spawnFromLeft = allowLeftSpawn && Math.random() < 0.5;
      const spawnX = spawnFromLeft ? Math.max(20, camX - 40) : camX + W + 40;
      spawnEnemy(spawnX, type);
      const ds = diffSettings();
      enemySpawnTimer = ds.spawnMin + Math.random() * ds.spawnRange; // 難易度別の生成間隔
    }
  }
  if (gameMode !== 'dojo' && !bossSpawned && camX + W/2 > LEVEL_LENGTH - 400) {
    spawnBoss(LEVEL_LENGTH - 60);
    bossSpawned = true;
    enemies = []; // BOSS登場と同時に残っている小兵は退場させる(左右どちらから出現中だったものも含む)
    stopGameMusic();
    playBossMusic();
  }

  if (!player.dead) {
    if (player.pendingDeath) {
      // 空中で致命傷を受けた場合、その場で死亡演出に入らず、着地するまで落下を続ける
      player.vx = 0;
      player.vy += 0.45; player.y += player.vy;
      if (player.y >= 0) { player.y = 0; player.vy = 0; player.onGround = true; }
    } else if (player.hitStun > 0) {
      // 被弾による硬直中は操作を受け付けない(短時間のヒットストップ)
      player.hitStun--;
      player.vx = 0;
      player.vy += 0.45; player.y += player.vy;
      if (player.y >= 0) { player.y = 0; player.vy = 0; player.onGround = true; }
    } else {
    const speed = 2.6;
    const isCharging = player.attackType === 'hadoCharge'; // 波動拳の集気中は地上でその場から動けない
    if (isCharging) {
      player.ducking = false;
      // 地上では静止させるが、空中で集気に入った場合はジャンプの横移動速度をそのまま維持し、
      // 自然な放物線で落下させる(横移動を急停止させると垂直落下のような不自然な動きになるため)
      if (player.onGround) player.vx = 0;
      // 移動はできないが、左右キーで向きだけは変えられる
      if (keys['ArrowLeft']) player.facing = -1;
      else if (keys['ArrowRight']) player.facing = 1;
    } else if (player.parryTimer > 0) {
      // 格擋(パリィ)発動中はその場で静止する
      player.ducking = false;
      player.vx = 0;
    } else {
      player.ducking = keys['ArrowDown'] && player.onGround;
      // 地上で揮拳/踢腿を出している間は一時的に移動を禁止する(空中攻撃は対象外)
      const isGroundAttacking = player.onGround && !player.ducking &&
        (player.attackType === 'punch' || player.attackType === 'kick');
      if (player.ducking || isGroundAttacking) {
        player.vx = 0;
      } else {
        if (keys['ArrowLeft']) { player.vx = -speed; player.facing = -1; }
        else if (keys['ArrowRight']) { player.vx = speed; player.facing = 1; }
        else player.vx = 0;
      }
      const jumpKeyPressed = keys['ArrowUp'];
      if (jumpKeyPressed && !prevJumpKey && player.onGround) { player.vy = -8.5; player.onGround = false; sfx.jump(); }
      prevJumpKey = jumpKeyPressed;
    }

    player.vy += 0.45; player.y += player.vy;
    if (player.y >= 0) { player.y = 0; player.vy = 0; player.onGround = true; }
    player.x += player.vx;
    if (player.x < 20) player.x = 20;
    if (player.x > LEVEL_LENGTH - 20) player.x = LEVEL_LENGTH - 20;
    if (bossSpawned) {
      const leftEdge = camX + 10;
      const rightEdge = camX + W - player.w - 10;
      if (player.x < leftEdge) player.x = leftEdge;
      if (player.x > rightEdge) player.x = rightEdge;
    } // BOSS戦中は画面左右の端より外へ出られないようにする
    if (gameMode === 'dojo') {
      // 武道場モードは常に固定1画面に閉じ込める(左右へスクロールして逃げられない)
      if (player.x < 10) player.x = 10;
      if (player.x > W - player.w - 10) player.x = W - player.w - 10;
    }
    if (player.vx !== 0 && player.onGround) player.walkFrame += 0.2;

    if (player.attackTimer > 0) player.attackTimer--; else if (player.attackType !== 'hadoCharge') player.attackType = null;
    const zPressed = keys['KeyZ'], xPressed = keys['KeyX'];
    const zJustPressed = zPressed && !prevAttackKeyZ;
    const zJustReleased = !zPressed && prevAttackKeyZ;
    const xJustPressed = xPressed && !prevAttackKeyX;
    const canCharge = !player.ducking; // ジャンプ中(空中)でも集気時間としてカウントする(しゃがみ中のみ不可)

    if (!canCharge) {
      // しゃがみ中は波動拳を溜められないため、従来通り押した瞬間に素早いパンチを出す
      if (zJustPressed && player.attackTimer <= 0) { player.attackType='punch'; player.attackTimer=12; sfx.punch(); }
      if (player.chargeTimer >= CHARGE_POSE_FRAMES) stopHadoHold();
      player.chargeTimer = 0;
      player.fullChargeFxDone = false;
    } else if (zPressed && player.attackTimer <= 0) {
      // 波動拳のチャージ中(地上・空中ともに押しっぱなしで蓄積)
      player.chargeTimer++;
      // 揮拳キーを押しながら集気操作の条件を満たした瞬間から、青い光の粒子が
      // 内側に収束するエフェクトを出し、集気が始まっていることを即座にフィードバックする
      if (player.chargeTimer % 4 === 0) {
        spawnChargeSpark(player.x+player.w/2, GROUND_Y+player.y-player.h*0.55);
      }
      if (player.chargeTimer >= CHARGE_POSE_FRAMES) {
        player.attackType = 'hadoCharge';
        if (player.chargeTimer === CHARGE_POSE_FRAMES) playHadoHold(); // 集気状態に入った瞬間からループ再生開始
        if (player.chargeTimer >= CHARGE_FULL_FRAMES && !player.fullChargeFxDone) {
          player.fullChargeFxDone = true;
          spawnParticles(player.x+player.w/2, GROUND_Y+player.y-player.h*0.55, '#7CF5FF');
          spawnParticles(player.x+player.w/2, GROUND_Y+player.y-player.h*0.55, '#ffffff');
        }
      }
    } else if (zJustReleased) {
      if (player.chargeTimer >= CHARGE_POSE_FRAMES) stopHadoHold();
      if (player.chargeTimer >= CHARGE_POSE_FRAMES && player.attackTimer <= 0) {
        // 波動拳発射
        player.attackType = 'hadoRelease';
        player.attackTimer = 14;
        spawnHadouken();
        playHadoFly();
      } else if (player.attackTimer <= 0) {
        // 短押し:通常の素早いパンチ
        player.attackType = 'punch'; player.attackTimer = 12; sfx.punch();
      }
      player.chargeTimer = 0;
      player.fullChargeFxDone = false;
    } else if (!zPressed) {
      if (player.chargeTimer >= CHARGE_POSE_FRAMES) stopHadoHold();
      player.chargeTimer = 0;
      player.fullChargeFxDone = false;
    }

    if (xJustPressed && player.attackTimer <= 0) { player.attackType='kick'; player.attackTimer=18; sfx.kick(); }
    prevAttackKeyZ = zPressed;
    prevAttackKeyX = xPressed;
    }

    if (player.invuln > 0) player.invuln--;
    if (player.hitCooldown > 0) player.hitCooldown--;
    if (player.parryTimer > 0) player.parryTimer--;
    if (player.parryCooldown > 0) player.parryCooldown--;

    let targetCam = player.x - W / 2.5;
    targetCam = Math.max(0, Math.min(LEVEL_LENGTH - W, targetCam));
    if (bossSpawned) targetCam = LEVEL_LENGTH - W; // BOSS登場後は最終シーンに画面を固定し、捲き戻して逃げられないようにする
    if (gameMode === 'dojo') targetCam = 0; // 武道場モードは常に固定画面(スクロールしない)
    camX += (targetCam - camX) * 0.15;
  }

  let playerHitbox = null;
  const punchActive = player.attackType === 'punch' && player.attackTimer > 3 && player.attackTimer < 10;
  const kickActive = player.attackType === 'kick' && player.attackTimer > 4 && player.attackTimer < 12;
  if (punchActive || kickActive) {
    const reach = player.attackType === 'kick' ? 36 : 26; // 見た目の拳/脚の届く範囲に合わせて短縮
    playerHitbox = { x: player.facing===1 ? player.x+player.w : player.x-reach,
      y: GROUND_Y - player.h + (player.ducking?38:0) + 19, w: reach, h: 38 };
  }

  enemies.forEach(en => {
    if (en.dead) {
      en.deathTimer++;
      if (en.knockbackVx) { en.x += en.knockbackVx; en.knockbackVx *= 0.85; if (Math.abs(en.knockbackVx) < 0.3) en.knockbackVx = 0; }
      return;
    }
    const dx = player.x - en.x;
    // ある程度の遊び(デッドゾーン)を設けて、プレイヤーとの距離が近い時に
    // 向きが小刻みに反転してチラつく(左右反転して見える)のを防ぐ
    if (dx > 4) en.facing = 1;
    else if (dx < -4) en.facing = -1;
    const dist = Math.abs(dx);
    if (en.hitCooldown > 0) en.hitCooldown--;
    if (en.parried && en.hitCooldown <= 0) {
      // 被弾ポーズ+吹き飛びの演出が終わったところで、最後に死亡させる
      en.dead = true; en.deathTimer = 0; en.parried = false;
      return;
    }
    if (en.hitCooldown > 0) {
      if (en.parried || en.knockbackVx) {
        en.x += en.knockbackVx;
        en.knockbackVx *= 0.9;
        // 吹き飛んだ先に他の敵が重なっていたら、その敵も少し後退させて反撃の猶予を作る(格擋/波動拳どちらでも発生)
        if (Math.abs(en.knockbackVx) > 0.5) {
          const pushDir = en.knockbackVx > 0 ? 1 : -1;
          enemies.forEach(other => {
            if (other === en || other.dead) return;
            const overlap = en.x < other.x + other.w && en.x + en.w > other.x;
            if (overlap) other.x += pushDir * 5; // 後退量を強化(要望により増量)
          });
        }
      } // 格擋成功/波動拳ヒット時は被弾硬直中も水平に吹き飛ばす
      else en.vx = 0; // 通常の被弾硬直中は行動できない(短時間のヒットストップ)
    } else if (dist > 62) { en.state='approach'; en.vx = en.facing*(en.type==='kicker'?1.6:1.3); en.walkFrame += 0.18; }
    else {
      en.vx = 0; en.state = 'attack'; en.attackTimer++;
      if (en.attackTimer === 30) {
        const reach = 20; // 実際に拳/脚が届く範囲に合わせた近接判定(体格に対して過大だった距離判定を修正)
        const enAtkBox = { x: en.facing===1 ? en.x+en.w : en.x-reach, y: GROUND_Y-en.h+15, w: reach, h: 40 };
        const pBox = { x: player.x, y: GROUND_Y-player.h+15, w: player.w, h: 40 };
        const facingEnemy = (en.x >= player.x && player.facing === 1) || (en.x < player.x && player.facing === -1);
        if (rectsOverlap(enAtkBox, pBox) && player.parryTimer > 0 && facingEnemy && !en.dead) {
          // 格擋成功:まず被弾リアクションを見せてから吹き飛ばし、最後に死亡させる
          en.hp = 0;
          en.parried = true;
          en.hitCooldown = 20; // 被弾ポーズ+吹き飛び演出の時間
          en.knockbackVx = en.facing * -14; // 吹き飛ぶ距離を2倍に強化
          score += 150; enemiesDefeated++; registerComboKill(); // 格擋成功は通常撃破(100)の1.5倍のスコアを獲得
          spawnParrySuccessFx(player.x + player.w/2, GROUND_Y - player.h/2);
        } else if (rectsOverlap(enAtkBox, pBox) && player.invuln<=0 && !player.dead) {
          player.hp -= Math.round(5 * diffSettings().enemyDmgMul); player.invuln = 40; player.hitStun = 14; resetCombo(); sfx.hit();
          spawnParticles(player.x+player.w/2, GROUND_Y-player.h/2, '#ff4444');
        }
      }
      if (en.attackTimer > 55) en.attackTimer = 0;
    }
    en.x += en.vx;
    if (playerHitbox && en.hitCooldown <= 0) {
      const enBox = { x: en.x, y: GROUND_Y-en.h+20, w: en.w, h: 40 };
      if (rectsOverlap(playerHitbox, enBox)) {
        if (en.type === 'walker') {
          en.hp = 0; // 揮拳型小兵は揮拳/踢腿(空中攻撃含む)問わず一撃必殺
        } else {
          en.hp -= player.attackType === 'kick' ? 14 : 9;
        }
        en.hitCooldown = 14;
        spawnParticles(en.x+en.w/2, GROUND_Y-en.h/2, '#ffcc00');
        maybeSpawnHitText(en.x+en.w/2, GROUND_Y-en.h-40);
        if (en.hp <= 0) {
          en.dead = true; en.deathTimer = 0; score += 100; enemiesDefeated++;
          registerComboKill();
          sfx.scream();
          spawnMangaText(DEFEAT_WORDS[Math.floor(Math.random()*DEFEAT_WORDS.length)], en.x+en.w/2, GROUND_Y-en.h-40, true);
        } else sfx.hit();
      }
    }
  });
  // 死亡して演出が終わった敵に加え、追いつけず画面外はるか後方に置き去りにされた敵も
// 削除する(そのままだと同時出現数の上限を占有し続け、前方に新しい敵が出てこなくなるため)
  enemies = enemies.filter(en => !(en.dead && en.deathTimer > 30) && !(!en.dead && en.x < camX - 200));

  updateHadoukens();
  updateImpactFlashes();
  updateBossFireballs();

  if (boss) {
    if (!boss.dead) {
      const dx = player.x - boss.x;
      boss.facing = dx > 0 ? 1 : -1;
      const dist = Math.abs(dx);
      if (boss.hitCooldown > 0 && boss.y >= 0) boss.hitCooldown--; // 空中で被弾した場合は、落下し切るまで被弾硬直を維持する
      if (boss.specialCooldown > 0) boss.specialCooldown--;
      if (boss.jumpAttackCooldown > 0) boss.jumpAttackCooldown--;
      if (boss.spinAttackCooldown > 0) boss.spinAttackCooldown--;
      if (boss.jumpOverCooldown > 0) boss.jumpOverCooldown--;

      if (boss.hitCooldown > 0) {
        boss.vx = 0; // 被弾硬直中は行動できない(短時間のヒットストップ)
        if (boss.knockbackVx) { // 波動拳ヒット時は雑魚敵と同様に軽く後退させる
          boss.x += boss.knockbackVx;
          boss.knockbackVx *= 0.88;
          if (Math.abs(boss.knockbackVx) < 0.3) boss.knockbackVx = 0;
        }
        if (boss.y < 0) {
          // 空中(跳躍越え・跳躍攻撃・旋轉攻撃など)で被弾した場合、フラッシュするだけで宙に浮いたままにならないよう、
          // 重力で地面まで落下させてから通常状態へ復帰させる
          boss.hitFallVy = (boss.hitFallVy || 0) + 2.2;
          boss.y = Math.min(0, boss.y + boss.hitFallVy);
          if (boss.y >= 0) {
            boss.hitFallVy = 0;
            spawnParticles(boss.x+boss.w/2, GROUND_Y, '#cccccc', 5, 3); // 落下の着地エフェクト
            // 中断された空中技の状態を全てリセットし、次フレームから通常の地上行動に復帰させる
            boss.jumpOverTimer = 0;
            boss.jumpAttackTimer = 0; boss.jumpAttackHit = false;
            boss.spinAttackTimer = 0; boss.spinAttackHit = false; boss.spinAngle = 0; boss.spinReboundVx = 0; boss.spinReboundVy = 0;
            // 落下中に覚醒が発動した場合は、'enrageIntro'を上書きせずそのまま演出させる
            // (上書きすると覚醒の予備動作演出が飛ばされたまま、いきなり通常行動に戻ってしまう)
            if (boss.state !== 'enrageIntro') boss.state = dist > 90 ? 'approach' : 'attack';
          }
        }
      } else if (boss.state === 'enrageIntro') {
        // 覚醒演出:必殺技の予備動作(集気)ポーズを流用しつつ、炎の粒子を身体の周囲に散らす。
        // この演出中は攻撃も接近も行わず、終わったら通常の行動へ復帰する。
        boss.vx = 0;
        boss.enrageIntroTimer--;
        if (frame % 2 === 0) {
          const px = boss.x + boss.w/2 + (Math.random()-0.5)*boss.w*1.3;
          const py = GROUND_Y - boss.h*Math.random()*0.95;
          spawnParticles(px, py, Math.random() < 0.5 ? '#ff6622' : '#ffcc55', 4, 6);
        }
        if (boss.enrageIntroTimer <= 0) {
          boss.state = dist > 90 ? 'approach' : 'attack';
        }
      } else if (boss.state === 'special') {
        // 必殺技(火球):後退ジャンプ(2歩)で間合いを取る→予備動作(集気)→発動動作(気を放つ)を1~3回繰り返す→硬直の順に進行する
        boss.specialTimer++;
        const shotsTotal = boss.specialShotsTotal || 1;
        const BACKSTEP_LEN = 30; // 集気に入る前に後退ジャンプ2回分の間合いを取る演出
        const HOLD_F1_END = BACKSTEP_LEN + 15, HOLD_END = BACKSTEP_LEN + 90;
        const SHOT_LEN = 45; // 1回の発動動作(前進15+15+15)にかかるフレーム数
        const CAST_END = HOLD_END + SHOT_LEN * shotsTotal; // 全ての火球を撃ち終える時点
        const RECOVER_END = CAST_END + 30; // 最後の1回だけ収回動作(Frame2→Frame1)を行う
        if (boss.specialTimer <= BACKSTEP_LEN) {
          // 後退ジャンプ:sin波2周分でポン、ポンと2回跳ねながら下がる
          boss.vx = -boss.facing * 2.2;
          boss.walkFrame += 0.3;
          boss.y = -Math.abs(Math.sin((boss.specialTimer / BACKSTEP_LEN) * Math.PI * 2)) * 16;
        } else {
          boss.vx = 0;
          boss.y = 0;
        }
        if (boss.specialTimer === 1) {
          spawnMangaText('危險!!', boss.x+boss.w/2, GROUND_Y-boss.h-45, true);
        }
        if (boss.specialTimer === HOLD_F1_END) {
          spawnMangaText('危!', boss.x+boss.w/2, GROUND_Y-boss.h-45, true);
        }
        // 各火球はそれぞれの発動サイクルのFrame3が完了した瞬間に発射する
        const sinceHold = boss.specialTimer - HOLD_END;
        if (sinceHold > 0 && sinceHold % SHOT_LEN === 0 && sinceHold / SHOT_LEN <= shotsTotal) {
          spawnBossFireball();
          playBossFireballSfx();
        }
        if (boss.specialTimer > RECOVER_END) {
          boss.state = dist > 90 ? 'approach' : 'attack';
          boss.specialTimer = 0;
          boss.specialHit = false;
          boss.attackTimer = 0;
          boss.y = 0;
          // 次の必殺技までの間隔(難易度・覚醒状態で倍率をかける)
          boss.specialCooldown = boss.enraged
            ? (120 + Math.random()*80) * diffSettings().bossEnrageCooldownMul
            : (300 + Math.random()*180) * diffSettings().bossMoveCooldownMul;
        }
      } else if (boss.state === 'jumpAttack') {
        // 跳躍攻撃:中間距離から大きく踏み込んでジャンプキックを繰り出す
        boss.jumpAttackTimer++;
        const AIR_LEN = 26; // 滞空(踏み込み)時間
        const TOTAL_LEN = 42; // 着地硬直を含めた全体時間
        if (boss.jumpAttackTimer <= AIR_LEN) {
          boss.vx = boss.facing * (boss.enraged ? 5.2 : 4.2);
          boss.y = -Math.sin((boss.jumpAttackTimer / AIR_LEN) * Math.PI) * 42;
        } else {
          boss.vx = 0;
          boss.y = 0;
        }
        if (!boss.jumpAttackHit && boss.jumpAttackTimer <= AIR_LEN) {
          // 踏み込み距離が発動距離(110〜300px)に対して足りず、固定フレームでの判定だと
          // 空振りしやすかったため、滞空中は毎フレーム判定して踏み込みが届いた瞬間に命中させる
          const reach = 34; // 踏み込みが深い分、通常の近接攻撃より少し長めの判定にする
          const bossAtkBox = { x: boss.facing===1 ? boss.x+boss.w : boss.x-reach, y: GROUND_Y-boss.h+10, w: reach, h: 46 };
          const pBox = { x: player.x, y: GROUND_Y-player.h+15, w: player.w, h: 40 };
          if (rectsOverlap(bossAtkBox, pBox) && player.invuln<=0 && !player.dead) {
            player.hp -= Math.round(12 * diffSettings().bossDmgMul); player.invuln = 45; player.hitStun = 16; resetCombo(); sfx.hit();
            spawnParticles(player.x+player.w/2, GROUND_Y-player.h/2, '#ff4444');
            boss.jumpAttackHit = true;
          }
        }
        if (boss.jumpAttackTimer > TOTAL_LEN) {
          boss.state = dist > 90 ? 'approach' : 'attack';
          boss.jumpAttackTimer = 0;
          boss.jumpAttackHit = false;
          boss.y = 0;
          boss.jumpAttackCooldown = (240 + Math.random()*180) * diffSettings().bossMoveCooldownMul; // 次の跳躍攻撃までの間隔
        }
      } else if (boss.state === 'spinAttack') {
        // 旋轉攻撃:予備動作(原地回転→溜め静止)を経てから高速回転で突進し、命中した瞬間に斜め後方上空へ吹き飛ぶ。
        // 空中にいる間は回転を続け、着地した瞬間にだけ停止する。
        boss.spinAttackTimer++;
        const WINDUP_SPIN_LEN = 60; // 原地で回転しながら予備動作(約1秒)
        const WINDUP_PAUSE_LEN = 30; // 回転を止めて一瞬溜める(約0.5秒、発動を予告する)
        const WINDUP_END = WINDUP_SPIN_LEN + WINDUP_PAUSE_LEN;
        const DASH_LEN = 32; // 突進(回転)時間
        if (!boss.spinAttackHit) {
          if (boss.spinAttackTimer <= WINDUP_SPIN_LEN) {
            // 原地回転:まだ突進しない
            boss.vx = 0;
            boss.spinAngle += 0.7;
          } else if (boss.spinAttackTimer <= WINDUP_END) {
            // 回転を止めて一瞬静止(発動直前の溜め)
            boss.vx = 0;
          } else if (boss.spinAttackTimer <= WINDUP_END + DASH_LEN) {
            boss.vx = boss.facing * (boss.enraged ? 7.5 : 6);
            boss.spinAngle += 0.9; // 高速回転
            const reach = 26;
            // 修正前は判定幅がboss.w+reachでかつ本体の内側10pxから始まっていたため、
            // 見た目より遠くまで(前方に最大76px)判定が届いてしまっていた。
            // 本体の幅ぶんはそのままに、前方への食い込みはreach分だけに抑える。
            const bossAtkBox = { x: boss.facing===1 ? boss.x : boss.x-reach, y: GROUND_Y-boss.h+10, w: boss.w+reach, h: 50 };
            const pBox = { x: player.x, y: GROUND_Y-player.h+15, w: player.w, h: 40 };
            const facingBoss = (boss.x >= player.x && player.facing === 1) || (boss.x < player.x && player.facing === -1);
            if (rectsOverlap(bossAtkBox, pBox) && player.parryTimer > 0 && facingBoss) {
              // 格擋成功:突進を強制的に中断し、通常の被弾リアクション(hitCooldown)へ移行させて強めに弾き返す
              boss.hp -= 20; // 火球反射と同等(「2格」相当)のダメージ
              boss.hitCooldown = 20;
              boss.knockbackVx = -boss.facing * 10; // 通常の波動拳ヒットより強めに弾き返す
              boss.vx = 0;
              boss.spinAttackHit = false;
              boss.spinAttackTimer = 0;
              boss.spinAngle = 0;
              boss.state = dist > 90 ? 'approach' : 'attack';
              boss.spinAttackCooldown = (300 + Math.random()*200) * diffSettings().bossMoveCooldownMul;
              spawnParrySuccessFx(player.x + player.w/2, GROUND_Y - player.h/2);
              spawnImpactFlash(boss.x+boss.w/2, GROUND_Y-boss.h/2);
              sfx.bossHit();
              maybeSpawnHitText(boss.x+boss.w/2, GROUND_Y-boss.h-36);
              maybeTriggerBossEnrage();
              score += 200; // 格擋成功のボーナス
              if (boss.hp <= 0) {
                boss.dead = true; boss.deathTimer = 0; score += 1500;
                playBossDeadSfx();
                spawnMangaText('轟!!', boss.x+boss.w/2, GROUND_Y-boss.h-45, true);
              }
            } else if (rectsOverlap(bossAtkBox, pBox) && player.invuln<=0 && !player.dead) {
              player.hp -= Math.round(11 * diffSettings().bossDmgMul); player.invuln = 45; player.hitStun = 16; resetCombo(); sfx.hit();
              spawnParticles(player.x+player.w/2, GROUND_Y-player.h/2, '#ff4444');
              boss.spinAttackHit = true;
              boss.spinReboundVx = -boss.facing * 7; // 命中の反作用力で斜め後方へ吹き飛ぶ(遠めに)
              boss.spinReboundVy = -8; // 同時に斜め上方へ打ち上げる
            }
          } else {
            // 空振りした場合は反動なしでそのまま止まって行動へ復帰する
            boss.vx = 0;
            if (boss.spinAttackTimer > WINDUP_END + DASH_LEN + 10) {
              boss.state = dist > 90 ? 'approach' : 'attack';
              boss.spinAttackTimer = 0;
              boss.spinAngle = 0;
              boss.spinAttackCooldown = (300 + Math.random()*200) * diffSettings().bossMoveCooldownMul; // 次の旋轉攻撃までの間隔(約5~8.3秒)
            }
          }
        } else {
          // 命中後:重力で弧を描きながら吹き飛び、回転も継続する。着地した瞬間に全て停止する。
          boss.vx = 0; // x移動はここで直接扱うため、通常のvx加算は無効化する
          boss.spinReboundVy += 0.5; // 重力
          boss.x += boss.spinReboundVx;
          boss.y = Math.min(0, boss.y + boss.spinReboundVy);
          boss.spinReboundVx *= 0.97; // 水平方向はゆっくり減衰させ、遠くまで飛ばす
          boss.spinAngle += 0.9; // 着地するまで回転を続ける
          if (boss.y >= 0 && boss.spinReboundVy > 0) {
            // 着地:回転・移動ともに即座に停止する
            boss.y = 0;
            boss.state = dist > 90 ? 'approach' : 'attack';
            boss.spinAttackTimer = 0;
            boss.spinAttackHit = false;
            boss.spinAngle = 0;
            boss.spinReboundVx = 0;
            boss.spinReboundVy = 0;
            boss.spinAttackCooldown = (300 + Math.random()*200) * diffSettings().bossMoveCooldownMul; // 次の旋轉攻撃までの間隔(約5~8.3秒)
          }
        }
      } else if (boss.state === 'jumpOver') {
        // 位移用の跳躍:プレイヤーを飛び越えて反対側へ着地する(攻撃判定なし、単調な追いかけを崩すための動き)
        boss.vx = 0; // x移動はここで直接扱うため、通常のvx加算は無効化する
        boss.jumpOverTimer++;
        const ARC_LEN = 34;
        const t = Math.min(1, boss.jumpOverTimer / ARC_LEN);
        boss.x = boss.jumpOverStartX + (boss.jumpOverTargetX - boss.jumpOverStartX) * t;
        boss.y = -Math.sin(t * Math.PI) * 60; // プレイヤーを確実に飛び越えられるよう、跳躍攻撃より高めの弧にする
        if (boss.jumpOverTimer >= ARC_LEN) {
          boss.y = 0;
          spawnParticles(boss.x+boss.w/2, GROUND_Y, '#cccccc', 5, 3); // 着地の砂煙
          boss.state = dist > 90 ? 'approach' : 'attack';
          boss.jumpOverTimer = 0;
          boss.jumpOverCooldown = (400 + Math.random()*200) * diffSettings().bossMoveCooldownMul;
        }
      } else if (dist > 72) {
        if (boss.moveQuirkTimer > 0) {
          // 後退/一時停止の演出中:通常の追跡ロジックより優先する
          boss.moveQuirkTimer--;
          if (boss.moveQuirk === 'retreat') {
            boss.vx = -boss.facing * 0.9; boss.walkFrame += 0.15; boss.state = 'approach';
          } else {
            boss.vx = 0; boss.state = 'idle';
          }
          if (boss.moveQuirkTimer <= 0) boss.moveQuirk = null;
        } else {
          boss.vx = boss.facing*(boss.enraged ? diffSettings().bossEnragedApproachSpeed : diffSettings().bossApproachSpeed); boss.walkFrame += 0.15; boss.state='approach';
          // 単調にずっと追いかけるだけにならないよう、覚醒前はまれに後退/一時停止を挟む(覚醒後は攻勢一辺倒にする)
          if (!boss.enraged && Math.random() < 0.006 * diffSettings().bossQuirkMul) {
            boss.moveQuirk = Math.random() < 0.5 ? 'retreat' : 'pause';
            boss.moveQuirkTimer = boss.moveQuirk === 'pause' ? (30 + Math.random()*30) : (20 + Math.random()*20);
          }
        }
        // 接近中、間合いがある時ほど必殺技(噴火)をランダムに発動しやすくする(発動確率は難易度で倍率をかける)
        if (boss.specialCooldown <= 0 && dist < 420 && Math.random() < 0.012 * diffSettings().bossMoveTriggerMul) {
          boss.state = 'special'; boss.specialTimer = 0; boss.specialHit = false; boss.vx = 0;
          boss.specialShotsTotal = 1 + Math.floor(Math.random()*3); // 今回の必殺技で発射する火球の回数(1~3回ランダム)
          boss.moveQuirkTimer = 0; boss.moveQuirk = null; // 必殺技が割り込んだら後退/停止の演出は打ち切る
        } else if (boss.jumpAttackCooldown <= 0 && dist > 110 && dist < 175 && Math.random() < 0.01 * diffSettings().bossMoveTriggerMul) {
          // 中間距離から一気に踏み込むジャンプキック(通常時に踏み込みで実際に届く距離は最大でも約143pxのため、
          // 発動距離の上限をそれに合わせて300→175に短縮し、発動しても届かず空振りになるケースを大幅に減らす)
          boss.state = 'jumpAttack'; boss.jumpAttackTimer = 0; boss.jumpAttackHit = false; boss.vx = 0; boss.y = 0;
          boss.moveQuirkTimer = 0; boss.moveQuirk = null;
        } else if (boss.spinAttackCooldown <= 0 && dist > 150 && dist < 380 && Math.random() < 0.008 * diffSettings().bossMoveTriggerMul) {
          // やや長い間合いから高速回転しながら突進する
          boss.state = 'spinAttack'; boss.spinAttackTimer = 0; boss.spinAttackHit = false;
          boss.spinAngle = 0; boss.spinReboundVx = 0; boss.vx = 0;
          boss.moveQuirkTimer = 0; boss.moveQuirk = null;
        } else if (boss.jumpOverCooldown <= 0 && dist > 70 && dist < 220 && Math.random() < 0.006 * diffSettings().bossMoveTriggerMul) {
          // プレイヤーを飛び越えて反対側へ着地する(攻撃判定なし、単調な追いかけを崩すための位移)
          boss.state = 'jumpOver'; boss.jumpOverTimer = 0; boss.vx = 0;
          boss.jumpOverStartX = boss.x;
          const overshoot = 50 + Math.random()*20; // 着地後、プレイヤーとの間に少し距離を作る
          boss.jumpOverTargetX = boss.facing === 1 ? player.x + player.w + overshoot : player.x - overshoot - boss.w;
          boss.jumpOverTargetX = Math.max(camX + 30, Math.min(camX + W - boss.w - 30, boss.jumpOverTargetX));
          boss.moveQuirkTimer = 0; boss.moveQuirk = null;
        }
      } else {
        const enteringAttack = boss.state !== 'attack'; // 攻撃サイクルの開始時(新規/前回サイクル終了直後)だけパターンを選び直す
        boss.vx = 0; boss.state = 'attack'; boss.attackTimer++;
        if (enteringAttack) {
          boss.attackVariant = Math.random() < 0.5 ? 0 : 1; // 0=連打からの踢腿、1=素早い突き(パターンを固定させない)
        }
        const isQuickPunch = boss.attackVariant === 1;
        const hitFrame = isQuickPunch ? 18 : 35; // クイックパンチは判定が早く来る分、覚えにくくなる
        const cycleLen = isQuickPunch ? 45 : 65;
        if (boss.attackTimer === hitFrame) {
          const reach = 28; // 実際に拳/脚が届く範囲に合わせた近接判定(体格に対して過大だった距離判定を修正)
          const bossAtkBox = { x: boss.facing===1 ? boss.x+boss.w : boss.x-reach, y: GROUND_Y-boss.h+15, w: reach, h: 40 };
          const pBox = { x: player.x, y: GROUND_Y-player.h+15, w: player.w, h: 40 };
          if (rectsOverlap(bossAtkBox, pBox) && player.invuln<=0 && !player.dead) {
            player.hp -= Math.round(10 * diffSettings().bossDmgMul); player.invuln = 45; player.hitStun = 14; resetCombo(); sfx.hit();
            spawnParticles(player.x+player.w/2, GROUND_Y-player.h/2, '#ff4444');
          }
        }
        if (boss.attackTimer > cycleLen) {
          boss.attackTimer = 0;
          boss.attackVariant = Math.random() < 0.5 ? 0 : 1; // 次のサイクルも改めてランダムに選ぶ
        }
        // 近距離でもまれに必殺技を織り交ぜる
        if (boss.specialCooldown <= 0 && Math.random() < 0.004 * diffSettings().bossMoveTriggerMul) {
          boss.state = 'special'; boss.specialTimer = 0; boss.specialHit = false; boss.attackTimer = 0; boss.vx = 0;
        }
      }
      boss.x += boss.vx;
      // 予備動作の後退・各種突進/跳躍などで画面外まで出てしまわないよう、常に現在のカメラ範囲内に収める
      boss.x = Math.max(camX + 10, Math.min(camX + W - boss.w - 10, boss.x));
      if (playerHitbox && boss.hitCooldown <= 0) {
        const bBox = { x: boss.x, y: GROUND_Y-boss.h+15, w: boss.w, h: 36 };
        if (rectsOverlap(playerHitbox, bBox)) {
          boss.hp -= player.attackType === 'kick' ? 10 : 6;
          boss.hitCooldown = 12;
          spawnParticles(boss.x+boss.w/2, GROUND_Y-boss.h/2, '#ffcc00');
          sfx.bossHit();
          maybeSpawnHitText(boss.x+boss.w/2, GROUND_Y-boss.h-36);
          maybeTriggerBossEnrage();
          if (boss.hp <= 0) {
            boss.dead = true; boss.deathTimer = 0; score += 1000;
            playBossDeadSfx();
            spawnMangaText('轟!!', boss.x+boss.w/2, GROUND_Y-boss.h-45, true);
          }
        }
      }
    } else if (boss.y < 0) {
      // 空中(ジャンプ攻撃中など)で倒された場合、宙に浮いたまま死亡演出に入らないよう、
      // 着地するまでは重力で落下させるだけにして死亡タイマーは進めない
      boss.deathFallVy += 2.2;
      boss.y = Math.min(0, boss.y + boss.deathFallVy);
    } else {
      boss.y = 0;
      boss.deathTimer++;
      if (boss.deathTimer > 50 && state === 'playing') {
        state = 'victoryDemo'; demoTimer = 0; stopGameMusic(); stopBossMusic(); hadoukens = []; bossFireballs = []; playFxEnding();
        // BOSS撃破時、主人公がジャンプ中/攻撃中/しゃがみ中など何をしていても
        // 強制的に立ち状態へ戻してからエンディング演出の歩行に移らせる(空中で固まる不具合を防止)
        player.y = 0; player.vy = 0; player.onGround = true; player.ducking = false;
        player.attackType = null; player.attackTimer = 0; player.hitStun = 0; player.pendingDeath = false;
        player.parryTimer = 0; player.parryCooldown = 0; // パリィ硬直のまま演出に入って姿勢が固まるのを防ぐ
        player.chargeTimer = 0; player.fullChargeFxDone = false; stopHadoHold();
      }
    }
  }


  if (player.hp <= 0 && !player.dead && !player.pendingDeath) {
    if (player.onGround) { player.dead = true; player.deathTimer = 0; playPlayerDeadSfx(); stopHadoHold(); }
    else { player.pendingDeath = true; } // 空中の場合は着地するまで死亡演出を遅らせる
  }
  if (player.pendingDeath && player.onGround && !player.dead) {
    player.pendingDeath = false;
    player.dead = true; player.deathTimer = 0; playPlayerDeadSfx(); stopHadoHold();
  }
  if (player.dead) {
    player.deathTimer = (player.deathTimer||0) + 1;
    if (player.deathTimer > 60) {
      lives--;
      if (lives <= 0) {
        stopGameMusic(); stopBossMusic(); stopDojoMusic(); stopHadoHold(); hadoukens = []; playGameOverMusic();
        setPostGameInputUnlock(gameOverThemeAudio);
        state = 'gameover';
      }
      else { player.dead = false; player.hp = player.maxHp; player.invuln = 90; }
    }
  }

  particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.life--; });
  particles = particles.filter(p => p.life > 0);
  updateMangaTexts();
}

function updateVictoryDemo() {
  demoTimer++;
  particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.life--; });
  particles = particles.filter(p => p.life > 0);
  updateMangaTexts();
  updateHeartParticles();

  // 1) BOSS撃破後、主人公はまず画面中央まで強制的に歩き、右向きで待機する
  if (demoPhase === 'walkCenter') {
    const targetX = camX + W/2 - player.w/2;
    if (Math.abs(player.x - targetX) > 3) {
      player.vx = player.x < targetX ? 2 : -2;
      player.facing = player.vx > 0 ? 1 : -1; // 移動方向に合わせて向きを変える(逆走に見えるのを防ぐ)
      player.x += player.vx;
      player.walkFrame += 0.2;
    } else {
      player.x = targetX; player.vx = 0; player.attackType = null;
      player.facing = 1; // 中央に到着したら右向きで待機
      demoPhase = 'girlEnter'; demoPhaseTimer = 0;
      girlX = camX + W + 40; // 画面最右側の外から登場
    }
    return;
  }

  // 2) ヒロインが画面右側から歩いて登場し、少し手前で一旦立ち止まる
  if (demoPhase === 'girlEnter') {
    const stopX = player.x + 150; // 主人公から少し距離を置いた停止位置
    if (girlX > stopX) {
      girlX -= 1.3;
      girlWalkFrame += 0.15;
    } else {
      girlX = stopX; girlWalkFrame = 0;
      demoPhase = 'girlPause'; demoPhaseTimer = 0;
    }
    return;
  }

  // 3) その場でgirl_stand画像のまま1秒停止
  if (demoPhase === 'girlPause') {
    demoPhaseTimer++;
    if (demoPhaseTimer > 60) { demoPhase = 'girlApproach'; demoPhaseTimer = 0; }
    return;
  }

  // 4) ヒロインが主人公に向かって歩き続け、接触したら抱擁シーンへ
  if (demoPhase === 'girlApproach') {
    const huggingX = player.x + 40; // 「衝突」とみなす距離
    if (girlX > huggingX) {
      girlX -= 1.3;
      girlWalkFrame += 0.15;
    } else {
      girlX = huggingX;
      demoPhase = 'hug'; demoPhaseTimer = 0;
      sfx.win();
    }
    return;
  }

  // 5) 抱擁イラストを表示し、ハートのエフェクトを約3秒間演出
  if (demoPhase === 'hug') {
    demoPhaseTimer++;
    if (demoPhaseTimer % 18 === 0) spawnHeartParticle(player.x + player.w + 20, GROUND_Y - player.h - 30);
    // 6) 演出終了後にSTAGE CLEARへ
    if (demoPhaseTimer > 300) {
      stopFxEnding(); playStageClearMusic();
      setPostGameInputUnlock(clearThemeAudio);
      state = 'stageclear';
    }
    return;
  }
}

// エンディングの抱擁シーン中に画面上を漂うハートのバブル演出
let heartParticles = [];
function spawnHeartParticle(x, y) {
  heartParticles.push({
    x: x + (Math.random()-0.5)*20, y, vy: -0.6 - Math.random()*0.4,
    drift: (Math.random()-0.5)*0.6, life: 70, maxLife: 70, size: 10 + Math.random()*6,
  });
}
function updateHeartParticles() {
  heartParticles.forEach(h => { h.y += h.vy; h.x += h.drift; h.life--; });
  heartParticles = heartParticles.filter(h => h.life > 0);
}
function drawHeartParticles() {
  heartParticles.forEach(h => {
    const sx = h.x - camX;
    const alpha = Math.min(1, h.life / h.maxLife) * 0.9;
    const s = h.size * (0.6 + 0.4*(h.life/h.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff5d8f';
    ctx.beginPath();
    ctx.moveTo(sx, h.y + s*0.3);
    ctx.bezierCurveTo(sx, h.y, sx - s/2, h.y, sx - s/2, h.y + s*0.3);
    ctx.bezierCurveTo(sx - s/2, h.y + s*0.65, sx, h.y + s*0.9, sx, h.y + s*1.1);
    ctx.bezierCurveTo(sx, h.y + s*0.9, sx + s/2, h.y + s*0.65, sx + s/2, h.y + s*0.3);
    ctx.bezierCurveTo(sx + s/2, h.y, sx, h.y, sx, h.y + s*0.3);
    ctx.fill();
    ctx.restore();
  });
}

function spawnParticles(x, y, color, count = 6, size = 3) {
  for (let i=0;i<count;i++) particles.push({ x, y, vx:(Math.random()-0.5)*4, vy:-Math.random()*3, life:20, color, size });
}

let impactFlashes = []; // 波動拳の命中演出(拡散するリング状の光)用
function spawnImpactFlash(x, y) {
  impactFlashes.push({ x, y, timer: 16, maxTimer: 16 });
  // 通常のヒットより派手な火花を多色で追加発生させる
  spawnParticles(x, y, '#ffffff');
  spawnParticles(x, y, '#8fe8ff');
  spawnParticles(x, y, '#ffe066');
}
function updateImpactFlashes() {
  impactFlashes.forEach(f => f.timer--);
  impactFlashes = impactFlashes.filter(f => f.timer > 0);
}
function drawImpactFlashes() {
  impactFlashes.forEach(f => {
    const t = 1 - f.timer / f.maxTimer;
    const r = 6 + t * 34;
    const alpha = 1 - t;
    const sx = f.x - camX;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sx, f.y, r, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = `rgba(143,232,255,${alpha*0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, f.y, r*0.7, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  });
}

// 波動拳の集気中に、周囲から気が吸い寄せられるような小さな火花を発生させる
function spawnChargeSpark(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 24 + Math.random()*20;
  const sx = x + Math.cos(angle)*dist;
  const sy = y + Math.sin(angle)*dist*0.6;
  particles.push({ x: sx, y: sy, vx: (x-sx)/9, vy: (y-sy)/9, life: 14, color: Math.random()<0.5 ? '#7CF5FF' : '#ffffff' });
}

// ================= Drawing =================
// アップロードされた「風月客棧」イラストをタイル状に繰り返し描画してスクロール背景にする
function drawBackgroundImage() {
  // 夜空の下地(この上に月・雲→建物(空だけ透過)の順で重ねる)
  ctx.fillStyle = '#16223d';
  ctx.fillRect(0, 0, W, H);
  drawSkyOverlay();

  const imgW = bgImg.naturalWidth, imgH = bgImg.naturalHeight;
  const dispH = H;
  const dispW = dispH * imgW / imgH;
  let startX = (-camX) % dispW;
  if (startX > 0) startX -= dispW;
  for (let x = startX; x < W; x += dispW) {
    ctx.drawImage(bgImg, x, 0, dispW, dispH);
  }
}

// 月と雲を空の部分だけにクリップして重ね描き(建物より遅くスクロールさせて奥行きと
// スクロール感を出す)
function drawMoonGlyph(x, y, r) {
  ctx.save();
  const grad = ctx.createRadialGradient(x, y, r*0.5, x, y, r*2.3);
  grad.addColorStop(0, 'rgba(255,250,222,0.4)');
  grad.addColorStop(1, 'rgba(255,250,222,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, r*2.3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fdf6d8';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(206,196,156,0.55)';
  ctx.beginPath(); ctx.arc(x - r*0.3, y - r*0.2, r*0.18, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r*0.28, y + r*0.32, r*0.12, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - r*0.05, y + r*0.42, r*0.09, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
function drawCloudGlyph(x, y, scale) {
  ctx.fillStyle = 'rgba(255,255,255,0.24)';
  ctx.beginPath();
  ctx.ellipse(x, y, 22*scale, 8*scale, 0, 0, Math.PI*2);
  ctx.ellipse(x + 14*scale, y - 4*scale, 14*scale, 7*scale, 0, 0, Math.PI*2);
  ctx.ellipse(x - 14*scale, y - 2*scale, 12*scale, 6*scale, 0, 0, Math.PI*2);
  ctx.fill();
}
function drawSkyOverlay() {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, GROUND_Y);
  ctx.clip();

  const moonPeriod = 480;
  const moonOff = (-camX * 0.05) % moonPeriod;
  for (let i=-1; i<3; i++) {
    drawMoonGlyph(i*moonPeriod + moonOff + 500, 55, 20);
  }

  const cloudPeriod = 260;
  const cloudOff = (-camX * 0.13) % cloudPeriod;
  for (let i=-1; i<6; i++) {
    drawCloudGlyph(i*cloudPeriod + cloudOff + 80, 30 + (i%3)*20, 0.7 + (i%2)*0.3);
  }
  ctx.restore();
}

// 武道場モード専用:固定1枚背景をキャンバス全体にカバー表示する(スクロールしない)
function drawDojoBackground() {
  if (!dojoStageBgLoaded) { rect(0, 0, W, H, '#241a10'); return; }
  const img = dojoStageBg;
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}
function drawBackground() {
  if (state === 'menu' && menuScreen === 'modeSelect') {
    if (menuIndex === 1) { drawDojoBackground(); return; }
    // menuIndex===0(劇情模式)は下の日式庭園の背景へそのまま進む
  } else if (state === 'start' || gameMode === 'dojo') {
    drawDojoBackground();
    return;
  }
  if (bgImgLoaded) {
    drawBackgroundImage();
    return;
  }
  // 空(明るいグラデーション風・バンド分割)
  const bands = 6;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const r = Math.round(127 + (255-127)*t);
    const g = Math.round(199 + (224-199)*t);
    const b = Math.round(255 + (138-255)*t);
    rect(0, (i * (GROUND_Y)) / bands, W, GROUND_Y/bands + 1, `rgb(${r},${g},${b})`);
  }
  // 太陽の光条(漫画的な放射線)
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  const sunX = W*0.8 - camX*0.1, sunY = 40;
  for (let i=0;i<12;i++) {
    const ang = (i/12)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(sunX,sunY);
    ctx.lineTo(sunX+Math.cos(ang)*160, sunY+Math.sin(ang)*160);
    ctx.stroke();
  }
  ctx.restore();

  const roofOffset = -camX * 0.25;
  for (let i=-1;i<10;i++) {
    const x = i*200 + (roofOffset%200);
    rect(x, 20, 160, 10, PAL.roofTileDark);
    rect(x+6, 30, 148, 8, PAL.roofTile);
    for (let t=0;t<8;t++) rect(x+t*20, 18, 10, 6, PAL.roofTileDark);
  }

  const pillarOffset = -camX * 0.5;
  for (let i=-1;i<14;i++) {
    const x = i*100 + (pillarOffset%100);
    rect(x, 42, 14, GROUND_Y-42, PAL.wallWoodDark);
    rect(x+3, 42, 6, GROUND_Y-42, PAL.wallWood);
    rect(x-30, 60, 100, 8, PAL.wallWoodDark);
  }

  const wallOffset = -camX * 0.7;
  for (let i=-1;i<10;i++) {
    const x = i*220 + (wallOffset%220) + 60;
    rect(x, 80, 60, 70, PAL.windowFrame);
    for (let r=0;r<4;r++) rect(x+4, 84+r*16, 52, 3, PAL.lattice);
    for (let c=0;c<4;c++) rect(x+4+c*14, 84, 3, 62, PAL.lattice);
  }

  const signOffset = -camX * 0.5;
  for (let i=-1;i<6;i++) {
    const x = i*400 + (signOffset%400) + 200;
    rect(x-4, 30, 4, 40, '#2a1a0a');
    rect(x+40, 30, 4, 40, '#2a1a0a');
    rect(x-4, 30, 48, 26, PAL.signRed);
    ctx.fillStyle = PAL.signGold;
    ctx.font = 'bold 14px "Microsoft JhengHei","Heiti TC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('客棧', x+20, 48);
  }

  const farOffset = -camX * 0.3;
  for (let i=-1;i<10;i++) {
    const x = i*260 + (farOffset%260) + 130;
    rect(x, 55, 3, 16, '#3a2a1a');
    rect(x-7, 71, 17, 16, PAL.lantern);
    rect(x-5, 74, 13, 10, '#ffcf5c');
    rect(x-2, 87, 7, 6, '#cc3300');
  }

  rect(0, GROUND_Y, W, H-GROUND_Y, PAL.floorWood);
  rect(0, GROUND_Y, W, 6, '#f0c98a');
  const tileOffset = -camX % 50;
  for (let i=-1;i<16;i++) rect(i*50+tileOffset, GROUND_Y+6, 3, H-GROUND_Y-6, PAL.floorWoodDark);
}

// ローカル座標(すでに translate/scale 済み)用の簡易描画ヘルパー
function rectLocal(x,y,w,h,c) { ctx.fillStyle = c; ctx.fillRect(x,y,w,h); }
function rectLocalO(x,y,w,h,c) { ctx.fillStyle = PAL.outline; ctx.fillRect(x-1,y-1,w+2,h+2); ctx.fillStyle = c; ctx.fillRect(x,y,w,h); }

// 単一の連続したテーパー状リム(腕/脚)を描画。
// 関節の継ぎ目や別パーツの「先端ボール」を作らないことで、骨格が浮いて見える
// (揺れる提灯のような)問題を避け、胴体と一体化した1本の腕/脚に見せる。
// cuffColor/cuffAt: 手首・足首の白いリストバンド風の帯。isFoot: 靴底の白いラインを追加。
function drawLimb(originX, originY, angle, len, thickBase, thickTip, color, cuffColor, cuffAt, isFoot) {
  ctx.save();
  ctx.translate(originX, originY);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-4, -thickBase/2);           // 胴体側に少し食い込ませて隙間をなくす
  ctx.lineTo(len*0.6, -thickTip/2*0.95);
  ctx.lineTo(len, -thickTip/2);
  ctx.quadraticCurveTo(len+thickTip*0.4, 0, len, thickTip/2); // 拳/足先を丸く一体化
  ctx.lineTo(len*0.6, thickTip/2*0.95);
  ctx.lineTo(-4, thickBase/2);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = PAL.outline;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();

  if (cuffColor) {
    const t = cuffAt != null ? cuffAt : 0.72;
    const cx = len * t;
    const thickAtT = thickBase + (thickTip - thickBase) * t;
    ctx.fillStyle = PAL.outline;
    ctx.fillRect(cx - 3.5, -thickAtT/2 - 1, 7, thickAtT + 2);
    ctx.fillStyle = cuffColor;
    ctx.fillRect(cx - 2.5, -thickAtT/2, 5, thickAtT);
  }
  if (isFoot) {
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.ellipse(len - thickTip*0.15, thickTip*0.32, thickTip*0.55, thickTip*0.22, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

// atkProg: 0(通常)→1(攻撃の最大伸展)→0 と滑らかに変化する値。呼び出し側で計算する。
// airborne: true の場合、キック中は空中飛び蹴りのポーズになる。
// チビキャラ(頭身低め)デザイン:大きな頭、ノースリーブの服、黒いカンフーパンツ、
// 白いリストバンド・足首バンド、黒い靴に白いソール。
// プレイヤー専用:アップロードされた実写風スプライトで描画する。
// ducking(しゃがみ)は専用画像が無いため、立ちポーズを縦方向に軽く圧縮して近似する。
// 雑魚敵専用:アップロードされたスプライトで描画(歩き/パンチの2// エンディングで主人公の元へ歩いてくるヒロイン(女主角)の描画。素材は左向きのため、
// 敵/BOSSと同じ規則(-facing)でミラーリングする。
function drawGirlSprite(x, facing, walking, walkFrame) {
  if (!girlSpritesReady()) return;
  let img, sizeAdjust;
  if (walking) {
    const walkPhase = ((walkFrame % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
    if (walkPhase < Math.PI*0.5) img = girlSprites['walk1'];
    else if (walkPhase < Math.PI) img = girlSprites['walk2'];
    else if (walkPhase < Math.PI*1.5) img = girlSprites['walk3'];
    else img = girlSprites['walk2'];
    sizeAdjust = 0.85; // 歩行イラストは站立イラストより見た目が大きいため縮小補正
  } else {
    img = girlSprites['stand'];
    sizeAdjust = 0.85;
  }
  const sx = x - camX;
  const naturalW = img.naturalWidth || img.width, naturalH = img.naturalHeight || img.height;
  const dispH = 84 * 1.15 * sizeAdjust; // 主人公のh(84)と同じ基準スケールに揃える
  const dispW = dispH * naturalW / naturalH;
  const bob = walking ? Math.abs(Math.sin(walkFrame)) * -3 : 0;
  ctx.save();
  ctx.translate(sx + 22, GROUND_Y + bob);
  ctx.scale(-facing, 1);
  ctx.drawImage(img, -dispW/2, -dispH, dispW, dispH);
  ctx.restore();
}

// ポーズを切り替え)
function drawEnemySprite(x, y, w, h, facing, attacking, walkFrame, hurt, stunned, type) {
  drawGroundShadow(x + w/2, w);
  let img, sizeAdjust = 1;
  const isKicker = type === 'kicker' && kickerSpritesReady();
  if (stunned && isKicker && kickerHitLoaded) {
    // 踢腿型小兵専用の被弾リアクション画像
    img = kickerHit;
    sizeAdjust = 1.0;
  } else if (stunned && spriteZakoHitLoaded) {
    // 被弾硬直中は専用のヒットリアクション画像を表示
    img = spriteZakoHit;
    sizeAdjust = 1.0;
  } else if (attacking) {
    if (isKicker) {
      img = kickerAttack;
      sizeAdjust = 1.0; // 踢腿型専用の攻撃イラスト
    } else {
      img = enemySpritePunch;
      sizeAdjust = 0.85; // 揮拳イラストは他ポーズより大きく見えるため縮小補正
    }
  } else if (isKicker) {
    // 踢腿型小兵(白衣+紫ズボン)専用の歩行3コマ
    const walkPhase = ((walkFrame % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
    if (walkPhase < Math.PI*0.5) img = kickerWalk1;
    else if (walkPhase < Math.PI) img = kickerWalk2;
    else if (walkPhase < Math.PI*1.5) img = kickerWalk3;
    else img = kickerWalk2;
    sizeAdjust = 1.08;
  } else if (zakoWalkReady()) {
    // 3コマ(左足前→中間→右足前→中間)でなめらかに循環させる。
    // 中間(受け取った2枚目)の画像を「passing pose」として2回使うことで、
    // 両端の画像だけが極端に多く出て「跳ねているように見える」現象を防ぐ。
    const walkPhase = ((walkFrame % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
    if (walkPhase < Math.PI*0.5) img = zakoWalk1;
    else if (walkPhase < Math.PI) img = zakoWalk2;
    else if (walkPhase < Math.PI*1.5) img = zakoWalk3;
    else img = zakoWalk2;
    sizeAdjust = 1.08; // 新しい歩行イラストは元素材より縦横比が異なるため、他ポーズと見た目サイズを揃える補正
  } else {
    img = enemySpriteWalk; // 読み込み前のフォールバック
  }
  const sx = x - camX;
  const centerX = sx + w/2;
  const baseY = GROUND_Y + y;

  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  const dispH = h * 0.92 * sizeAdjust; // 主角の站立時とおおよそ同じ見た目サイズになるよう縮小
  const dispW = dispH * naturalW / naturalH;
  const bob = !attacking ? Math.abs(Math.sin(walkFrame)) * -1.5 : 0;
  const sway = !attacking ? Math.sin(walkFrame) * 0.045 : 0;

  ctx.save();
  if (hurt) ctx.globalAlpha = 0.5 + Math.sin(frame*0.8)*0.3;
  ctx.translate(centerX, baseY + bob);
  ctx.rotate(sway);
  ctx.scale(-facing, 1); // 素材は左向きに拳を出す絵のため、進行方向に合わせて反転させる
  ctx.drawImage(img, -dispW/2, -dispH, dispW, dispH);
  ctx.restore();
}

// ボス(師父)専用のスプライト描画。アップロードされた立ち絵/歩行/揮拳/突進/噴火/死亡の
// イラストをボスの状態(接近・近接攻撃・必殺技・撃破)に応じて切り替える。
function drawBossSprite(bossObj) {
  if (!allBossSpritesReady()) return;
  if (!bossObj.dead) drawGroundShadow(bossObj.x + bossObj.w/2, bossObj.w * 1.3);
  let img;
  let bob = 0, sway = 0;
  let sizeAdjust = 1;

  if (bossObj.dead) {
    img = bossSprites['death'];
  } else if (bossObj.hitCooldown > 0) {
    // 被弾硬直中は専用のヒットリアクション画像を表示
    img = bossSprites['hit'];
    sizeAdjust = 1.05;
  } else if (bossObj.state === 'enrageIntro') {
    // 覚醒演出:必殺技の予備動作(集気)ポーズを流用する
    // (待機ポーズ基準で計測し、hold2/hold3は素材の余白が大きい分サイズを引き上げて統一)
    const elapsed = 90 - bossObj.enrageIntroTimer;
    if (elapsed < 15) { img = bossSprites['hold1']; sizeAdjust = 1.14; }
    else if (Math.floor(frame/8)%2===0) { img = bossSprites['hold2']; sizeAdjust = 1.27; }
    else { img = bossSprites['hold3']; sizeAdjust = 1.35; }
  } else if (bossObj.state === 'special') {
    // 必殺技(火球):後退ジャンプ(2歩)→予備動作(集気)→発動動作(前進)を1~3回繰り返す→最後に発動動作(後退)の順にポーズを切り替える
    const t = bossObj.specialTimer;
    const shotsTotal = bossObj.specialShotsTotal || 1;
    const BACKSTEP_LEN = 30;
    const HOLD_END = BACKSTEP_LEN + 90, SHOT_LEN = 45;
    const CAST_END = HOLD_END + SHOT_LEN * shotsTotal;
    if (t <= BACKSTEP_LEN) {
      // 後退ジャンプ中:歩行モーションを流用して跳ねながら下がる足運びを表現
      const walkPhase = ((bossObj.walkFrame % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
      if (walkPhase < Math.PI*0.5) { img = bossSprites['walk1']; sizeAdjust = 1.44; }
      else if (walkPhase < Math.PI) { img = bossSprites['walk3']; sizeAdjust = 1.38; }
      else if (walkPhase < Math.PI*1.5) { img = bossSprites['walk2']; sizeAdjust = 1.42; }
      else { img = bossSprites['walk3']; sizeAdjust = 1.38; }
    }
    else if (t < BACKSTEP_LEN + 15) { img = bossSprites['hold1']; sizeAdjust = 1.14; }
    else if (t < HOLD_END) {
      if (Math.floor(t/8)%2===0) { img = bossSprites['hold2']; sizeAdjust = 1.27; }
      else { img = bossSprites['hold3']; sizeAdjust = 1.35; }
    }
    else if (t < CAST_END) {
      // 発動サイクル(前進のみ)をshotsTotal回繰り返す(待機ポーズ基準で計測し、余白差に合わせて個別補正)
      const rel = (t - HOLD_END) % SHOT_LEN;
      if (rel < 15) { img = bossSprites['cast1']; sizeAdjust = 1.19; }
      else if (rel < 30) { img = bossSprites['cast2']; sizeAdjust = 1.21; }
      else { img = bossSprites['cast3']; sizeAdjust = 1.21; }
    }
    else if (t < CAST_END + 15) { img = bossSprites['cast2']; sizeAdjust = 1.21; } // 最後の1回だけ収回動作
    else { img = bossSprites['cast1']; sizeAdjust = 1.19; }
  } else if (bossObj.state === 'jumpAttack') {
    // 跳躍攻撃:滞空中はジャンプキック専用イラスト、着地硬直はキック収回ポーズを流用
    // (待機ポーズ基準で計測し、素材ごとの余白差に合わせて個別補正)
    if (bossObj.jumpAttackTimer <= 26) { img = bossSprites['jumpKick']; sizeAdjust = 1.15; }
    else { img = bossSprites['kickBack']; sizeAdjust = 1.32; }
  } else if (bossObj.state === 'spinAttack') {
    // 旋轉攻撃:丸まった専用イラストを回転させる(sway に回転角を流用)
    img = bossSprites['spin'];
    sizeAdjust = 1.05;
    sway = bossObj.spinAngle;
  } else if (bossObj.state === 'jumpOver') {
    // 位移用の跳躍:プレイヤーを飛び越える専用イラスト(待機ポーズ基準で計測して統一)
    img = bossSprites['jumpOver'];
    sizeAdjust = 1.14;
  } else if (bossObj.state === 'attack') {
    if (bossObj.attackVariant === 1) {
      // クイックパンチ:構え→即座に突き出す→収回、キックより短く速いリズムにする
      // (待機ポーズ punchBack の見た目サイズを基準に統一。punchOut は素材の余白が少ない分、
      //  実際の身体サイズがpunchBackと揃うよう1.2→1.14へ補正)
      if (bossObj.attackTimer >= 24) { img = bossSprites['punchBack']; sizeAdjust = 1.15; }
      else if (bossObj.attackTimer >= 10) { img = bossSprites['punchOut']; sizeAdjust = 1.14; }
      else { img = bossSprites['punchBack']; sizeAdjust = 1.15; }
    } else {
      // 近接攻撃(標準):予備動作は連続ジャブ、20〜39は踢腿(キック)、40以降は踢腿収回(回復動作)
      // (待機ポーズ基準で計測し、キック系素材の余白差に合わせて1.2→1.32/1.29へ補正)
      if (bossObj.attackTimer >= 40) { img = bossSprites['kickBack']; sizeAdjust = 1.32; }
      else if (bossObj.attackTimer >= 20) { img = bossSprites['kickOut']; sizeAdjust = 1.29; }
      else if (Math.floor(frame/14)%2===0) { img = bossSprites['punchOut']; sizeAdjust = 1.14; }
      else { img = bossSprites['punchBack']; sizeAdjust = 1.15; }
    }
  } else if (bossObj.state === 'idle') {
    // 追跡の合間に一時停止する演出:専用の立ちポーズは使わず、パンチ収回ポーズを静止姿として流用する
    img = bossSprites['punchBack'];
    sizeAdjust = 1.15;
  } else {
    // 3コマ(左足前→中間→右足前→中間)でなめらかに循環させる。中間を2回使うことで自然な歩行に見せる。
    // 待機ポーズ(punchBack)の見た目サイズを基準に、歩行コマごとの素材の余白差に合わせて個別補正する
    // (1コマ共通の1.4だと、素材ごとの余白差が原因でコマ間・待機ポーズとの間でわずかな大きさのズレが出ていた)
    const walkPhase = ((bossObj.walkFrame % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
    if (walkPhase < Math.PI*0.5) { img = bossSprites['walk1']; sizeAdjust = 1.44; }
    else if (walkPhase < Math.PI) { img = bossSprites['walk3']; sizeAdjust = 1.38; }
    else if (walkPhase < Math.PI*1.5) { img = bossSprites['walk2']; sizeAdjust = 1.42; }
    else { img = bossSprites['walk3']; sizeAdjust = 1.38; }
    bob = Math.abs(Math.sin(bossObj.walkFrame)) * -2;
    sway = Math.sin(bossObj.walkFrame) * 0.03;
  }

  const sx = bossObj.x - camX;
  const centerX = sx + bossObj.w/2;
  const baseY = GROUND_Y + (bossObj.y || 0);

  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  const scaleMul = 1.35;
  const dispH = bossObj.dead ? bossObj.h * 0.7 * scaleMul : bossObj.h * scaleMul * sizeAdjust; // 倒れ絵は横長素材のため、他ポーズと視覚的な大きさを揃えるよう縮小補正
  const dispW = dispH * naturalW / naturalH;
  const deadYOffset = bossObj.dead ? 8 : 0; // 倒れ絵を確実に地面へ接地させるための微調整

  ctx.save();
  if (!bossObj.dead && bossObj.hitCooldown > 6) ctx.globalAlpha = 0.5 + Math.sin(frame*0.8)*0.3;
  if (bossObj.state === 'spinAttack') {
    // 丸まったポーズのため、足元ではなく胴体中心を軸に回転させる(向き反転は行わない=素材が円形で不要)
    ctx.translate(centerX, baseY - dispH/2);
    ctx.rotate(sway);
    ctx.drawImage(img, -dispW/2, -dispH/2, dispW, dispH);
  } else {
    ctx.translate(centerX, baseY + bob + deadYOffset);
    ctx.rotate(sway);
    ctx.scale(-bossObj.facing, 1); // 素材は左向きのイラストのため、進行方向に合わせて反転させる
    ctx.drawImage(img, -dispW/2, -dispH, dispW, dispH);
  }
  ctx.restore();
}

// 必殺技「噴火」の追加エフェクト:実際のダメージ判定範囲を視覚的に強調するため、
// ボスの向いている方向へ炎のグラデーションと火の粉を重ねて描画する。
function drawFireBreathEffect(bossObj) {
  const sx = bossObj.x - camX;
  const originX = bossObj.facing === 1 ? sx + bossObj.w : sx;
  const originY = GROUND_Y - bossObj.h + 30;
  const reach = 130; // 噴火イラストの実際の炎の長さに合わせた射程(ダメージ判定と統一)
  const dirX = bossObj.facing;
  const flicker = 0.75 + Math.sin(frame*1.3)*0.15;

  ctx.save();
  const grad = ctx.createLinearGradient(originX, originY, originX + dirX*reach, originY);
  grad.addColorStop(0, `rgba(255,240,180,${0.85*flicker})`);
  grad.addColorStop(0.35, `rgba(255,140,30,${0.7*flicker})`);
  grad.addColorStop(1, 'rgba(255,60,20,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  const h0 = 14, h1 = 46;
  ctx.moveTo(originX, originY - h0/2);
  ctx.lineTo(originX + dirX*reach, originY - h1/2);
  ctx.lineTo(originX + dirX*reach, originY + h1/2);
  ctx.lineTo(originX, originY + h0/2);
  ctx.closePath();
  ctx.fill();

  // 揺らめく炎の粒子と火の粉を多めに発生させる
  for (let i=0;i<2;i++) {
    const t = Math.random();
    const fx = originX + dirX*reach*t;
    const fy = originY + (Math.random()-0.5)*(h0 + (h1-h0)*t);
    spawnParticles(fx, fy, Math.random()<0.5 ? '#ffaa33' : '#ffe066');
  }
  if (frame % 4 === 0) {
    spawnParticles(originX + dirX*10, originY + (Math.random()-0.5)*16, '#fff2c0');
  }
  ctx.restore();
}

// 必殺技「噴火」の予備動作(約1.5秒)中に表示する警告演出:
// ボスの足元に赤いリングを表示し、発動が近づくほど点滅を速く・大きくする
function drawSpecialWarningAura(bossObj, progress) {
  const sx = bossObj.x - camX;
  const cx = sx + bossObj.w/2;
  const cy = GROUND_Y - 4;
  const pulseSpeed = 0.15 + progress*0.5; // 発動が近づくほど点滅が速くなる
  const pulse = 0.5 + Math.sin(frame*pulseSpeed) * 0.5;
  const radius = (bossObj.w*0.7) * (0.85 + progress*0.3);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(255,${60 - Math.round(30*progress)},30,${0.35 + 0.45*pulse})`;
  ctx.lineWidth = 3 + progress*3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius*0.32, 0, 0, Math.PI*2);
  ctx.stroke();

  // ボス本体にも赤い警告の明滅を重ねる
  const flashAlpha = (0.15 + 0.25*pulse) * (0.4 + progress*0.6);
  ctx.fillStyle = `rgba(255,60,30,${flashAlpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, GROUND_Y - bossObj.h*0.55, bossObj.w*0.6, bossObj.h*0.6, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}


function pickFlipFrame(vy) {
  // ジャンプ開始の勢いが強い間は跳躍の瞬間ポーズ、その後は宙返りの1~6コマを高度(速度)に応じて選ぶ
  if (vy < -7) return spriteJumpLift;
  const t = Math.max(0, Math.min(1, (vy + 7) / 14)); // -7(上昇)..+7(下降) -> 0..1
  const idx = Math.min(6, Math.max(1, Math.round(t * 5) + 1));
  return spriteFlipFrames[idx];
}

// 波動拳(飛行道具)の描画。素材は右向きに飛んでいく絵のため、
// 左向きに進む場合は反転させる。
// 波動拳の集気中、主人公の周りに気を漲らせる光のオーラを描画する。
// フルチャージに近づくほど・フルチャージ後は脈動が速く・明るくなる。
function drawChargeAura(px, py, progress, isFull) {
  const sx = px - camX;
  const pulse = isFull ? (0.75 + Math.sin(frame*0.55)*0.25) : (0.5 + Math.sin(frame*0.3)*0.2);
  const baseR = (18 + progress*20) * pulse + (isFull ? 6 : 0);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createRadialGradient(sx, py, 0, sx, py, baseR);
  grad.addColorStop(0, `rgba(255,255,255,${0.55*progress})`);
  grad.addColorStop(0.4, `rgba(124,245,255,${0.45*progress})`);
  grad.addColorStop(1, 'rgba(124,245,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(sx, py, baseR, 0, Math.PI*2);
  ctx.fill();

  // 上に立ち昇る光の筋(満タン時のみ、より派手に)
  if (isFull) {
    for (let i=0;i<3;i++) {
      const t = (frame*2 + i*40) % 120;
      const yy = py - t*0.7;
      const alpha = Math.max(0, 1 - t/120);
      ctx.fillStyle = `rgba(200,250,255,${alpha*0.5})`;
      ctx.fillRect(sx - 10 + i*8, yy, 2, 10);
    }
  }
  ctx.restore();
}

function drawHadoukens() {
  if (!spriteHadoWaveLoaded) return;
  const naturalW = spriteHadoWave.naturalWidth, naturalH = spriteHadoWave.naturalHeight;
  hadoukens.forEach(hd => {
    const dispH = 42, dispW = dispH * naturalW / naturalH;
    const sx = hd.x - camX;
    const pulse = 1 + Math.sin(frame * 0.25) * 0.08; // 飛行中にわずかに拡大縮小させて生き生きとした印象にする
    ctx.save();
    ctx.translate(sx + hd.w/2, hd.y + hd.h/2);
    if (hd.facing === -1) ctx.scale(-1, 1); // 素材は右向きの絵なので左向きの時だけ反転
    ctx.scale(pulse, pulse);
    ctx.drawImage(spriteHadoWave, -dispW/2, -dispH/2, dispW, dispH);
    ctx.restore();
  });
}

function drawPlayerSprite(x, y, w, h, facing, attackType, ducking, walkFrame, hurt, airborne, moving, vy, atkProg) {
  drawGroundShadow(x + w/2, w);
  let img = spriteStandIdle;
  let scaleMul = 1.15;

  if (attackType === 'hadoCharge') {
    img = spriteHado1;
  } else if (attackType === 'hadoRelease') {
    img = spriteHado2;
  } else if (ducking) {
    img = (attackType === 'punch') ? spriteDuckPunch : (attackType === 'kick') ? spriteDuckKick : spriteDuckIdle;
  } else if (airborne) {
    if (attackType === 'punch') img = spriteJumpPunch;
    else if (attackType === 'kick') img = spriteJumpKick;
    else img = pickFlipFrame(vy || 0);
  } else if (attackType === 'punch') {
    img = spritePunchStand;
  } else if (attackType === 'kick') {
    img = (atkProg !== undefined && atkProg < 0.5) ? spriteKickChamber : spriteKickOut;
  } else if (moving) {
    // 3コマ(左足前→中間→右足前→中間)でなめらかに循環させる
    const walkPhase = ((walkFrame % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
    if (walkPhase < Math.PI*0.5) img = spriteWalk1;
    else if (walkPhase < Math.PI) img = spriteWalk3;
    else if (walkPhase < Math.PI*1.5) img = spriteWalk2;
    else img = spriteWalk3;
  }

  const sx = x - camX;
  const centerX = sx + w/2;
  const baseY = GROUND_Y + y;

  // 各素材は縦横比の異なる別々のイラストなので、出力の高さを揃えるだけでは
  // ポーズによって体感サイズが不揃いに見えてしまう。目視確認のうえ、
  // 特に差が目立つポーズだけ個別に補正倍率をかけて見た目の大きさを揃える。
  const sizeAdjust = spriteSizeAdjustMap.get(img) || 1;

  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  const dispH = h * scaleMul * sizeAdjust;
  const dispW = dispH * naturalW / naturalH;

  const bob = (!ducking && !attackType && !airborne) ? Math.abs(Math.sin(walkFrame)) * -3 : 0;
  const yOffset = spriteYOffsetMap.get(img) || 0;

  ctx.save();
  if (hurt) ctx.globalAlpha = 0.5 + Math.sin(frame*0.8)*0.3;
  ctx.translate(centerX, baseY + bob + yOffset);
  ctx.scale(facing, 1);
  ctx.drawImage(img, -dispW/2, -dispH, dispW, dispH);
  ctx.restore();
}

function drawFighter(x, y, w, h, facing, colors, ducking, walkFrame, attackType, atkProg, hurt, airborne) {
  const sx = x - camX;
  const centerX = sx + w/2;
  const scaleV = ducking ? 0.75 : 1;
  const hipY = -h*0.28*scaleV;
  const shoulderY = -h*0.50*scaleV;
  const headCY = -h*0.76*scaleV;
  const headR = h*0.34;
  const legLen = h*0.24*scaleV, legTBase = Math.max(7, h*0.22), legTTip = Math.max(6, h*0.20);
  const armLen = h*0.21*scaleV, armTBase = Math.max(5, h*0.125), armTTip = Math.max(4, h*0.10);

  const skin = colors.skin, skinShade = colors.skinShade || colors.skin;
  const pants = colors.pants || '#1a1a1a', pantsShade = colors.pantsShade || '#0d0d0d';
  const cuff = colors.cuff || '#f2f2f2'; // 後方互換フォールバック
  const wristCuff = colors.wristCuff || cuff;
  const ankleCuff = colors.ankleCuff || cuff;

  ctx.save();
  if (hurt) ctx.globalAlpha = 0.5 + Math.sin(frame*0.8)*0.3;
  ctx.translate(centerX, GROUND_Y + y);
  ctx.scale(facing, 1);

  const walkSwing = Math.sin(walkFrame) * 0.4;
  const prog = Math.max(0, Math.min(1, atkProg || 0));
  const flying = attackType === 'kick' && airborne;

  if (flying) {
    // ---- 空中飛び蹴りポーズ(各肢を離れた角度に振り分けて自然な姿勢にする) ----
    const backLegAng  = lerp(1.9, 2.35, prog);   // 後ろ脚:後方へ流れる軸足
    const frontLegAng = lerp(-0.9, -0.05, prog); // 前脚:たたみ込みから水平の蹴りへ伸びる
    const frontArmAng = lerp(1.15, -1.5, prog);  // 前腕:ガードから顔の横へ引き上げる
    const backArmAng  = lerp(2.05, 2.6, prog);   // 後ろ腕:後方へ振り抜いてバランスを取る
    const torsoLean   = lerp(-0.05, -0.22, prog);

    drawLimb(-3, hipY, backLegAng, legLen*0.9, legTBase, legTTip, pantsShade, ankleCuff, 0.72, true);
    drawLimb(3, hipY, frontLegAng, legLen*1.15, legTBase, legTTip, pants, ankleCuff, 0.7, true);
    rectLocalO(-w*0.32, hipY-6, w*0.64, 7, colors.belt || '#c33');
    const torsoW = w*0.62, torsoTop = shoulderY - 4, torsoH = hipY - shoulderY;
    ctx.save();
    ctx.rotate(torsoLean); // 飛び蹴りで前傾する上半身
    rectLocalO(-torsoW/2, torsoTop, torsoW, torsoH, colors.shirt);
    rectLocal(-torsoW/2+2, torsoTop+2, torsoW*0.42, torsoH*0.4, colors.highlight || 'rgba(255,255,255,0.45)');
    ctx.restore();
    drawLimb(-torsoW*0.42, shoulderY, backArmAng, armLen*0.95, armTBase, armTTip, skinShade, wristCuff, 0.75);
    drawLimb(torsoW*0.42, shoulderY-4, frontArmAng, armLen*0.95, armTBase, armTTip, skin, wristCuff, 0.75);
  } else {
    // ---- 後ろ脚 ----
    drawLimb(-3, hipY, Math.PI/2 - 0.12 - (ducking?0:walkSwing*0.22), legLen, legTBase, legTTip, pantsShade, ankleCuff, 0.7, true);

    // ---- 前脚(地上キック時はここが伸びて連動する) ----
    let legAng = Math.PI/2 + 0.12 + (ducking?0:walkSwing*0.22);
    let legL = legLen;
    if (attackType === 'kick') {
      legAng = Math.PI/2 - Math.PI*0.65*prog;
      legL = legLen * (1 + 0.15*prog);
    }
    drawLimb(3, hipY, legAng, legL, legTBase, legTTip, pants, ankleCuff, 0.7, true);

    // ---- 帯(サッシュ) ----
    rectLocalO(-w*0.32, hipY-6, w*0.64, 7, colors.belt || '#c33');

    // ---- 胴体(ノースリーブのベスト、セル画風の2トーン) ----
    const torsoW = w*0.62, torsoTop = shoulderY, torsoH = hipY - shoulderY;
    rectLocalO(-torsoW/2, torsoTop, torsoW, torsoH, colors.shirt);
    rectLocal(-torsoW/2 + 2, torsoTop + 2, torsoW*0.42, torsoH*0.4, colors.highlight || 'rgba(255,255,255,0.45)');

    // ---- 後ろ腕(構え、素肌+リストバンド) ----
    drawLimb(-torsoW*0.42, shoulderY+3, 2.05, armLen*0.85, armTBase, armTTip, skinShade, wristCuff, 0.78);

    // ---- 前腕(パンチ時はここが伸びて連動する) ----
    let armAng = 1.15;
    let armL = armLen;
    if (attackType === 'punch') {
      armAng = 1.15 - 1.15*prog;
      armL = armLen * (1 + 0.2*prog);
    }
    drawLimb(torsoW*0.42, shoulderY+3, armAng, armL, armTBase, armTTip, skin, wristCuff, 0.78);
  }

  // ---- 頭(大きめのチビキャラヘッド) ----
  const headTiltA = flying ? -0.25 : 0;
  ctx.save();
  ctx.rotate(headTiltA);
  ctx.beginPath();
  ctx.fillStyle = PAL.outline;
  ctx.arc(0, headCY, headR+1.5, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = skin;
  ctx.arc(0, headCY, headR, 0, Math.PI*2);
  ctx.fill();

  // 耳(丸)
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(-headR*0.95, headCY+headR*0.12, headR*0.16, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR*0.95, headCY+headR*0.12, headR*0.16, 0, Math.PI*2); ctx.fill();

  // 髪(おかっぱ風ボウルカット)
  ctx.fillStyle = colors.hair || PAL.outline;
  ctx.beginPath();
  ctx.arc(0, headCY - headR*0.08, headR*1.05, Math.PI*1.03, Math.PI*1.97);
  ctx.closePath();
  ctx.fill();
  // 前髪の房(尖った剣山ギザギザに、下向きに垂れる)
  for (let i=-2;i<=2;i++) {
    const bx = i*headR*0.34;
    const topY = headCY - headR*0.34;
    const tipY = (i % 2 === 0) ? headCY - headR*0.02 : headCY - headR*0.16;
    ctx.beginPath();
    ctx.moveTo(bx-headR*0.18, topY);
    ctx.lineTo(bx+headR*0.18, topY);
    ctx.lineTo(bx, tipY);
    ctx.closePath();
    ctx.fill();
  }

  // 眉(両目ぶんの、キリッとつり上がった太い眉)
  ctx.strokeStyle = colors.hair || PAL.outline;
  ctx.lineWidth = headR*0.12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-headR*0.58, headCY-headR*0.20);
  ctx.lineTo(-headR*0.14, headCY-headR*0.32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headR*0.14, headCY-headR*0.32);
  ctx.lineTo(headR*0.58, headCY-headR*0.20);
  ctx.stroke();

  // 目(両目、丸くて力強い瞳)
  [-1, 1].forEach(side => {
    ctx.fillStyle = PAL.outline;
    ctx.beginPath(); ctx.arc(side*headR*0.34, headCY+headR*0.12, headR*0.14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(side*headR*0.34 + side*headR*0.045, headCY+headR*0.07, headR*0.045, 0, Math.PI*2); ctx.fill();
  });

  // 口(への字・気合の表情)
  ctx.strokeStyle = PAL.outline; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-headR*0.22, headCY + headR*0.55);
  ctx.lineTo(headR*0.22, headCY + headR*0.55);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawHealthBar(x, y, w, h, hp, maxHp, color) {
  rect(x, y, w, h, '#222');
  rect(x+2, y+2, (w-4)*Math.max(0,hp/maxHp), h-4, color);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
}

function draw() {
  drawInner();
  if (!assetsReady()) drawLoadingOverlay();
}
// 讀取中の場合、既存の描画ロジックを一切変更せず、その上に讀取畫面を重ねて表示する
// (素材が読み込み途中でチグハグな見た目になった背景が透けて見えないよう、不透明で完全に覆う)
function drawLoadingOverlay() {
  const pct = assetLoadTotal > 0 ? Math.min(100, Math.round(100 * assetLoadDone / assetLoadTotal)) : 0;
  ctx.save();
  ctx.fillStyle = '#101018';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px monospace';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1a1410';
  const label = `${t('loading')}... ${pct}%`;
  ctx.strokeText(label, W/2, H/2 - 4);
  ctx.fillStyle = '#ffdd33';
  ctx.fillText(label, W/2, H/2 - 4);

  const barW = 240, barH = 10, barX = W/2 - barW/2, barY = H/2 + 14;
  rect(barX, barY, barW, barH, '#2a241c');
  rect(barX, barY, barW * (pct/100), barH, '#ffdd33');
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.strokeRect(barX+0.5, barY+0.5, barW-1, barH-1);
  ctx.restore();
}
function drawInner() {
  drawBackground();

  if (state === 'start') { drawStart(); drawComicFrame(); return; }
  if (state === 'menu') { drawMenu(); drawComicFrame(); return; }
  if (state === 'story') { drawStory(); drawComicFrame(); return; }
  if (state === 'nameEntry') { drawNameEntry(); drawComicFrame(); return; }
  if (state === 'leaderboard') { drawLeaderboardScreen(); drawComicFrame(); return; }
  if (state === 'postGameChoice') { drawPostGameChoice(); drawComicFrame(); return; }

  drawBackgroundBushes(); // 遠景の植栽(キャラクターより手前には来ない)

  enemies.forEach(en => {
    const colors = en.type === 'walker'
      ? { shirt: PAL.enemy1, skin: PAL.skin, skinShade: PAL.skinShade, belt: '#1a2233', hair: '#151010', wristCuff: '#1c1c1c', ankleCuff: '#dfe6f5' }
      : { shirt: PAL.enemy2, skin: PAL.skin, skinShade: PAL.skinShade, belt: '#1a2233', hair: '#151010', wristCuff: '#1c1c1c', ankleCuff: '#efe0ff' };
    if (en.dead && spriteZakoDeadLoaded) {
      // 倒れ伏したイラストを、通常の立ち姿とほぼ同じ縮尺・地面(GROUND_Y)接地で描画
      const useKickerDead = en.type === 'kicker' && kickerDeadLoaded;
      const deadImg = useKickerDead ? kickerDead : spriteZakoDead;
      const sx = en.x - camX;
      const naturalW = deadImg.naturalWidth, naturalH = deadImg.naturalHeight;
      const dispH = en.h * 0.48;
      const dispW = dispH * naturalW / naturalH;
      const alpha = Math.min(1, en.deathTimer / 10);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(sx + en.w/2, GROUND_Y + 6);
      ctx.scale(-en.facing, 1);
      ctx.drawImage(deadImg, -dispW/2, -dispH, dispW, dispH);
      ctx.restore();
      return;
    }
    const scaleY = en.dead ? Math.max(0.1, 1 - en.deathTimer/30) : 1;
    ctx.save();
    if (en.dead) {
      ctx.translate(en.x-camX+en.w/2, GROUND_Y);
      ctx.scale(1, scaleY);
      ctx.translate(-(en.x-camX+en.w/2), -GROUND_Y);
    }
    const enAttacking = en.state === 'attack' && en.attackTimer > 25;
    if (enemySpritesReady()) {
      drawEnemySprite(en.x, 0, en.w, en.h, en.facing, enAttacking, en.walkFrame, en.hitCooldown>8, en.hitCooldown>0, en.type);
    } else {
      let enAtkProg = 0;
      if (enAttacking) enAtkProg = Math.sin(Math.PI * Math.min(1, (en.attackTimer-25)/25));
      drawFighter(en.x, 0, en.w, en.h, en.facing, colors, false, en.walkFrame,
        enAttacking ? 'punch' : null, enAtkProg, en.hitCooldown>8);
    }
    ctx.restore();
  });

  if (boss) {
    if (allBossSpritesReady()) {
      drawBossSprite(boss);
    } else {
      // 画像読み込み前のフォールバック(旧ベクター描画)
      const colors = { shirt: PAL.boss, skin: PAL.skin, skinShade: PAL.skinShade, belt: PAL.bossGold,
        hair: '#e8e8e8', wristCuff: '#1c1c1c', ankleCuff: '#ffe9a8', highlight: 'rgba(255,220,80,0.45)' };
      ctx.save();
      if (boss.dead) {
        const scaleY = Math.max(0.1, 1 - boss.deathTimer/40);
        ctx.translate(boss.x-camX+boss.w/2, GROUND_Y);
        ctx.scale(1, scaleY);
        ctx.translate(-(boss.x-camX+boss.w/2), -GROUND_Y);
      }
      let bossAtkProg = 0;
      const bossAttacking = boss.state === 'attack' && boss.attackTimer > 28;
      if (bossAttacking) bossAtkProg = Math.sin(Math.PI * Math.min(1, (boss.attackTimer-28)/(65-28)));
      drawFighter(boss.x, 0, boss.w, boss.h, boss.facing, colors, false, boss.walkFrame,
        bossAttacking ? 'kick' : null, bossAtkProg, boss.hitCooldown>6);
      ctx.restore();
    }
    if (!boss.dead) {
      drawHealthBar(W/2-150, 56, 300, 14, boss.hp, boss.maxHp, PAL.boss);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(t('bossLabel'), W/2, 54);
    }
  }

  const isHugScene = (state === 'victoryDemo' || state === 'stageclear') && demoPhase === 'hug';
  if (isHugScene && spriteHappyEndingLoaded) {
    // エンディングの抱擁シーン:主人公とヒロインを個別に描画せず、専用の合成イラストを表示する
    const img = spriteHappyEnding;
    const naturalW = img.naturalWidth, naturalH = img.naturalHeight;
    const dispH = player.h * 1.15 * 1.05;
    const dispW = dispH * naturalW / naturalH;
    const sx = player.x - camX;
    ctx.save();
    ctx.translate(sx + player.w/2 + dispW*0.18, GROUND_Y);
    ctx.drawImage(img, -dispW*0.5, -dispH, dispW, dispH);
    ctx.restore();
    drawHeartParticles();
  } else {
  const playerColors = { shirt: PAL.gi, skin: PAL.skin, skinShade: PAL.skinShade, hair: PAL.hair,
    belt: PAL.belt, wristCuff: '#1c1c1c', ankleCuff: '#e2e2e2', highlight: 'rgba(255,255,255,0.4)' };
  if (player.attackType === 'hadoCharge') {
    const progress = Math.min(1, (player.chargeTimer - CHARGE_POSE_FRAMES) / (CHARGE_FULL_FRAMES - CHARGE_POSE_FRAMES));
    const isFull = player.chargeTimer >= CHARGE_FULL_FRAMES;
    drawChargeAura(player.x + player.w/2, GROUND_Y + player.y - player.h*0.55, progress, isFull);
  }
  let playerAtkProg = 0;
  if (player.attackType === 'punch') playerAtkProg = Math.sin(Math.PI * (1 - player.attackTimer/12));
  else if (player.attackType === 'kick') playerAtkProg = Math.sin(Math.PI * (1 - player.attackTimer/18));
  const playerHurtFlash = player.invuln > 0 && frame % 6 < 3;
  if (player.dead && spritePlayerDeadLoaded) {
    // 倒れ伏したイラストを、通常の立ち姿とほぼ同じ縮尺・地面(GROUND_Y)接地で描画
    const sx = player.x - camX;
    const naturalW = spritePlayerDead.naturalWidth, naturalH = spritePlayerDead.naturalHeight;
    const dispH = player.h * 0.6;
    const dispW = dispH * naturalW / naturalH;
    const alpha = Math.min(1, (player.deathTimer||0) / 10);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sx + player.w/2, GROUND_Y + player.y + 6);
    ctx.scale(-player.facing, 1);
    ctx.drawImage(spritePlayerDead, -dispW/2, -dispH, dispW, dispH);
    ctx.restore();
  } else if (player.hitStun > 0 && spritePlayerHitLoaded) {
    // 被弾硬直中は専用のヒットリアクション画像を表示
    drawGroundShadow(player.x + player.w/2, player.w);
    const sx = player.x - camX;
    const naturalW = spritePlayerHit.naturalWidth, naturalH = spritePlayerHit.naturalHeight;
    const dispH = player.h * 1.15 * 0.9;
    const dispW = dispH * naturalW / naturalH;
    ctx.save();
    if (playerHurtFlash) ctx.globalAlpha = 0.5 + Math.sin(frame*0.8)*0.3;
    ctx.translate(sx + player.w/2, GROUND_Y + player.y);
    ctx.scale(-player.facing, 1);
    ctx.drawImage(spritePlayerHit, -dispW/2, -dispH, dispW, dispH);
    ctx.restore();
  } else if (player.parryTimer > 0 && spriteParryLoaded) {
    // 格擋(パリィ)の演出:出手前/収手中は構えポーズ、命中判定のある中間だけ本番の格擋ポーズを表示
    drawGroundShadow(player.x + player.w/2, player.w);
    const useReadyPose = (player.parryTimer > 10 || player.parryTimer <= 4) && spriteParryReadyLoaded;
    const img = useReadyPose ? spriteParryReady : spriteParry;
    const sx = player.x - camX;
    const naturalW = img.naturalWidth, naturalH = img.naturalHeight;
    const dispH = player.h * 1.15 * 0.82;
    const dispW = dispH * naturalW / naturalH;
    ctx.save();
    ctx.translate(sx + player.w/2, GROUND_Y + player.y);
    ctx.scale(player.facing, 1);
    ctx.drawImage(img, -dispW/2, -dispH, dispW, dispH);
    ctx.restore();
  } else if (allPlayerSpritesReady()) {
    drawPlayerSprite(player.x, player.y, player.w, player.h, player.facing,
      player.attackType, player.ducking, player.walkFrame, playerHurtFlash, !player.onGround, player.vx !== 0,
      player.vy, playerAtkProg);
  } else {
    drawFighter(player.x, player.y, player.w, player.h, player.facing, playerColors,
      player.ducking, player.walkFrame, player.attackType, playerAtkProg,
      playerHurtFlash, !player.onGround);
  }

  // エンディング演出:BOSS撃破後にヒロインが主人公の元へ歩いてくる
  if ((state === 'victoryDemo' || state === 'stageclear') && girlX !== null) {
    const girlWalking = state === 'victoryDemo' && (demoPhase === 'girlEnter' || demoPhase === 'girlApproach');
    drawGirlSprite(girlX, -1, girlWalking, girlWalkFrame);
  }
  }

  drawHadoukens();
  drawBossFireballs();
  drawImpactFlashes();

  particles.forEach(p => { const s = p.size || 3; rect(p.x-camX, p.y, s, s, p.color); });
  drawMangaTexts();
  drawForegroundBushes();

  drawHUD();
  drawGameTimer();
  drawParryFlash();
  if (gameMode === 'dojo') drawDojoCountdownOverlay();

  if (state === 'gameover') drawGameOverScreen();
  if (state === 'stageclear') drawStageClearOverlay();
  if (state === 'paused') drawPauseOverlay();

  drawComicFrame();
}

// 制限時間の残りを[分]:[秒]のデジタル時計で画面中央上部に表示する。
// 残り10秒を切ると赤く点滅させ、警告として目立たせる。
function drawGameTimer() {
  const totalSeconds = Math.ceil(gameTimeFrames / 60);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  const text = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  const isWarning = gameTimeFrames <= 600 && gameTimeFrames > 0;
  const flash = isWarning && Math.floor(frame/10) % 2 === 0;

  const bw = 118, bh = 34, bx = W/2 - bw/2, by = 14;
  ctx.save();
  ctx.fillStyle = flash ? 'rgba(200,20,20,0.9)' : 'rgba(0,0,0,0.55)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = flash ? '#ffdd33' : '#777';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx+0.5, by+0.5, bw-1, bh-1);

  ctx.textAlign = 'center';
  ctx.font = 'bold 26px monospace';
  ctx.fillStyle = flash ? '#fff' : (isWarning ? '#ff5555' : '#ffdd33');
  ctx.fillText(text, W/2, by + bh - 8);
  ctx.restore();
}

function drawHUD() {
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#1a1410';
  ctx.fillText(t('scoreLabel'), 12, 22);
  ctx.fillStyle = '#fff';
  ctx.fillText(t('scoreLabel'), 10, 20);
  ctx.fillStyle = '#ffdd33';
  ctx.font = 'bold 22px monospace';
  ctx.lineWidth = 3; ctx.strokeStyle = '#1a1410';
  ctx.strokeText(String(score).padStart(6,'0'), 10, 46);
  ctx.fillText(String(score).padStart(6,'0'), 10, 46);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(t('hpLabel'), 10, 74);
  const segCount = 20, segW = 6, segGap = 1.4, segH = 22;
  const hitsLeft = Math.ceil(player.hp / (player.maxHp/segCount));
  const hpBarY = 60;
  for (let i=0;i<segCount;i++) {
    const segX = 40 + i*(segW+segGap);
    const filled = i < hitsLeft;
    const col = filled ? (hitsLeft<=6 ? '#ff3d3d' : '#3ddc3d') : '#333';
    rect(segX, hpBarY, segW, segH, col);
  }
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.strokeRect(39.5, hpBarY-0.5, segCount*(segW+segGap), segH+1);

  // 波動拳の集気状況バー(HPバーの下、左上に配置):現在どれだけ溜まっているかを表示
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(t('chargeLabel'), 10, 100);
  const chargeBarW = segCount * (segW + segGap), chargeBarH = 12, chargeBarY = 90;
  const chargeAmount = player.chargeTimer || 0;
  const chargeProgress = Math.min(1, chargeAmount / CHARGE_FULL_FRAMES);
  const chargeIsFull = chargeAmount >= CHARGE_FULL_FRAMES;
  rect(40, chargeBarY, chargeBarW, chargeBarH, '#222');
  if (chargeProgress > 0) {
    const fillColor = chargeIsFull ? (frame % 10 < 5 ? '#fff176' : '#ffe066') : '#4fd8ff';
    rect(40, chargeBarY, chargeBarW * chargeProgress, chargeBarH, fillColor);
  }
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.strokeRect(39.5, chargeBarY-0.5, chargeBarW, chargeBarH+1);

  // 残機表示:「現在場上にいる1機」を含めた総数がlivesになるよう、
  // アイコンは予備の(lives-1)機分だけ表示する(現在の1機は既にプレイヤーとして画面に出ているため)
  if (lifeIconImgLoaded) {
    const iconH = 55, iconW = iconH * (lifeIconImg.naturalWidth / lifeIconImg.naturalHeight);
    for (let i=0;i<lives-1;i++) {
      ctx.drawImage(lifeIconImg, W-10-iconW-(i*(iconW+6)), 4, iconW, iconH);
    }
  } else {
    for (let i=0;i<lives-1;i++) { rect(W-20-i*18, 10, 10, 14, '#ffdddd'); rect(W-20-i*18, 8, 10, 4, PAL.hair); }
  }

  // COMBO表示:2連続撃破から表示を開始し、被弾で途切れると「破碎」演出とともに消える(残機アイコンの下、画面右上に配置)
  if (comboCount >= 2 || comboBreakTimer > 0) {
    const breaking = comboBreakTimer > 0;
    const displayCount = breaking ? comboBreakValue : comboCount;
    const tierColor = breaking ? '#e24b4a' : COMBO_TIER_COLORS[comboTier(displayCount)];
    const comboPulse = comboFlashTimer > 0 ? 1 + (comboFlashTimer / 45) * 0.45 : 1;
    const breakProgress = breaking ? 1 - comboBreakTimer / 30 : 0; // 0→1で下に落ちながらフェードアウト

    ctx.save();
    ctx.textAlign = 'right';
    ctx.globalAlpha = breaking ? Math.max(0, 1 - breakProgress) : 1;
    ctx.translate(W - 10, 94 + breakProgress * 18);
    ctx.scale(comboPulse, comboPulse);
    ctx.font = 'bold 22px monospace';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1a1410';
    const label = 'COMBO x' + displayCount;
    ctx.strokeText(label, 0, 0);
    ctx.fillStyle = tierColor;
    ctx.fillText(label, 0, 0);
    ctx.restore();

    if (!breaking) {
      // 常駐ゲージ:連續数が伸びるほど満ちていく(15連續で満タン)
      const gaugeW = 96, gaugeH = 6;
      const gaugeProgress = Math.min(1, displayCount / 15);
      rect(W - 10 - gaugeW, 100, gaugeW, gaugeH, '#2a241c');
      rect(W - 10 - gaugeW, 100, gaugeW * gaugeProgress, gaugeH, tierColor);
    }
  }

  const progress = Math.min(1, camX/(LEVEL_LENGTH-W));
  rect(W/2-100, H-14, 200, 6, '#222');
  rect(W/2-100, H-14, 200*progress, 6, '#3dc8ff');
}

// ===== ゲームメニュー描画 =====
function drawMenuPanelBg() {
  ctx.fillStyle = 'rgba(10,8,6,0.82)';
  ctx.fillRect(0, 0, W, H);
}
function drawMenuTitle(text) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px monospace';
  ctx.lineWidth = 4; ctx.strokeStyle = '#1a1410';
  ctx.strokeText(text, W/2, 56);
  ctx.fillStyle = '#ffdd33';
  ctx.fillText(text, W/2, 56);
}
function drawMenuList(items, selectedIndex, startY, lineH) {
  ctx.textAlign = 'center';
  items.forEach((label, i) => {
    const y = startY + i * lineH;
    const selected = i === selectedIndex;
    ctx.font = selected ? 'bold 20px monospace' : '18px monospace';
    if (selected) {
      const flash = frame % 20 < 10;
      ctx.fillStyle = flash ? '#ffffff' : '#ffdd33';
      ctx.fillText('▶ ' + label + ' ◀', W/2, y);
    } else {
      ctx.fillStyle = '#cccccc';
      ctx.fillText(label, W/2, y);
    }
  });
}
function drawMenuNavHint() {
  ctx.textAlign = 'center';
  ctx.font = '12px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText(t('nameEntryHint'), W/2, H - 16);
}
function drawMenu() {
  drawMenuPanelBg();
  if (menuScreen === 'main') drawMenuMain();
  else if (menuScreen === 'modeSelect') drawMenuModeSelect();
  else if (menuScreen === 'difficulty') drawMenuDifficulty();
  else if (menuScreen === 'settings') drawMenuSettings();
  else if (menuScreen === 'controls') drawMenuControls();
  else if (menuScreen === 'help') drawMenuHelp();
  else if (menuScreen === 'language') drawMenuLanguage();
  else if (menuScreen === 'credits') drawMenuCredits();
  else if (menuScreen === 'history') drawMenuHistorySelect();
  else if (menuScreen === 'historyArticle') drawMenuHistory();
}
function drawMenuMain() {
  drawMenuTitle('功夫之拳');
  const items = [t('menuStart'), t('menuSettings'), t('menuHelp'), t('menuLang'), t('menuLeaderboard'), t('menuCredit'), t('menuHistory')];
  drawMenuList(items, menuIndex, 98, 30);
  drawMenuNavHint();
}
function drawVolumeBar(x, y, w, h, value) {
  rect(x, y, w, h, '#333');
  const fillW = w * (value/10);
  rect(x, y, fillW, h, '#4fd8ff');
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x-0.5, y-0.5, w+1, h+1);
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(String(value), x + w + 12, y + h - 2);
}
function drawMenuSettings() {
  drawMenuTitle(t('settingsTitle'));
  ctx.textAlign = 'left';
  const rows = [
    { label: t('settingsMusic') },
    { label: t('settingsSfx') },
    { label: t('settingsControl') },
    { label: t('settingsScale') },
    { label: t('settingsKeyBind') },
  ];
  const startY = 110, lineH = 50, labelX = 130, barX = 280, barW = 220;
  rows.forEach((row, i) => {
    const y = startY + i * lineH;
    const selected = i === menuIndex;
    ctx.font = selected ? 'bold 18px monospace' : '16px monospace';
    ctx.fillStyle = selected ? '#ffdd33' : '#ddd';
    ctx.fillText((selected ? '▶ ' : '   ') + row.label, labelX, y);
    if (i === 0) drawVolumeBar(barX, y-16, barW, 18, musicVolume);
    else if (i === 1) drawVolumeBar(barX, y-16, barW, 18, sfxVolume);
    else if (i === 2) {
      const modeLabel = controlModeOverride === 'auto' ? t('controlAuto')
        : controlModeOverride === 'keyboard' ? t('controlKeyboard') : t('controlGamepad');
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#4fd8ff';
      ctx.fillText('◀ ' + modeLabel + ' ▶', barX, y);
    } else if (i === 3) {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#4fd8ff';
      ctx.fillText('◀ x' + displayScale + ' ▶', barX, y);
    }
  });
  drawMenuNavHint();
}
// ===== [控制]画面:プレイキーのカスタム割り当て =====
function drawMenuControls() {
  drawMenuTitle(t('settingsKeyBind'));
  ctx.textAlign = 'left';
  const showGamepadRows = gamepadConnected;
  const kbRows = [
    { label: t('bindMove'), display: keyLabelDisplay(keyBindings.left) + '/' + keyLabelDisplay(keyBindings.right) },
    { label: t('helpPunch'), display: keyLabelDisplay(keyBindings.punch) },
    { label: t('helpJump'), display: keyLabelDisplay(keyBindings.jump) },
    { label: t('helpKick'), display: keyLabelDisplay(keyBindings.kick) },
    { label: t('helpDuck'), display: keyLabelDisplay(keyBindings.duck) },
    { label: t('helpParry'), display: keyLabelDisplay(keyBindings.parry) },
  ];
  const gpRows = [
    { label: t('helpPunch'), display: gamepadBtnLabel('punch') },
    { label: t('helpKick'), display: gamepadBtnLabel('kick') },
    { label: t('helpParry'), display: gamepadBtnLabel('parry') },
  ];
  const rows = showGamepadRows ? gpRows : kbRows;
  const resetIndex = rows.length;
  const labelX = 90, keyX = 340, lineH = 24;
  let y = 80;
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#4fd8ff';
  ctx.fillText(showGamepadRows ? ('\ud83c\udfae ' + t('bindGamepadSection')) : ('\u2328 ' + t('bindKeyboardSection')), labelX, y);
  y += lineH + 8;
  rows.forEach((row, i) => {
    const selected = i === menuIndex;
    ctx.font = selected ? 'bold 15px monospace' : '14px monospace';
    ctx.fillStyle = selected ? '#ffdd33' : '#ddd';
    ctx.fillText((selected ? '\u25b6 ' : '   ') + row.label, labelX, y);
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#4fd8ff';
    ctx.fillText(row.display, keyX, y);
    y += lineH;
  });
  y += 12;
  const resetSelected = menuIndex === resetIndex;
  ctx.font = resetSelected ? 'bold 15px monospace' : '14px monospace';
  ctx.fillStyle = resetSelected ? '#ffdd33' : '#ddd';
  ctx.fillText((resetSelected ? '\u25b6 ' : '   ') + t('bindReset'), labelX, y);

  ctx.textAlign = 'center';
  ctx.font = '11px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText(t('bindHint'), W/2, H - 30);
  ctx.fillText('Enter / Esc: ' + t('back'), W/2, H - 14);

  if (awaitingKeyBind || awaitingGamepadBind) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffdd33';
    const action = awaitingKeyBind || awaitingGamepadBind;
    const promptLabel = action === 'left' ? t('bindMoveLeft')
      : action === 'right' ? t('bindMoveRight')
      : t(ACTION_LABEL_KEYS[action]);
    ctx.fillText(tf('bindWaiting', promptLabel), W/2, H/2 - 10);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(t('bindCancelHint'), W/2, H/2 + 20);
    if (keyCaptureWarning) {
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#ff5555';
      const msg = keyCaptureWarning.reserved ? t('bindReserved') : tf('bindConflict', t(ACTION_LABEL_KEYS[keyCaptureWarning.action]));
      ctx.fillText(msg, W/2, H/2 + 48);
      keyCaptureWarning.timer--;
      if (keyCaptureWarning.timer <= 0) keyCaptureWarning = null;
    }
  }
}
// キーコード(例: 'KeyJ','Space','ArrowLeft')を画面表示用の短い文字列に変換する

function keyLabelDisplay(code) {
  if (!code) return '?';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Space') return 'SPACE';
  if (code.startsWith('Arrow')) return code.slice(5).toUpperCase();
  return code;
}
// ゲームパッドのボタン表示ラベル:デフォルトのままなら見慣れた記号(X/A/Y or □/✕/△)、
// カスタマイズ済みならボタン番号(#N)で表示する
// 標準ゲームパッド配列のボタン番号→表示名(Xbox/PlayStationそれぞれ)
const GAMEPAD_BUTTON_NAMES_XBOX = {
  0: 'A', 1: 'B', 2: 'X', 3: 'Y',
  4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
  8: 'SELECT', 9: 'START', 10: 'L3', 11: 'R3',
  12: 'UP', 13: 'DOWN', 14: 'LEFT', 15: 'RIGHT', 16: 'HOME',
};
const GAMEPAD_BUTTON_NAMES_PS = {
  0: '✕', 1: '○', 2: '□', 3: '△',
  4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
  8: 'SHARE', 9: 'OPTIONS', 10: 'L3', 11: 'R3',
  12: 'UP', 13: 'DOWN', 14: 'LEFT', 15: 'RIGHT', 16: 'PS',
};
// SELECT/START/L3/R3(左右スティック押し込み)はシステム用として再割当て対象から除外する
const RESERVED_GAMEPAD_BUTTONS = [8, 9, 10, 11];
function gamepadButtonName(idx) {
  const table = gamepadIsPlayStation ? GAMEPAD_BUTTON_NAMES_PS : GAMEPAD_BUTTON_NAMES_XBOX;
  return table[idx] !== undefined ? table[idx] : ('#' + idx);
}
function gamepadBtnLabel(action) {
  return gamepadButtonName(gamepadBindings[action]);
}
function drawMenuHelpRow(img, label, desc, keyLabel, colX, y) {
  const iconH = 46;
  const iconCenterX = colX + 32;
  if (img && img.complete && img.naturalWidth) {
    const iconW = iconH * (img.naturalWidth/img.naturalHeight);
    ctx.drawImage(img, iconCenterX - iconW/2, y - iconH + 8, iconW, iconH);
  }
  const textX = colX + 68;
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#ffdd33';
  ctx.fillText(`[${keyLabel}] ${label}`, textX, y - 14);
  ctx.font = '11px monospace';
  ctx.fillStyle = '#ddd';
  ctx.fillText(desc, textX, y + 4);
}
function drawMenuHelp() {
  drawMenuTitle(t('helpTitle'));
  const gpPunch = gamepadBtnLabel('punch');
  const gpKick = gamepadBtnLabel('kick');
  const gpParry = gamepadBtnLabel('parry');
  const K = c => keyLabelDisplay(c);
  const rows = [
    { img: spriteWalk1, label: t('helpMove'), desc: t('helpMoveDesc'), key: K(keyBindings.left) + '/' + K(keyBindings.right) },
    { img: spriteJumpKick, label: t('helpJump'), desc: t('helpJumpDesc'), key: K(keyBindings.jump) + '/SPACE' },
    { img: spriteDuckIdle, label: t('helpDuck'), desc: t('helpDuckDesc'), key: K(keyBindings.duck) },
    { img: spritePunchStand, label: t('helpPunch'), desc: t('helpPunchDesc'), key: K(keyBindings.punch) + '/' + gpPunch },
    { img: spriteKickOut, label: t('helpKick'), desc: t('helpKickDesc'), key: K(keyBindings.kick) + '/' + gpKick },
    { img: spriteHado1, label: t('helpCharge'), desc: t('helpChargeDesc'), key: t('helpChargeKey') },
    { img: spriteParry, label: t('helpParry'), desc: t('helpParryDesc'), key: K(keyBindings.parry) + '/' + gpParry },
  ];
  const startY = 95, lineH = 68;
  const colLeftX = 20, colRightX = 370;
  rows.forEach((row, i) => {
    const col = i < 4 ? colLeftX : colRightX;
    const rowInCol = i < 4 ? i : i - 4;
    drawMenuHelpRow(row.img, row.label, row.desc, row.key, col, startY + rowInCol * lineH);
  });
  ctx.textAlign = 'center';
  ctx.font = '12px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('Enter / Esc: ' + t('back'), W/2, H - 16);
}
function drawMenuModeSelect() {
  drawMenuTitle(t('modeSelectTitle'));
  const items = [t('modeStory'), t('modeDojo')];
  drawMenuList(items, menuIndex, 130, 46);
  ctx.textAlign = 'center';
  ctx.font = '12px monospace';
  ctx.fillStyle = '#aaa';
  const descs = [t('modeStoryDesc'), t('modeDojoDesc')];
  ctx.fillText(descs[menuIndex] || '', W/2, 246);
  drawMenuNavHint();
}
function drawMenuDifficulty() {
  drawMenuTitle(t('difficultyTitle'));
  const items = [t('difficultyEasy'), t('difficultyNormal'), t('difficultyHard')];
  drawMenuList(items, menuIndex, 120, 42);
  ctx.textAlign = 'center';
  ctx.font = '12px monospace';
  ctx.fillStyle = '#aaa';
  const descs = [t('difficultyEasyDesc'), t('difficultyNormalDesc'), t('difficultyHardDesc')];
  ctx.fillText(descs[menuIndex] || '', W/2, 262);
  drawMenuNavHint();
}
function drawMenuLanguage() {
  drawMenuTitle(t('langTitle'));
  const items = [t('langZh'), t('langJa'), t('langEn')];
  drawMenuList(items, menuIndex, 140, 42);
  drawMenuNavHint();
}
// ===== 「了解歷史」(横スクロールアクションゲームの歴史)画面 =====
const HISTORY_CONTENT_ZH = [
  { type: 'title', text: '橫捲軸動作遊戲歷史' },
  { type: 'para', text: '橫捲軸動作遊戲（Side-scrolling Action Games）是電子遊戲史上最古老且最經典的類型之一，其發展史見證了硬體技術的突破、關卡設計理念的革新，以及從街機、家用主機到獨立遊戲復興的漫長演變。' },
  { type: 'heading', text: '◎黎明與技術突破（1980年代初）' },
  { type: 'para', text: '擺脫單一螢幕的束縛。在 1980 年代之前，受限於硬體效能，所有遊戲畫面都是「單一版面」（固定螢幕），玩家每通過一個畫面，系統就必須擦除並重新繪製下一個畫面，缺乏空間上的連續感。' },
  { type: 'heading', text: '◎世界第一款捲軸遊戲' },
  { type: 'para', text: '1980 年由尤金．賈維斯（Eugene Jarvis）開發的街機遊戲《Defender》，首次導入了多屏捲軸技術。玩家控制的戰機可以上下左右自由移動，畫面背景也會隨之滾動，這讓遊戲世界不再受限於單一螢幕的寬度。' },
  { type: 'heading', text: '◎清版動作的開端' },
  { type: 'para', text: '1984 年的《成龍踢館》（Kung-Fu Master）誕生，開創了玩家徒手或使用近戰武器擊敗大量敵人的「清版動作遊戲（Beat \'em up）」先河。' },
  { type: 'heading', text: '◎黃金時代（1980年代中—1990年代初）' },
  { type: 'para', text: '經典與流派的誕生。隨著任天堂 NES（紅白機）和各式街機硬體的普及，設計師的重心從單純追求「高分數」轉向追求「關卡體驗」，橫捲軸遊戲迎來了爆發期。' },
  { type: 'heading', text: '◎平台跳躍的標桿' },
  { type: 'para', text: '1985 年任天堂推出《超級瑪利歐兄弟》（Super Mario Bros.），完美的物理跳躍手感、隱藏要素與無縫的關卡設計，定義了橫捲軸平台動作遊戲的標準。' },
  { type: 'heading', text: '◎多元流派齊放' },
  { type: 'para', text: '硬派動作射擊：如《魂斗羅》（Contra）與《洛克人》（Mega Man），將橫向捲軸與高難度的射擊、動作元素完美結合。立體景深清版動作：1986 年的《熱血系列》首創了具有前、後、上、下 3 軸景深移動的「帶狀捲軸」；隨後 1987 年的《雙截龍》（Double Dragon）奠定了城市黑幫主題與雙打模式。速度感的極致：1991 年世嘉（SEGA）推出《音速小子》（Sonic the Hedgehog），以極致的流暢度與高速前進的捲軸技術成為世嘉的招牌。街機全盛期：1989 至 1990 年代初，CAPCOM 的《街頭快打》（Final Fight）、《吞食天地》等作將多人合作與近身格鬥推向巔峰。' },
  { type: 'heading', text: '◎三維衝擊與類型融合（1990年代中—2000年代）' },
  { type: 'para', text: '2D 的低谷與質變。1990 年代中期，隨著 PlayStation 和 Sega Saturn 的問世，遊戲界迎來了 3D 革命。傳統的 2D 橫捲軸遊戲因被視為「過時」而逐漸邊緣化，逼迫該類型進行質變與融合。' },
  { type: 'heading', text: '◎類銀河惡魔城（Metroidvania）的誕生' },
  { type: 'para', text: '1997 年，《惡魔城X 月下夜想曲》（Castlevania: Symphony of the Night）將《銀河戰士》（Metroid）的非線性地圖探索，與角色的等級、裝備、RPG 培育系統完美融合。這種重視探索與解謎的橫捲軸新流派，成為日後不可磨滅的經典。' },
  { type: 'heading', text: '◎網路遊戲化（2000年代中）' },
  { type: 'para', text: '橫捲軸動作遊戲在線上遊戲（MMORPG）領域找到新藍海。2005 年由韓國開發的《地下城與勇士》（DNF）大獲成功，證明了橫捲軸經典的格鬥與清版節奏在網路時代依然極具吸引力。' },
  { type: 'heading', text: '◎獨立遊戲的文藝復興（2010年代至今）' },
  { type: 'para', text: '藝術與創意的殿堂。雖然主流 3A 大作已多轉向 3D 開放世界，但受惠於 Steam 等數位商店的興起與群眾募資的成熟，橫捲軸動作遊戲在獨立遊戲（Indie Games）領域迎來了全面復興。' },
  { type: 'heading', text: '◎畫面與情感的雙重饗宴' },
  { type: 'para', text: '《奧日與黑暗森林》（Ori and the Blind Forest）和《空洞騎士》（Hollow Knight）以絕美的美術風格、宏大的世界觀與極高的操作上限，將類銀河惡魔城類型推向新高度。復古與硬核重組：《茶杯頭》（Cuphead）採用 1930 年代手繪復古卡通風搭配硬核 Boss 戰；而《死亡細胞》（Dead Cells）則將橫捲軸動作與 Roguelike 機制（隨機關卡與永久死亡）結合，開創了「Roguevania」的新風潮。' },
  { type: 'para', text: '橫捲軸動作遊戲雖然歷經了超過 40 年的演變，但其獨特的「舞台劇式視角」、純粹的動作反饋以及層次分明的關卡設計，使其至今依然散發著歷久不衰的獨特魅力。' },
];
const HISTORY_CONTENT_JA = [
  { type: 'title', text: '横スクロールアクションゲームの歴史' },
  { type: 'para', text: '横スクロールアクションゲーム（Side-scrolling Action Games）は、電子ゲーム史上、最も古く、かつ最も代表的なジャンルの一つである。その発展の歴史は、ハードウェア技術の飛躍、ステージデザインの革新、そしてアーケード、家庭用ゲーム機からインディーゲームの復興に至るまで、長い進化の過程を物語っている。' },
  { type: 'heading', text: '◎黎明期と技術革新（1980年代初頭）' },
  { type: 'para', text: '一画面の制約からの脱却。1980年代以前は、ハードウェアの性能に制約があったため、ゲーム画面はすべて「一画面（固定画面）」で構成されていた。プレイヤーが一つの画面をクリアするたびに、システムは画面を消去して次の画面を描き直す必要があり、空間的な連続性に乏しかった。' },
  { type: 'heading', text: '◎世界初のスクロールゲーム' },
  { type: 'para', text: '1980年、ユージン・ジャーヴィス（Eugene Jarvis）が開発したアーケードゲーム『Defender』は、初めてマルチスクロール技術を導入した作品である。プレイヤーが操作する戦闘機は上下左右に自由に移動でき、それに合わせて背景もスクロールする。これにより、ゲーム世界は一つの画面の横幅という制約から解放された。' },
  { type: 'heading', text: '◎ベルトスクロールアクションの幕開け' },
  { type: 'para', text: '1984年には『スパルタンX』（Kung-Fu Master）が登場し、プレイヤーが素手や近接武器を使って大量の敵を倒していく「ベルトスクロールアクション（Beat \'em up）」の先駆けとなった。' },
  { type: 'heading', text: '◎黄金時代（1980年代中期～1990年代初頭）' },
  { type: 'para', text: '名作と多様なジャンルの誕生。任天堂のNES（ファミリーコンピュータ）や、さまざまなアーケード筐体の普及に伴い、ゲームデザイナーたちの関心は、単純に「高得点」を追求することから、「ステージ体験」を重視する方向へと移っていった。こうして、横スクロールゲームは一大ブームを迎えることになる。' },
  { type: 'heading', text: '◎横スクロールアクションの金字塔' },
  { type: 'para', text: '1985年、任天堂は『スーパーマリオブラザーズ』（Super Mario Bros.）を発売した。優れたジャンプの物理感覚、隠し要素、そして継ぎ目のないステージデザインによって、横スクロールプラットフォームアクションゲームの基準を確立した。' },
  { type: 'heading', text: '◎多彩なジャンルが開花' },
  { type: 'para', text: 'ハードコアなアクションシューティング：『魂斗羅』（Contra）や『ロックマン』（Mega Man）は、横スクロールと高難度のシューティング、アクション要素を見事に融合させた。立体的な奥行きを持つベルトスクロールアクション：1986年の『熱血シリーズ』は、前後・上下への移動を取り入れた「ベルトスクロールアクション」の先駆的作品となった。その後、1987年の『ダブルドラゴン』（Double Dragon）が、都市のギャングを題材とした世界観と2人協力プレイを確立した。スピード感の極致：1991年、セガ（SEGA）は『ソニック・ザ・ヘッジホッグ』（Sonic the Hedgehog）を発売。極めて滑らかな操作感と高速スクロールによって、セガを代表する看板タイトルとなった。アーケード全盛期：1989年から1990年代初頭にかけて、CAPCOMの『ファイナルファイト』（Final Fight）や『天地を喰らう』などの作品が、多人協力プレイと近接格闘アクションを頂点へと押し上げた。' },
  { type: 'heading', text: '◎3Dの衝撃とジャンル融合（1990年代中期～2000年代）' },
  { type: 'para', text: '2Dの低迷と進化。1990年代半ば、PlayStationやセガサターンの登場に伴い、ゲーム業界は3D革命を迎えた。従来の2D横スクロールゲームは「時代遅れ」とみなされ、徐々に主流から外れていった。その結果、このジャンルは生き残るために、大きな変化と他ジャンルとの融合を迫られることになった。' },
  { type: 'heading', text: '◎メトロイドヴァニアの誕生' },
  { type: 'para', text: '1997年、『悪魔城ドラキュラX 月下の夜想曲』（Castlevania: Symphony of the Night）は、『メトロイド』（Metroid）の非線形マップ探索と、キャラクターのレベルアップ、装備、RPG的な育成システムを見事に融合させた。探索と謎解きを重視したこの新たな横スクロールゲームのスタイルは、後に「メトロイドヴァニア（Metroidvania）」と呼ばれ、現在に至るまで色褪せることのない名ジャンルとなった。' },
  { type: 'heading', text: '◎オンラインゲーム化（2000年代中期）' },
  { type: 'para', text: '横スクロールアクションゲームは、オンラインゲーム（MMORPG）の分野で新たな可能性を見いだした。2005年、韓国で開発された『アラド戦記』（Dungeon Fighter Online／DNF）が大成功を収め、横スクロールならではの格闘アクションとベルトスクロールアクションのテンポが、オンライン時代においても非常に高い魅力を持つことを証明した。' },
  { type: 'heading', text: '◎インディーゲームのルネサンス（2010年代～現在）' },
  { type: 'para', text: '芸術と創造性の殿堂。主流のAAAタイトルの多くが3Dオープンワールドへと移行する一方、Steamなどのデジタルストアの普及やクラウドファンディングの成熟に支えられ、横スクロールアクションゲームはインディーゲーム（Indie Games）の分野で全面的な復興を遂げた。' },
  { type: 'heading', text: '◎ビジュアルと感情の二重の饗宴' },
  { type: 'para', text: '『Ori and the Blind Forest（オリとくらやみの森）』や『Hollow Knight（ホロウナイト）』は、美麗なアートスタイル、壮大な世界観、そして非常に高い操作性によって、メトロイドヴァニアというジャンルを新たな高みへと押し上げた。レトロとハードコアの再構築：『Cuphead（カップヘッド）』は、1930年代の手描きレトロカートゥーン風のビジュアルと、非常に高難度なボスバトルを組み合わせた。一方、『Dead Cells（デッドセルズ）』は、横スクロールアクションとRoguelikeのシステム（ランダム生成されるステージとパーマデス）を融合させ、「Roguevania」と呼ばれる新たな潮流を生み出した。' },
  { type: 'para', text: '横スクロールアクションゲームは、40年以上にわたる進化を経てきた。しかし、その独特な「舞台劇のような視点」、純粋なアクションに対するレスポンス、そして奥行きと段階性を備えたステージデザインによって、現在でもなお色褪せることのない独自の魅力を放ち続けている。' },
];
const HISTORY_CONTENT_EN = [
  { type: 'title', text: 'The History of Side-Scrolling Action Games' },
  { type: 'para', text: 'Side-scrolling action games are one of the oldest and most iconic genres in video game history. Their development reflects breakthroughs in hardware technology, innovations in level design, and a long evolution from arcades and home consoles to the revival of the genre through indie games.' },
  { type: 'heading', text: 'The Dawn of the Genre and Technological Breakthroughs (Early 1980s)' },
  { type: 'para', text: 'Breaking Free from the Single-Screen Limitation. Before the 1980s, hardware limitations meant that virtually all games used a single-screen, fixed layout. Whenever the player cleared one screen, the system had to erase it and redraw the next one. As a result, game worlds lacked a sense of spatial continuity.' },
  { type: 'heading', text: 'The World\'s First Scrolling Game' },
  { type: 'para', text: 'In 1980, the arcade game Defender, developed by Eugene Jarvis, introduced multi-directional scrolling technology for the first time. Players controlled a fighter that could move freely up, down, left, and right, while the background scrolled accordingly. This allowed the game world to break free from the width limitations of a single screen.' },
  { type: 'heading', text: 'The Beginning of Beat \'em Ups' },
  { type: 'para', text: 'In 1984, Kung-Fu Master was released, pioneering the beat \'em up genre, in which players used their bare hands or close-range weapons to defeat large numbers of enemies.' },
  { type: 'heading', text: 'The Golden Age (Mid-1980s-Early 1990s)' },
  { type: 'para', text: 'The Birth of Classics and New Subgenres. With the widespread popularity of the Nintendo Entertainment System (NES) and various arcade hardware platforms, game designers gradually shifted their focus from simply pursuing high scores to creating engaging level experiences. Side-scrolling games consequently entered a period of explosive growth.' },
  { type: 'heading', text: 'The Benchmark for Platformers' },
  { type: 'para', text: 'In 1985, Nintendo released Super Mario Bros. Its precise jump physics, hidden secrets, and seamless level design established the standard for side-scrolling platform action games.' },
  { type: 'heading', text: 'A Variety of Subgenres Flourish' },
  { type: 'para', text: 'Hardcore action shooters: Titles such as Contra and Mega Man perfectly combined side-scrolling gameplay with challenging shooting and action elements. Three-dimensional beat \'em ups: The Kunio-kun series, launched in 1986, pioneered belt-scrolling gameplay featuring movement across multiple axes, including forward, backward, upward, and downward movement. This was followed by Double Dragon in 1987, which established the urban gang-themed setting and two-player cooperative gameplay that became hallmarks of the genre. The ultimate expression of speed: In 1991, SEGA released Sonic the Hedgehog. With its exceptionally smooth gameplay and high-speed scrolling, the game became one of SEGA\'s signature franchises. The golden age of arcades: From 1989 through the early 1990s, CAPCOM titles such as Final Fight and Warriors of Fate (Tenchi wo Kurau) pushed multiplayer cooperative play and close-quarters combat to new heights.' },
  { type: 'heading', text: 'The Impact of 3D and Genre Fusion (Mid-1990s-2000s)' },
  { type: 'para', text: 'The Decline and Transformation of 2D Games. In the mid-1990s, the arrival of the PlayStation and Sega Saturn ushered in a 3D revolution in the video game industry. Traditional 2D side-scrolling games were increasingly regarded as "outdated" and gradually pushed to the margins. This forced the genre to undergo significant transformation and fusion with other gameplay styles.' },
  { type: 'heading', text: 'The Birth of Metroidvania' },
  { type: 'para', text: 'In 1997, Castlevania: Symphony of the Night perfectly combined the non-linear exploration of Metroid with character levels, equipment, and RPG-style progression systems. This new style of side-scrolling game, which emphasized exploration and puzzle-solving, became the foundation of the Metroidvania genre and an enduring classic that continues to influence games today.' },
  { type: 'heading', text: 'The Transition to Online Games (Mid-2000s)' },
  { type: 'para', text: 'Side-scrolling action games found a new frontier in the world of online games and MMORPGs. In 2005, the Korean-developed Dungeon Fighter Online (DNF) became a major success, demonstrating that the classic combination of side-scrolling combat and beat \'em up gameplay remained highly appealing in the age of online gaming.' },
  { type: 'heading', text: 'The Indie Game Renaissance (2010s-Present)' },
  { type: 'para', text: 'A Haven for Art and Creativity. Although mainstream AAA titles had increasingly shifted toward 3D open-world experiences, the rise of digital storefronts such as Steam and the maturation of crowdfunding helped side-scrolling action games experience a full-scale revival within the indie game scene.' },
  { type: 'heading', text: 'A Feast of Visuals and Emotion' },
  { type: 'para', text: 'Ori and the Blind Forest and Hollow Knight elevated the Metroidvania genre to new heights through their breathtaking art styles, expansive worlds, and extremely high skill ceilings. Reinventing retro and hardcore gameplay: Cuphead combines a hand-drawn, 1930s-inspired retro cartoon aesthetic with highly challenging boss battles. Meanwhile, Dead Cells combines side-scrolling action with Roguelike mechanics, including randomly generated levels and permanent death, helping to establish the new "Roguevania" trend.' },
  { type: 'para', text: 'Although side-scrolling action games have undergone more than 40 years of evolution, their distinctive theatrical perspective, pure and responsive action mechanics, and layered level design continue to give the genre a unique and enduring appeal to this day.' },
];
const CONCEPT_CONTENT_ZH = [
  { type: 'title', text: '概念與結構組成' },
  { type: 'para', text: '「橫捲軸動作遊戲」可以理解為玩家操控角色，在左右延伸的2D場景中移動、跳躍、攻擊與閃避，並透過關卡、敵人、道具與Boss等系統形成遊戲體驗。' },
  { type: 'heading', text: '一、遊戲基本概念' },
  { type: 'para', text: '典型流程：玩家角色→探索關卡→遭遇敵人→戰鬥／閃避→通過障礙→Boss戰→過關。' },
  { type: 'para', text: '常見類型包括：平台動作（跳躍、踩踏、攀爬，例如《Super Mario》類型）、橫向格鬥（移動＋近戰攻擊，例如《Streets of Rage》類型）、射擊動作（移動＋遠程射擊，例如《Contra》類型）、Metroidvania（探索、戰鬥、能力解鎖與地圖回溯）、Roguelite動作（隨機關卡、隨機能力與反覆挑戰）。' },
  { type: 'heading', text: '二、主要組成' },
  { type: 'subheading', text: '1. 玩家角色 Player' },
  { type: 'para', text: '遊戲最核心的控制對象，通常包含：左右移動、跳躍、下蹲、普通攻擊、特殊攻擊、防禦／閃避、生命值HP、受傷與死亡、動畫狀態。' },
  { type: 'para', text: '可以把角色設計成一個狀態機：待機→移動→跳躍→下落→攻擊/落地→受傷→死亡，避免角色同時處於「攻擊、死亡、跳躍」等互相衝突的狀態。' },
  { type: 'subheading', text: '2. 關卡 Level' },
  { type: 'para', text: '橫捲軸遊戲的場景通常沿著X軸水平延伸，基本元素包括：地面、平台、敵人、道具、Boss房間。範例流程：起點→平台／敵人→小怪／平台→Boss。' },
  { type: 'subheading', text: '3. 敵人 Enemy' },
  { type: 'para', text: '敵人的功能不只是「扣玩家HP」，而是用來建立戰鬥節奏與挑戰性。常見敵人類型：近戰型（接近玩家後攻擊）、遠程型（保持距離並射擊）、飛行型（從空中攻擊）、防禦型（需要特定方式才能擊敗）、追蹤型（主動追蹤玩家）、Boss（多階段、高難度戰鬥）。' },
  { type: 'para', text: '敵人通常也使用AI狀態：巡邏→發現玩家→追擊→攻擊→受傷→死亡。' },
  { type: 'heading', text: '三、戰鬥系統' },
  { type: 'para', text: '核心流程：輸入→動作→碰撞→傷害→反饋。例如玩家按下攻擊鍵：播放攻擊動畫→啟動攻擊判定區Hitbox→碰撞敵人Hurtbox→造成傷害→敵人受擊動畫→擊退／硬直→音效＋特效。' },
  { type: 'para', text: '其中很重要的是Hitbox／Hurtbox：Hitbox是攻擊可以打到的範圍，Hurtbox是角色可以受到攻擊的範圍，這比單純用整張角色圖片判定碰撞更加精確。' },
  { type: 'heading', text: '四、橫向捲動 Camera' },
  { type: 'para', text: '「橫捲軸」最重要的系統之一就是鏡頭。玩家角色通常位於螢幕某個區域，當角色向右移動時，Camera會隨玩家移動，讓新的場景逐漸進入畫面。' },
  { type: 'para', text: '常見功能：Camera Follow、Camera邊界限制、平滑跟隨、區域切換、Boss房間鎖定鏡頭、背景視差Parallax。' },
  { type: 'para', text: '視差Parallax讓不同距離的背景以不同速度移動：天空移動很慢、遠景山脈稍慢、建築中速、地面最快，藉此產生2D的景深效果。' },
  { type: 'heading', text: '五、動畫系統' },
  { type: 'para', text: '角色動畫通常包含：Idle、Walk、Run、Jump、Fall、Attack、Hit、Dodge、Death，可以利用Animation State Machine管理狀態間的轉換（例如Idle↔Walk↔Attack、Jump→Fall→Landing等）。' },
  { type: 'para', text: '動畫不只是美術效果，也可能影響遊戲判定，例如「攻擊動畫第5～10幀開啟Hitbox」，因此動畫和戰鬥系統通常需要互相配合。' },
  { type: 'heading', text: '六、UI系統' },
  { type: 'para', text: '玩家需要透過UI知道遊戲狀態，常見UI包括：HP Bar、Boss HP、分數、技能冷卻、暫停選單、遊戲提示、Game Over、Victory等畫面元素。' },
  { type: 'heading', text: '七、音效與特效' },
  { type: 'para', text: '動作遊戲非常依賴「打擊感」，例如攻擊敵人時結合攻擊動畫、Hitbox、音效、閃白、粒子特效與擊退，會比只有「扣10點HP」有明顯得多的回饋。' },
  { type: 'para', text: '常見效果包括：Particle Effect（粒子特效）、Slash Effect（斬擊特效）、Hit Spark（打擊火花）、Screen Shake（畫面震動）、Hit Stop（打擊停頓）、音效與背景音樂。' },
  { type: 'heading', text: '八、遊戲核心架構' },
  { type: 'para', text: '從程式開發角度來看，可以分成：遊戲主程式底下包含玩家系統（移動、攻擊、動畫）、關卡系統（Camera）、敵人系統（AI、HP、攻擊），三者共同串接碰撞／物理系統，最終串接UI／音效／特效系統。' },
  { type: 'heading', text: '九、開發時可以拆成以下幾個模組' },
  { type: 'para', text: '建議按照以下模組開發：1. Player Controller（玩家控制）、2. Movement & Physics（移動與物理）、3. Combat System（戰鬥）、4. Enemy AI（敵人AI）、5. Level System（關卡）、6. Camera System（橫向鏡頭）、7. Animation System（動畫）、8. UI System（使用者介面）、9. Audio / VFX（音效與視覺特效）。' },
  { type: 'heading', text: '十、自己動手做最小可行版本（MVP）' },
  { type: 'para', text: '第一次開發不必一開始就做完整遊戲，可以先做：一個角色＋一張小地圖＋一種敵人＋一種攻擊＋HP＋Camera，做到「玩家可以左右走→跳躍→攻擊敵人→敵人死亡→玩家走到終點」，這樣就已經是一個可以玩的「橫捲軸動作遊戲核心Prototype」了！' },
];
const CONCEPT_CONTENT_JA = [
  { type: 'title', text: '概念と構成要素' },
  { type: 'para', text: '「横スクロールアクションゲーム」は、プレイヤーがキャラクターを操作し、左右に広がる2Dステージ上で移動・ジャンプ・攻撃・回避を行いながら、ステージ、敵、アイテム、ボスなどのシステムを通してゲーム体験を形成するものと理解できます。' },
  { type: 'heading', text: '一、ゲームの基本概念' },
  { type: 'para', text: '典型的な流れ：プレイヤーキャラクター→ステージ探索→敵との遭遇→戦闘／回避→障害物を突破→ボス戦→ステージクリア。' },
  { type: 'para', text: '代表的なジャンル：プラットフォームアクション(ジャンプ、踏みつけ、よじ登りなど。『Super Mario』系)、横スクロール格闘アクション(移動＋近接攻撃。『Streets of Rage』系)、シューティングアクション(移動＋遠距離射撃。『Contra』系)、Metroidvania(探索、戦闘、能力解放、マップの再探索)、Rogueliteアクション(ランダムステージ、ランダム能力、繰り返し挑戦)。' },
  { type: 'heading', text: '二、主な構成要素' },
  { type: 'subheading', text: '1. プレイヤーキャラクター（Player）' },
  { type: 'para', text: 'ゲームの中心となる操作対象で、一般的には以下の要素があります：左右移動、ジャンプ、しゃがみ、通常攻撃、特殊攻撃、防御／回避、体力(HP)、ダメージ・死亡、アニメーション状態。' },
  { type: 'para', text: 'キャラクターをステートマシンとして設計できます：待機→移動→ジャンプ→落下→攻撃/着地→ダメージ→死亡。こうすることで、キャラクターが同時に「攻撃中・死亡・ジャンプ中」など矛盾する状態になることを防げます。' },
  { type: 'subheading', text: '2. ステージ（Level）' },
  { type: 'para', text: '横スクロールゲームのステージは通常X軸方向に水平に広がる構造で、基本要素は：地面、足場、敵、アイテム、ボス部屋。例：スタート→足場／敵→雑魚敵／足場→ボス。' },
  { type: 'subheading', text: '3. 敵（Enemy）' },
  { type: 'para', text: '敵の役割は単に「プレイヤーのHPを減らす」ことではなく、戦闘のリズムと難易度を作り出すことです。代表的な敵タイプ：近接型(接近して攻撃)、遠距離型(距離を保ち射撃)、飛行型(空中から攻撃)、防御型(特定の方法でしか倒せない)、追跡型(積極的に追跡)、ボス(複数フェーズの高難度戦闘)。' },
  { type: 'para', text: '敵も通常AIステートを使用します：巡回→プレイヤー発見→追跡→攻撃→ダメージ→死亡。' },
  { type: 'heading', text: '三、戦闘システム' },
  { type: 'para', text: '基本の流れ：入力→アクション→当たり判定→ダメージ→フィードバック。例えば攻撃ボタンを押す→攻撃アニメーション再生→攻撃判定(Hitbox)を有効化→敵の被弾判定(Hurtbox)と接触→ダメージを与える→敵の被弾アニメーション→ノックバック／硬直→効果音＋エフェクト。' },
  { type: 'para', text: 'ここで重要なのがHitbox／Hurtboxです。Hitboxは攻撃が命中する範囲、Hurtboxはキャラクターが攻撃を受ける範囲で、画像全体を当たり判定にするよりも正確な判定ができます。' },
  { type: 'heading', text: '四、横スクロールとカメラ（Camera）' },
  { type: 'para', text: '「横スクロール」を実現するうえでカメラは非常に重要なシステムです。プレイヤーキャラクターは通常画面内の一定位置に留まり、キャラクターが右へ移動するとCameraが追従し、新しいステージが徐々に画面内へ入ってきます。' },
  { type: 'para', text: '一般的な機能：Camera Follow(追従)、カメラの境界制限、スムーズな追従、エリア切り替え、ボス部屋でのカメラ固定、背景の視差(Parallax)。' },
  { type: 'para', text: '視差(Parallax)は距離の異なる背景をそれぞれ異なる速度で移動させます：空景は非常にゆっくり、遠景の山はややゆっくり、建物は中速、地面は高速。これにより2Dでも奥行きのある表現ができます。' },
  { type: 'heading', text: '五、アニメーションシステム' },
  { type: 'para', text: 'キャラクターのアニメーションには通常：Idle、Walk、Run、Jump、Fall、Attack、Hit、Dodge、Deathなどがあり、Animation State Machineを利用して状態遷移を管理できます(Idle⇄Walk⇄Attack、Jump→Fall→Landingなど)。' },
  { type: 'para', text: 'アニメーションは単なるグラフィック表現ではなく、ゲーム内の判定にも影響します。例えば「攻撃アニメーションの5～10フレーム目でHitboxを有効化」など、アニメーションシステムと戦闘システムは密接に連携する必要があります。' },
  { type: 'heading', text: '六、UIシステム' },
  { type: 'para', text: 'プレイヤーはUIを通してゲームの状態を把握します。一般的な要素：HPバー、ボスHP、スコア、スキルのクールダウン、ポーズメニュー、ゲーム内のヒント、Game Over、Victoryなど。' },
  { type: 'heading', text: '七、効果音とエフェクト' },
  { type: 'para', text: 'アクションゲームでは「手応え(ヒット感)」が非常に重要です。例えば敵を攻撃した際、攻撃アニメーション＋Hitbox＋効果音＋フラッシュ＋パーティクルエフェクト＋ノックバックを組み合わせることで、単に「HPが10減る」だけよりはるかに明確なフィードバックを与えられます。' },
  { type: 'para', text: '代表的な演出：Particle Effect、Slash Effect、Hit Spark、Screen Shake、Hit Stop、効果音、BGM。' },
  { type: 'heading', text: '八、ゲームの基本アーキテクチャ' },
  { type: 'para', text: 'プログラム開発の観点では、ゲームメインプログラムの下にプレイヤーシステム(移動・攻撃・アニメーション)、ステージシステム(Camera)、敵システム(AI・HP・攻撃)があり、これらが衝突／物理システムを経てUI／音響／エフェクトへとつながります。' },
  { type: 'heading', text: '九、開発時に分けられるモジュール' },
  { type: 'para', text: '実際に制作する場合は以下のモジュールに分けることをおすすめします：Player Controller(プレイヤー操作)、Movement & Physics(移動・物理)、Combat System(戦闘)、Enemy AI(敵AI)、Level System(ステージ)、Camera System(横スクロールカメラ)、Animation System(アニメーション)、UI System(ユーザーインターフェース)、Audio / VFX(音響・ビジュアルエフェクト)。' },
  { type: 'heading', text: '十、自分で作る最小実行可能バージョン（MVP）' },
  { type: 'para', text: '初めて開発する場合、最初から完全なゲームを作る必要はありません。まずは1体のキャラクター＋小さなマップ1つ＋敵1種類＋攻撃1種類＋HP＋Cameraを実装し、「プレイヤーが左右に移動する→ジャンプする→敵を攻撃する→敵が死亡する→プレイヤーがゴールまで移動する」ができれば、すでに横スクロールアクションゲームの基本的なPrototypeとして遊べる状態です！' },
];
const CONCEPT_CONTENT_EN = [
  { type: 'title', text: 'Concepts and Structural Components' },
  { type: 'para', text: 'A side-scrolling action game can be understood as a game in which the player controls a character and moves, jumps, attacks, and dodges within a horizontally extended 2D environment, creating the gameplay experience through systems such as levels, enemies, items, and bosses.' },
  { type: 'heading', text: 'I. Basic Game Concept' },
  { type: 'para', text: 'A typical flow: Player Character -> Explore Level -> Encounter Enemies -> Combat / Dodge -> Overcome Obstacles -> Boss Battle -> Clear the Level.' },
  { type: 'para', text: 'Common types include: Platform Action (jumping, stomping, climbing, such as the Super Mario style), Side-Scrolling Beat \'em Up (movement + melee attacks, such as the Streets of Rage style), Run-and-Gun (movement + ranged shooting, such as the Contra style), Metroidvania (exploration, combat, ability unlocks, and backtracking), and Roguelite Action (randomized levels, random abilities, repeated challenges).' },
  { type: 'heading', text: 'II. Main Components' },
  { type: 'subheading', text: '1. Player Character' },
  { type: 'para', text: 'The core object controlled by the player. It usually includes: left/right movement, jumping, crouching, normal attacks, special attacks, defense/dodge, health points (HP), damage and death, and animation states.' },
  { type: 'para', text: 'The character can be designed as a state machine: Idle -> Move -> Jump -> Fall -> Attack/Land -> Hit -> Death. This helps prevent the character from being in conflicting states at the same time, such as attacking, dying, and jumping simultaneously.' },
  { type: 'subheading', text: '2. Level' },
  { type: 'para', text: 'The environment of a side-scrolling game usually extends horizontally along the X-axis. Basic elements include ground, platforms, enemies, items, and boss rooms. Example flow: Start -> Platform/Enemy -> Enemy/Platform -> Boss.' },
  { type: 'subheading', text: '3. Enemy' },
  { type: 'para', text: 'The purpose of enemies is not simply to reduce the player\'s HP, but to create combat rhythm and challenge. Common types: Melee (approaches and attacks), Ranged (keeps distance and shoots), Flying (attacks from the air), Defensive (requires a specific method to defeat), Chasing (actively follows the player), and Boss (high-difficulty battle with multiple phases).' },
  { type: 'para', text: 'Enemies typically use AI states too: Patrol -> Detect Player -> Chase -> Attack -> Hit -> Death.' },
  { type: 'heading', text: 'III. Combat System' },
  { type: 'para', text: 'The core flow is usually: Input -> Action -> Collision -> Damage -> Feedback. For example, when the player presses the attack button: play attack animation -> activate attack hitbox -> collide with enemy hurtbox -> deal damage -> enemy hit animation -> knockback/stun -> sound effect + visual effect.' },
  { type: 'para', text: 'One of the most important concepts here is Hitbox/Hurtbox. Hitbox is the area where an attack can hit; Hurtbox is the area where a character can receive an attack. This provides much more precise collision detection than simply using the entire character image.' },
  { type: 'heading', text: 'IV. Side-Scrolling Camera' },
  { type: 'para', text: 'One of the most important systems in a side-scrolling game is the camera. The player character usually stays within a certain area of the screen; as the character moves right, the camera follows, allowing new parts of the environment to gradually enter the screen.' },
  { type: 'para', text: 'Common functions include: Camera Follow, Camera Boundaries, Smooth Following, Area Transitions, Camera Locking in Boss Rooms, and Background Parallax.' },
  { type: 'para', text: 'Parallax moves different background layers at different speeds depending on their distance: sky moves very slowly, distant mountains slightly slower, buildings at medium speed, and the ground fastest. This creates a sense of depth in a 2D game.' },
  { type: 'heading', text: 'V. Animation System' },
  { type: 'para', text: 'Character animations usually include: Idle, Walk, Run, Jump, Fall, Attack, Hit, Dodge, and Death, managed via an Animation State Machine (e.g. Idle <-> Walk <-> Attack, Jump -> Fall -> Landing).' },
  { type: 'para', text: 'Animation is not just a visual effect; it can also affect gameplay logic. For example, "attack animation frames 5-10 activate the hitbox." Therefore, the animation system and combat system usually need to work closely together.' },
  { type: 'heading', text: 'VI. UI System' },
  { type: 'para', text: 'Players need the UI to understand the current state of the game. Common elements include: HP Bar, Boss HP, Score, Skill Cooldown, Pause Menu, Gameplay Tips, Game Over, and Victory.' },
  { type: 'heading', text: 'VII. Sound Effects and Visual Effects' },
  { type: 'para', text: 'Action games rely heavily on "game feel" and impact feedback. For example, attacking an enemy combines attack animation, hitbox, sound effect, flash, particle effects, and knockback - providing much stronger feedback than simply showing "10 HP lost."' },
  { type: 'para', text: 'Common effects include: Particle Effects, Slash Effects, Hit Sparks, Screen Shake, Hit Stop, Sound Effects, and Background Music.' },
  { type: 'heading', text: 'VIII. Core Game Architecture' },
  { type: 'para', text: 'From a programming perspective, the game can be divided into systems: the Main Game Program contains a Player System (movement, attack, animation), a Level System (camera), and an Enemy System (AI, HP, attack), all feeding into a Collision/Physics System and finally into UI/Audio/VFX.' },
  { type: 'heading', text: 'IX. Development Modules' },
  { type: 'para', text: 'When actually developing a side-scrolling action game, it helps to split development into these modules: Player Controller, Movement & Physics, Combat System, Enemy AI, Level System, Camera System, Animation System, UI System, and Audio / VFX.' },
  { type: 'heading', text: 'X. Building a Minimum Viable Product (MVP)' },
  { type: 'para', text: 'If this is your first time developing a game, you do not need to build the complete game from the beginning. Start with: one character + one small map + one enemy type + one attack + HP + camera. Once the player can move left and right, jump, attack enemies, defeat them, and reach the goal, you already have a playable core prototype of a side-scrolling action game.' },
];
let historyArticleIndex = 0; // 0:發展史 1:概念與結構組成
const FAN_PAGE_URL = 'https://www.facebook.com/profile.php?id=61594197187795';
let aboutFanPageBtn = null; // 「關於Arc概遊庫」ページのリンクボタン領域(クリック判定用、非表示時はnull)
let aboutFanPageFocused = false; // キーボード/ゲームパッドでリンクボタンにフォーカスが当たっているか(一番上でさらに↑を押すとフォーカスされる)
const ABOUT_CONTENT_ZH = [
  { type: 'title', text: '關於「ARCの概遊庫」' },
  { type: 'para', text: '「ARCの概遊庫」這個名字，發想起源於諧音「蓋油庫」(即:概念遊戲保藏庫)。期望自己，以及所有開發者所開發的作品，都能夠像「蓋油庫」一樣，賺大錢！' },
  { type: 'para', text: '同時，也可以很自豪、很酷地說出自己開發遊戲的喜悅，以及一路走來的心路歷程。除了可以從遊戲中遊玩雛型範本之外，同時可透過內建的歷史功能，了解各系列類型遊戲的組成與開發構成等相關知識，進而對遊戲開發產生興趣。' },
  { type: 'para', text: '目前年過50的作者，回頭一看，進入遊戲業界也將近25年了。這一路走來，雖然參與、開發過不少遊戲，卻始終沒有真正做出一款讓自己「超級成名」的TITLE。' },
  { type: 'para', text: '近年來AI開發盛行，遊戲產業也正面臨前所未有的變化。「選擇走遊戲這條路，究竟是正確的嗎？」這個問題，開始不斷浮現在我的腦海裡。' },
  { type: 'para', text: '也因此，我不得不重新思考——人生走到這個階段，我存在的意義究竟是什麼？而其中，我最常問自己的一個問題就是：「我能為這個產業留下什麼？」' },
  { type: 'para', text: '我常常在想，是否能夠運用自己這25年來所學到的東西，讓那些對遊戲開發有興趣的新生代，重新產生一點「想做遊戲」的衝動？但要怎麼做？' },
  { type: 'para', text: '突然想到：「不然，就來做一本可以玩的遊戲書吧！」從小，我就是個很不愛看「有字的書」的人。（漫畫除外！）與其坐在那裡讀一大堆文字，不如先親身體驗看看。覺得有興趣，再回頭鑽研。就這樣——「ARCの概遊庫」誕生了！' },
  { type: 'para', text: '就像我常常形容的：大多數的遊戲開發者，都不可能成為第二個宮本茂，也不一定能像神話般敗部復活的小島秀夫桑一樣，成為世人熟知的大師。但難道就因此喪志、放棄嗎？我想，不必。' },
  { type: 'para', text: '因為每一個開發者，都曾經擁有那顆熱愛遊戲的赤子之心。曾經捧著遊戲雜誌，期待下一款新作的到來；曾經跑進電玩店，投下硬幣，和朋友一起打《快打旋風》，為了輸贏大呼小叫；曾經為了一款遊戲，可以興奮上一整天。' },
  { type: 'para', text: '那些年華與時光，也許就像短暫的流星一樣，一閃而過。但直到現在，我還是相信——玩遊戲，是因為好玩。做遊戲，不也是因為好玩嗎？' },
  { type: 'para', text: '所以，即使我們未必能成為那個站在聚光燈下的人，至少，也可以留下自己曾經努力做過、曾經熱愛過的作品。這，就是我想做「ARCの概遊庫」的理由。' },
  { type: 'para', text: '「ARCの概遊庫」，一款可以玩的遊戲書。一段屬於遊戲開發者的故事。也是一群喜歡遊戲的人，留下的足跡。希望各位喜歡。感謝！！' },
];
const ABOUT_CONTENT_JA = [
  { type: 'title', text: '「ARCの概遊庫」について' },
  { type: 'para', text: '「ARCの概遊庫」という名前は、中国語の「蓋油庫（ガイヨウクー）」（すなわち、コンセプトゲームアーカイブ）という語呂合わせから生まれました。自分自身、そしてすべての開発者が作った作品が、「蓋油庫」のように、大きく稼げますように！' },
  { type: 'para', text: '同時に、自分が作ってきたゲームへの喜びや、そこに至るまでの道のり、開発者として歩んできた思いを、胸を張って、そしてちょっとカッコよく語れる場所にもしたい。ゲームそのものを遊びながら、さまざまなゲームのプロトタイプや雛形を体験できるだけでなく、内蔵された「歴史」機能を通して、各シリーズやジャンルの成り立ち、ゲームがどのように構成され、開発されてきたのかといった知識にも触れることができます。そして、そこから少しでも「ゲームを作ってみたい」という興味につながってくれたらと思っています。' },
  { type: 'para', text: '現在、50歳を過ぎた私が振り返ってみると、ゲーム業界に入ってから、もうすぐ25年になります。これまで数多くのゲームに関わり、開発にも携わってきました。それでも、これまで一度も、自分自身が「超有名になった」と思えるようなTITLEを、本当の意味では作ることができませんでした。' },
  { type: 'para', text: '近年ではAIによる開発が急速に広がり、ゲーム産業そのものも、これまでにない大きな変化の時代を迎えています。「ゲームという道を選んだことは、本当に正しかったのだろうか？」そんな疑問が、いつしか何度も自分の頭をよぎるようになりました。' },
  { type: 'para', text: 'そして、改めて考えざるを得なくなりました。人生のこの段階において、自分が存在する意味とは、一体何なのだろう？その中でも、特に自分自身へ問いかけることが多かったのが、「自分は、この業界に何を残せるのだろう？」ということでした。' },
  { type: 'para', text: 'これまでの25年間で、自分が学んできたこと。それらを何かの形にして、ゲーム開発に興味を持っている次の世代の人たちに、もう一度、「ゲームを作ってみたい」と思ってもらうことはできないだろうか？そんなことを、ずっと考えていました。でも、どうやって？' },
  { type: 'para', text: 'そこで、ふと思いつきました。「だったら、遊べるゲームブックを作ってみればいいじゃないか！」子どもの頃から、私は「文字のいっぱい書いてある本」を読むのが、あまり好きではありませんでした。（漫画は別です！）そこに座って大量の文章を読むくらいなら、まずは自分で体験してみる。面白そうだと思ったら、そこから改めて深く掘り下げていく。そうして——「ARCの概遊庫」は誕生しました！' },
  { type: 'para', text: '私がよく言っていることがあります。ほとんどのゲーム開発者は、第二の宮本茂になることはできません。そして、まるで伝説のような復活を遂げた小島秀夫さんのように、世界中に知られる巨匠になれるとも限りません。でも、だからといって、落ち込んで諦めてしまう必要があるのでしょうか？私は、そうは思いません。' },
  { type: 'para', text: 'なぜなら、すべての開発者はかつて、ゲームを愛する、あの純粋な心を持っていたはずだからです。ゲーム雑誌を大切に抱え、次に発売される新作を楽しみに待っていた。ゲームセンターへ走って行き、コインを入れて、友達と一緒に『ストリートファイター』を遊び、勝った負けたと大騒ぎした。たった一本のゲームのために、一日中ワクワクしていた。' },
  { type: 'para', text: 'そんな青春や時間は、まるで一瞬だけ夜空を駆け抜ける流星のように、あっという間に過ぎ去ってしまったのかもしれません。それでも、今の私はまだ信じています。ゲームを遊ぶのは、楽しいから。ゲームを作るのだって、楽しいからじゃないのか？' },
  { type: 'para', text: 'だからこそ、たとえスポットライトを浴びる存在になれなかったとしても、少なくとも、自分が頑張って作った、かつて心から愛した作品を残すことはできる。それが、「ARCの概遊庫」を作りたいと思った理由です。' },
  { type: 'para', text: '「ARCの概遊庫」——遊べるゲームブック。ゲーム開発者の物語。そして、ゲームを愛する人々が残した足跡。楽しんでいただければ幸いです。ありがとうございました！！' },
];
const ABOUT_CONTENT_EN = [
  { type: 'title', text: 'About ARC\'s Game Archive' },
  { type: 'para', text: 'The name "ARC\'s Game Archive" was inspired by a Chinese pun based on the pronunciation of "gai you ku" (Namely, Concept Game Archive). My hope is that the works created by myself, and by all developers, can be like that phrase: make BIG money!' },
  { type: 'para', text: 'At the same time, I want this project to be a place where we can proudly, and perhaps a little coolly, talk about the joy of creating games, as well as the thoughts, experiences, and journey behind them. Rather than simply playing games, players can experience prototypes and examples from different types of games. Through the built-in historical features, they can also learn about how various game series and genres came to be, how they were structured, and how they were developed. And perhaps, through that experience, they may gradually become interested in game development themselves.' },
  { type: 'para', text: 'Now that I am over 50, I look back and realize that it has been almost 25 years since I entered the game industry. Over all these years, I have participated in and developed quite a few games. Yet, I have never truly created a TITLE that made me "super famous."' },
  { type: 'para', text: 'In recent years, AI-driven development has rapidly emerged, and the game industry is facing changes unlike anything we have seen before. "Was choosing a career in games really the right choice?" That question has increasingly begun to occupy my mind.' },
  { type: 'para', text: 'And because of that, I have had to reconsider something much deeper: at this stage of my life, what is the meaning of my existence? One question, in particular, keeps coming back to me: "What can I leave behind for this industry?"' },
  { type: 'para', text: 'I often wonder whether I can take what I have learned over these past 25 years and use it to give the next generation of people interested in game development a little push, a spark that makes them think: "I want to make games." But how?' },
  { type: 'para', text: 'Then, suddenly, I thought: "Why not make a game book that you can actually play?" Ever since I was a child, I have never been a big fan of "books with lots of words." (Manga doesn\'t count!) Instead of sitting there reading page after page of text, why not experience something first? If it sparks your interest, then go back and dig deeper. And so, "ARC\'s Game Archive" was born!' },
  { type: 'para', text: 'There is something I often say: Most game developers will never become the next Shigeru Miyamoto. Nor will everyone become a world-renowned master like Hideo Kojima, who made what seemed like a legendary comeback from the bottom. But does that mean we should lose heart and give up? I don\'t think so.' },
  { type: 'para', text: 'Because every developer once possessed that pure, childlike love for games. We once held game magazines in our hands, eagerly waiting for the next big release. We once ran into arcades, dropped coins into machines, and played Street Fighter with our friends, shouting and cheering over every win and loss. We once became so excited about a single game that it could make our entire day.' },
  { type: 'para', text: 'Those years and those moments may have passed like shooting stars, flashing brightly across the sky before disappearing in an instant. But even now, I still believe: we play games because they are fun. So shouldn\'t we make games because they are fun, too?' },
  { type: 'para', text: 'So even if we may never become the person standing in the spotlight, at the very least, we can leave behind something we worked hard to create, something we once truly loved. That is why I wanted to create "ARC\'s Game Archive."' },
  { type: 'para', text: '"ARC\'s Game Archive": a game book you can play. A story about game developers. And, the footprints left behind by a group of people who love games. I hope you enjoy it. Thank you!!' },
];
function getHistoryContent() {
  const table = [
    { zh: HISTORY_CONTENT_ZH, ja: HISTORY_CONTENT_JA, en: HISTORY_CONTENT_EN },
    { zh: CONCEPT_CONTENT_ZH, ja: CONCEPT_CONTENT_JA, en: CONCEPT_CONTENT_EN },
    { zh: ABOUT_CONTENT_ZH, ja: ABOUT_CONTENT_JA, en: ABOUT_CONTENT_EN },
  ];
  const entry = table[historyArticleIndex] || table[0];
  return entry[currentLang] || entry.zh;
}
let historyLinesCache = null;
let historyLinesCacheLang = null;
let historyScroll = 0;
function buildHistoryLines() {
  const cacheKey = currentLang + ':' + historyArticleIndex;
  if (historyLinesCache && historyLinesCacheLang === cacheKey) return historyLinesCache;
  const maxWidth = 630;
  const lines = [];
  getHistoryContent().forEach(block => {
    if (block.type === 'title') {
      lines.push({ type: 'title', text: block.text });
    } else if (block.type === 'heading') {
      lines.push({ type: 'gap' });
      lines.push({ type: 'heading', text: block.text });
    } else if (block.type === 'subheading') {
      lines.push({ type: 'subheading', text: block.text });
    } else {
      ctx.font = '12.5px "Microsoft JhengHei", sans-serif';
      if (currentLang === 'en') {
        // 英語は単語単位で折り返す(文字単位だと単語の途中で切れてしまうため)
        const words = block.text.split(' ');
        let cur = '';
        words.forEach(word => {
          const test = cur ? cur + ' ' + word : word;
          if (ctx.measureText(test).width > maxWidth && cur) {
            lines.push({ type: 'para', text: cur });
            cur = word;
          } else {
            cur = test;
          }
        });
        if (cur) lines.push({ type: 'para', text: cur });
      } else {
        // 中国語/日本語は文字単位で折り返す
        let cur = '';
        for (const ch of block.text) {
          const test = cur + ch;
          if (ctx.measureText(test).width > maxWidth && cur) {
            lines.push({ type: 'para', text: cur });
            cur = ch;
          } else {
            cur = test;
          }
        }
        if (cur) lines.push({ type: 'para', text: cur });
      }
      lines.push({ type: 'gap' });
    }
  });
  historyLinesCache = lines;
  historyLinesCacheLang = cacheKey;
  return lines;
}
function historyLineHeight(l) {
  if (l.type === 'title') return 30;
  if (l.type === 'heading') return 22;
  if (l.type === 'subheading') return 19;
  if (l.type === 'gap') return 8;
  return 19;
}
// 「了解歴史」の記事選択画面(2項目からどちらを読むか選ぶ)
function drawMenuHistorySelect() {
  drawMenuTitle(t('menuHistory'));
  const items = [t('historyArticleTimeline'), t('historyArticleConcept'), t('historyArticleAbout')];
  drawMenuList(items, menuIndex, 118, 40);
  drawMenuNavHint();
}
function drawMenuHistory() {
  const lines = buildHistoryLines();
  const isAboutPage = historyArticleIndex === 2;
  const headerH = isAboutPage ? 104 : 0; // ロゴ+リンクボタン専用の固定ヘッダー領域(可捲動テキストとは重ならない)
  const viewTop = 16 + headerH, viewBottom = H - 32;
  const viewHeight = viewBottom - viewTop;

  let totalHeight = 0;
  const heights = lines.map(l => { const h = historyLineHeight(l); totalHeight += h; return h; });
  const maxScroll = Math.max(0, totalHeight - viewHeight);
  historyScroll = Math.max(0, Math.min(maxScroll, historyScroll));

  // ヘッダー領域にロゴを固定表示(スクロール対象外なので文字と重ならない)
  if (isAboutPage && studioLogoImgLoaded) {
    const logoSize = 58;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(studioLogoImg, W/2 - logoSize/2, 8, logoSize, logoSize);
    ctx.restore();
  }

  // ロゴ下に固定表示する「粉絲團」への外部リンクボタン(クリック判定はaboutFanPageBtnで行う)
  if (isAboutPage) {
    const btnW = 150, btnH = 26, btnX = W/2 - btnW/2, btnY = 72;
    rectO(btnX, btnY, btnW, btnH, '#1877F2');
    if (aboutFanPageFocused) {
      const flash = frame % 20 < 10;
      ctx.strokeStyle = flash ? '#ffffff' : '#ffdd33';
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX - 3, btnY - 3, btnW + 6, btnH + 6);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#fff';
    const label = aboutFanPageFocused ? ('▶ ' + t('historyAboutFanPage') + ' ◀') : t('historyAboutFanPage');
    ctx.fillText(label, btnX + btnW / 2, btnY + btnH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    aboutFanPageBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
  } else {
    aboutFanPageBtn = null;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, viewTop, W, viewHeight);
  ctx.clip();

  let y = viewTop + 18 - historyScroll;
  lines.forEach((l, i) => {
    const h = heights[i];
    if (y > viewTop - h && y < viewBottom + h) {
      if (l.type === 'title') {
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#ffdd33';
        ctx.fillText(l.text, W/2, y);
      } else if (l.type === 'heading') {
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#7CF5FF';
        ctx.fillText(l.text, 44, y);
      } else if (l.type === 'subheading') {
        ctx.textAlign = 'left';
        ctx.font = 'bold 12.5px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#ffb84d';
        ctx.fillText(l.text, 44, y);
      } else if (l.type === 'para') {
        ctx.textAlign = 'left';
        ctx.font = '12.5px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#ddd';
        ctx.fillText(l.text, 44, y);
      }
    }
    y += h;
  });
  ctx.restore();

  if (maxScroll > 0) {
    const barX = W - 14;
    rect(barX, viewTop, 4, viewHeight, 'rgba(255,255,255,0.12)');
    const thumbH = Math.max(20, viewHeight * (viewHeight / totalHeight));
    const thumbY = viewTop + (viewHeight - thumbH) * (historyScroll / maxScroll);
    rect(barX, thumbY, 4, thumbH, 'rgba(255,221,51,0.7)');
  }

  ctx.textAlign = 'center';
  ctx.font = '11px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('\u2191\u2193 ' + t('historyScrollHint') + '   Enter/Esc: ' + t('back'), W/2, H - 14);
}
function drawMenuCredits() {
  drawMenuTitle(t('creditTitle'));
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(t('creditPlan') + ' : Arc Wang', W/2, 122);
  ctx.fillText(t('creditAI') + ' : Claude AI', W/2, 154);
  ctx.fillText(t('creditArt') + ' : AI', W/2, 186);
  ctx.fillText(t('creditMusic') + ' : AI', W/2, 218);
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#ffdd33';
  ctx.fillText(t('creditThanks') + ' :', W/2, 250);
  ctx.font = 'bold 13px monospace';
  ctx.fillText('Kelvin Lo、大王KUNI、BuBu Lin', W/2, 272);
  ctx.fillText('KT Lee、國見比呂', W/2, 292);
  ctx.font = '12px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('Enter / Esc: ' + t('back'), W/2, H - 16);
}

// ===== 名前入力画面(GAME OVER/STAGE CLEAR直後に表示) =====
function drawNameEntry() {
  ctx.fillStyle = 'rgba(10,8,6,0.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px monospace';
  ctx.lineWidth = 4; ctx.strokeStyle = '#1a1410';
  ctx.strokeText(t('nameEntryTitle'), W/2, 60);
  ctx.fillStyle = '#ffdd33';
  ctx.fillText(t('nameEntryTitle'), W/2, 60);

  ctx.font = '13px monospace';
  ctx.fillStyle = '#ccc';
  ctx.fillText(t('scoreLabel') + ': ' + String(score).padStart(6, '0'), W/2, 92);

  // 4文字分の入力枠
  const boxW = 46, boxH = 56, gap = 14;
  const totalW = boxW * 4 + gap * 3;
  const startX = W/2 - totalW/2;
  const boxY = 130;
  for (let i = 0; i < 4; i++) {
    const bx = startX + i * (boxW + gap);
    const active = i === nameEntryIndex;
    rect(bx, boxY, boxW, boxH, active ? 'rgba(255,221,51,0.18)' : 'rgba(255,255,255,0.08)');
    ctx.strokeStyle = active ? '#ffdd33' : '#888';
    ctx.lineWidth = active ? 3 : 2;
    ctx.strokeRect(bx + 1, boxY + 1, boxW - 2, boxH - 2);
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(nameEntryChars[i] || '', bx + boxW/2, boxY + boxH/2 + 10);
    if (active && nameEntryChars[i] === '' && frame % 30 < 15) {
      ctx.fillStyle = '#ffdd33';
      ctx.fillText('_', bx + boxW/2, boxY + boxH/2 + 10);
    }
  }

  ctx.font = '12px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText(t('nameEntryHint1'), W/2, boxY + boxH + 30);
  ctx.fillText(t('nameEntryHint2'), W/2, boxY + boxH + 50);
}

// ===== 排行榜(ランキング)の共通描画:トップ10件のリストを描く =====
function drawLeaderboardList(startY) {
  const list = leaderboardData[leaderboardViewDiff] || [];
  if (leaderboardLoading) {
    ctx.textAlign = 'center';
    ctx.font = '13px monospace';
    ctx.fillStyle = '#aaa';
    const dots = '.'.repeat(Math.floor(frame / 15) % 4);
    ctx.fillText(t('leaderboardLoading') + dots, W/2, startY + 40);
    return;
  }
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('#', W/2 - 130, startY);
  ctx.fillText(t('nameEntryTitle'), W/2 - 95, startY);
  ctx.textAlign = 'right';
  ctx.fillText(t('scoreLabel'), W/2 + 130, startY);

  const lineH = 20;
  if (list.length === 0) {
    ctx.textAlign = 'center';
    ctx.font = '13px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(t('leaderboardEmpty'), W/2, startY + 30);
    return;
  }
  const pageStart = leaderboardPage * LEADERBOARD_PAGE_SIZE;
  for (let i = 0; i < LEADERBOARD_PAGE_SIZE; i++) {
    const rank = pageStart + i;
    const y = startY + 22 + i * lineH;
    const entry = list[rank];
    const highlighted = rank === leaderboardHighlightIndex;
    ctx.font = highlighted ? 'bold 14px monospace' : '13px monospace';
    ctx.fillStyle = highlighted ? '#ffdd33' : (entry ? '#fff' : '#444');
    ctx.textAlign = 'left';
    ctx.fillText(String(rank + 1).padStart(2, ' '), W/2 - 130, y);
    ctx.fillText(entry ? entry.name : '----', W/2 - 95, y);
    ctx.textAlign = 'right';
    ctx.fillText(entry ? String(entry.score).padStart(6, '0') : '------', W/2 + 130, y);
  }
  ctx.textAlign = 'center';
  ctx.font = '11px monospace';
  ctx.fillStyle = '#888';
  const totalPages = Math.ceil(LEADERBOARD_MAX / LEADERBOARD_PAGE_SIZE);
  ctx.fillText('\u25c0 ' + (leaderboardPage + 1) + ' / ' + totalPages + ' \u25b6', W/2, startY + 22 + LEADERBOARD_PAGE_SIZE * lineH + 16);
}

// ===== \u6392\u884c\u699c\u753b\u9762(GAME OVER/STAGE CLEAR\u5f8c\u3001\u307e\u305f\u306f\u30e1\u30a4\u30f3\u30e1\u30cb\u30e5\u30fc\u304b\u3089\u9600\u89a7) =====

function drawLeaderboardScreen() {
  ctx.fillStyle = 'rgba(10,8,6,0.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px monospace';
  ctx.lineWidth = 4; ctx.strokeStyle = '#1a1410';
  ctx.strokeText(t('leaderboardTitle'), W/2, 40);
  ctx.fillStyle = '#ffdd33';
  ctx.fillText(t('leaderboardTitle'), W/2, 40);

  // 難易度タブ(◀▶で切り替え)
  const diffLabels = { easy: t('difficultyEasy'), normal: t('difficultyNormal'), hard: t('difficultyHard'), dojo: t('modeDojo') };
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#ccc';
  ctx.fillText('◀  ' + diffLabels[leaderboardViewDiff] + '  ▶', W/2, 66);

  drawLeaderboardList(84);

  ctx.textAlign = 'center';
  ctx.font = '11px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('←→ ' + t('leaderboardSwitch') + '   ↑↓ ' + t('leaderboardPageSwitch'), W/2, H - 28);
  if (leaderboardFromMenu) {
    ctx.fillText('Enter/Esc: ' + t('back'), W/2, H - 14);
  } else {
    ctx.fillText('Enter/Esc: ' + t('pressAnyKeyContinue'), W/2, H - 14);
  }
}

// ===== PAUSE(一時停止)メニュー描画:ゲーム画面の上に半透明のオーバーレイで表示 =====
function drawPauseOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px monospace';
  ctx.lineWidth = 4; ctx.strokeStyle = '#1a1410';
  ctx.strokeText(t('pauseTitle'), W/2, 90);
  ctx.fillStyle = '#ffdd33';
  ctx.fillText(t('pauseTitle'), W/2, 90);

  if (pauseScreen === 'main') {
    const items = [t('pauseResume'), t('pauseSettings'), t('pauseHelp'), t('pauseReturnMain')];
    drawMenuList(items, pauseIndex, 150, 38);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('↑↓ / Enter / Esc(' + t('pauseResume') + ')', W/2, H - 16);
  } else if (pauseScreen === 'confirmReturn') {
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(t('confirmReturnText'), W/2, 170);
    const items = [t('confirmYes'), t('confirmNo')];
    drawMenuList(items, pauseIndex, 220, 40);
  }
}

function drawStart() {
  ctx.fillStyle = 'rgba(20,10,5,0.35)';
  ctx.fillRect(0,0,W,H);
  ctx.textAlign = 'center';

  const elapsed = frame - titleAnimStart;
  const LOGO_DUR = 40;      // ロゴのズームイン所要フレーム数
  const HERO_DELAY = 75;    // ロゴ演出完了後に主人公スライドインを開始(ロゴの表示時間を長めに確保)
  const HERO_DUR = 30;      // 主人公のスライドイン所要フレーム数
  const PROMPT_DELAY = HERO_DELAY + HERO_DUR + 6; // 演出完了後にENTERプロンプトを表示
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  // ロゴ(アップロードされた「功夫之拳」ロゴ画像を使用):縮小状態から徐々にズームインして定位置へ
  const logoT = Math.max(0, Math.min(1, elapsed / LOGO_DUR));
  const logoScale = 0.35 + 0.65 * easeOutCubic(logoT);
  if (titleLogoImgLoaded) {
    const logoW = 300, logoH = logoW * titleLogoImg.height / titleLogoImg.width;
    const cx = W/2, cy = 12 + logoH/2;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, elapsed / (LOGO_DUR*0.4)));
    ctx.translate(cx, cy);
    ctx.scale(logoScale, logoScale);
    ctx.drawImage(titleLogoImg, -logoW/2, -logoH/2, logoW, logoH);
    ctx.restore();
  } else {
    drawKungfuDotTitle(W/2, 55);
  }

  // 主人公・飛び蹴りイラスト:ロゴ演出が終わってから画面下から所定位置までスライドイン
  const heroT = Math.max(0, Math.min(1, (elapsed - HERO_DELAY) / HERO_DUR));
  const heroEase = easeOutCubic(heroT);
  if (heroT >= 1) drawImpactBurst(W/2, 220, 55, 150, 'rgba(255,210,60,0.22)');
  if (titleHeroImgLoaded) {
    const imgW = 220, imgH = imgW * titleHeroImg.height / titleHeroImg.width;
    const finalY = GROUND_Y - imgH + 25;
    const startY = H + 20;
    const curY = startY + (finalY - startY) * heroEase;
    if (heroT > 0) ctx.drawImage(titleHeroImg, W/2 - imgW/2, curY, imgW, imgH);
  } else if (heroRefImgLoaded) {
    const imgW = 250, imgH = imgW * heroRefImg.height / heroRefImg.width;
    const finalY = GROUND_Y - imgH + 25;
    const startY = H + 20;
    const curY = startY + (finalY - startY) * heroEase;
    if (heroT > 0) ctx.drawImage(heroRefImg, W/2 - imgW/2, curY, imgW, imgH);
  } else if (heroT > 0) {
    // 画像読み込み前のフォールバック(ベクター描画)
    const heroW = 100, heroH = 190;
    const heroColors = { shirt: PAL.gi, skin: PAL.skin, skinShade: PAL.skinShade, hair: PAL.hair,
      belt: PAL.belt, wristCuff: '#1c1c1c', ankleCuff: '#e2e2e2', highlight: 'rgba(255,255,255,0.4)' };
    drawFighter(W/2 - heroW/2, 0, heroW, heroH, 1, heroColors, false, 0, 'kick', 1, false, true);
  }

  if (titleConfirming) {
    // ENTER確定演出:約1秒間、高速点滅させてから次の場面へ
    const flash = Math.floor(frame / 3) % 2 === 0;
    ctx.fillStyle = flash ? '#ffffff' : '#ff3333';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(t('pressAnyKey'), W/2, H-15);
  } else if (elapsed >= PROMPT_DELAY) {
    ctx.fillStyle = frame % 60 < 30 ? '#ffdd33' : '#aa8800';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(t('pressAnyKey'), W/2, H-15);
  }

  // スタジオロゴ(左上に控えめに表示)
  if (studioLogoImgLoaded) {
    const logoSize = 78;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(studioLogoImg, 8, 8, logoSize, logoSize);
    ctx.restore();
  }

  // 著作権表記(タイトル主畫面のみ右下に表示。黒縁取りで視認性を確保)
  ctx.save();
  ctx.textAlign = 'right';
  ctx.font = 'bold 12px monospace';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText('© Arc\'s Concept Game', W - 10, H - 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('© Arc\'s Concept Game', W - 10, H - 10);
  ctx.restore();
}

// ===== GAME OVER画面:[重新遊戲](難易度選択へ)/[返回主畫面](タイトルへ)の2択メニュー =====
function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff3333';
  ctx.font = 'bold 34px monospace';
  ctx.fillText(t('gameOver'), W/2, H/2 - 20);
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';
  ctx.fillText('SCORE ' + score, W/2, H/2 + 20);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#888';
  if (Date.now() >= gameOverStageClearInputUnlockTime) {
    ctx.fillText(t('pressAnyKeyContinue'), W/2, H - 16);
  }
}
// 排行榜閲覧後に表示する選択画面(重新挑戰/返回主畫面)
function drawPostGameChoice() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffdd33';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('SCORE ' + score, W/2, H/2 - 60);

  const items = [t('gameOverRetry'), t('gameOverToTitle')];
  drawMenuList(items, postGameChoiceIndex, H/2 - 4, 40);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('↑↓ / Enter', W/2, H - 16);
}

function drawOverlay(text, color, sub) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0,0,W,H);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 36px monospace';
  ctx.fillText(text, W/2, H/2-10);
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText(sub, W/2, H/2+30);
  ctx.font = '12px monospace';
  ctx.fillText('SCORE ' + score, W/2, H/2+55);
}

function drawStageClearOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0,0,W,H);
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 12 + Math.sin(frame*0.1)*4;
  ctx.lineWidth = 5; ctx.strokeStyle = '#1a1410';
  ctx.font = 'bold 34px monospace';
  ctx.strokeText(t('stageClear'), W/2, H/2-20);
  ctx.fillStyle = '#ffdd33';
  ctx.fillText(t('stageClear'), W/2, H/2-20);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '13px monospace';
  ctx.fillText('SCORE ' + score, W/2, H/2+15);
  ctx.fillStyle = frame % 40 < 20 ? '#fff' : '#888';
  ctx.font = '14px monospace';
  if (Date.now() >= gameOverStageClearInputUnlockTime) {
    ctx.fillText(t('pressAnyKeyContinue'), W/2, H/2+45);
  }
}

// ================= モバイル用バーチャルボタン =================
function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
}
// touch-action:manipulationだけでは一部の古いブラウザでダブルタップズームを防げないため、
// 短時間に連続したtouchendが発生した場合はズームさせないよう念のため直接抑止する
(function preventDoubleTapZoom() {
  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd <= 350) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
})();
// CSSのtouch-action:noneだけでは一部のモバイルブラウザ(特にiOS Safari)で
// 上下ドラッグ時のページスクロール/バウンスを防ぎきれないため、
// document全体のtouchmoveを直接抑止して二重に防止する
// (このページにスクロールさせたいコンテンツは存在しないため、常に抑止して問題ない)
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

function touchDpadPress(dir, pressed) {
  if (state === 'menu') {
    if (!pressed) return;
    if (menuScreen === 'historyArticle') {
      if (dir === 'up') {
        if (historyArticleIndex === 2 && historyScroll <= 0) aboutFanPageFocused = true;
        else { aboutFanPageFocused = false; historyScroll -= 60; }
      } else if (dir === 'down') {
        if (aboutFanPageFocused) aboutFanPageFocused = false;
        else historyScroll += 60;
      }
      return;
    }
    if (dir === 'up') menuMove(-1);
    else if (dir === 'down') menuMove(1);
    else if (dir === 'left') menuAdjust(-1);
    else if (dir === 'right') menuAdjust(1);
    return;
  }
  if (state === 'paused') {
    if (!pressed) return;
    if (dir === 'up') pauseMove(-1);
    else if (dir === 'down') pauseMove(1);
    return;
  }
  if (state === 'nameEntry') {
    if (!pressed) return;
    if (dir === 'up') cycleNameEntryChar(1);
    else if (dir === 'down') cycleNameEntryChar(-1);
    return;
  }
  if (state === 'leaderboard') {
    if (!pressed) return;
    if (dir === 'left') leaderboardSwitchTab(-1);
    else if (dir === 'right') leaderboardSwitchTab(1);
    else if (dir === 'up') leaderboardSwitchPage(-1);
    else if (dir === 'down') leaderboardSwitchPage(1);
    return;
  }
  // ゲームプレイ中はキーボードの方向キーと同じ扱いにする
  const map = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  keys[map[dir]] = pressed;
}

function touchActionPress(role, pressed) {
  // role: 'punch'(=J/KeyZ、長押しで波動拳) | 'kick'(=K/KeyX)
  if (state === 'menu') {
    if (!pressed) return;
    if (menuScreen === 'historyArticle') {
      if (role === 'punch' && aboutFanPageFocused) { window.open(FAN_PAGE_URL, '_blank', 'noopener,noreferrer'); return; }
      menuScreen = 'history'; menuIndex = historyArticleIndex; aboutFanPageFocused = false;
      return;
    }
    if (role === 'punch') menuConfirm(); else menuBack();
    return;
  }
  if (state === 'paused') {
    if (!pressed) return;
    if (role === 'punch') pauseConfirm(); else pauseBack();
    return;
  }
  if (state === 'nameEntry') {
    if (!pressed) return;
    if (role === 'punch') confirmNameEntrySlot(); else nameEntryStepBack();
    return;
  }
  if (state === 'leaderboard') {
    if (!pressed) return;
    if (role === 'punch') leaderboardConfirm(); else leaderboardBack();
    return;
  }
  if (state === 'gameover') {
    if (!pressed || Date.now() < gameOverStageClearInputUnlockTime) return;
    proceedToNameEntry('gameover');
    return;
  }
  if (state === 'stageclear') {
    if (!pressed || Date.now() < gameOverStageClearInputUnlockTime) return;
    stopStageClearMusic();
    proceedToNameEntry('stageclear');
    return;
  }
  if (state === 'postGameChoice') {
    if (!pressed) return;
    if (role === 'punch') confirmPostGameChoice();
    else { postGameChoiceIndex = 1 - postGameChoiceIndex; playMenuMoveSfx(); } // 踢=選択切替、拳=確定
    return;
  }
  if (state === 'start' || state === 'story') {
    if (!pressed) return;
    handlePrimaryPress(true);
    return;
  }
  keys[role === 'punch' ? 'KeyZ' : 'KeyX'] = pressed;
}

function bindTouchButton(el, onPress) {
  if (!el) return;
  const start = e => { e.preventDefault(); if (!assetsReady()) return; initAudio(); onPress(true); el.classList.add('pressed'); };
  const end = e => { e.preventDefault(); onPress(false); el.classList.remove('pressed'); };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', end);
  el.addEventListener('contextmenu', e => e.preventDefault());
}

// バーチャル方向スティック(円形):ジャンプは専用ボタンがあるため、左・右・下の3方向のみ判定する
function setupVirtualStick() {
  const stick = document.getElementById('tStick');
  const knob = document.getElementById('tStickKnob');
  if (!stick || !knob) return;
  let activePointerId = null;
  let centerX = 0, centerY = 0;

  function maxRadius() { return stick.getBoundingClientRect().width * 0.28; }

  let stickPrevLeft = false, stickPrevRight = false, stickPrevDown = false; // 前回の方向状態(edge検出用)
  function updateDirection(dx, dy, radius) {
    const threshold = 0.35; // 中心からの距離がこの割合を超えたら方向入力とみなす
    const nx = dx / radius, ny = dy / radius;
    const mag = Math.min(1, Math.hypot(nx, ny));
    let left = false, right = false, down = false;
    if (mag > threshold) {
      if (Math.abs(nx) > Math.abs(ny)) { if (nx > 0) right = true; else left = true; }
      else if (ny > 0) { down = true; } // 上方向はここでは無視する(ジャンプは専用ボタン)
    }
    // pointermoveは1秒間に何度も発火するため、状態が実際に変化した時だけtouchDpadPressを呼ぶ
    // (メニュー画面などで押しっぱなし扱いになり、選択が異常な速さで進んでしまうのを防ぐ)
    if (left !== stickPrevLeft) touchDpadPress('left', left);
    if (right !== stickPrevRight) touchDpadPress('right', right);
    if (down !== stickPrevDown) touchDpadPress('down', down);
    stickPrevLeft = left; stickPrevRight = right; stickPrevDown = down;
  }

  function start(e) {
    e.preventDefault();
    initAudio();
    activePointerId = e.pointerId;
    const rect = stick.getBoundingClientRect();
    centerX = rect.left + rect.width/2;
    centerY = rect.top + rect.height/2;
    knob.classList.add('pressed');
    move(e);
  }
  function move(e) {
    if (e.pointerId !== activePointerId) return;
    e.preventDefault();
    const radius = maxRadius();
    let dx = e.clientX - centerX, dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) { dx = dx/dist*radius; dy = dy/dist*radius; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    updateDirection(dx, dy, radius);
  }
  function end(e) {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    knob.classList.remove('pressed');
    knob.style.transform = 'translate(0px, 0px)';
    touchDpadPress('left', false);
    touchDpadPress('right', false);
    touchDpadPress('down', false);
    stickPrevLeft = false; stickPrevRight = false; stickPrevDown = false;
  }
  stick.addEventListener('pointerdown', start);
  stick.addEventListener('pointermove', move);
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);
  stick.addEventListener('pointerleave', end);
  stick.addEventListener('contextmenu', e => e.preventDefault());
}

function setupTouchControls() {
  if (!isTouchDevice()) return;
  const controls = document.getElementById('touchControls');
  const pauseBtn = document.getElementById('tPause');
  if (controls) controls.classList.add('active');
  if (pauseBtn) pauseBtn.style.display = 'flex';
  const hint = document.getElementById('hint');
  if (hint) hint.style.display = 'none';

  setupVirtualStick();
  bindTouchButton(document.getElementById('tPunch'), p => touchActionPress('punch', p));
  bindTouchButton(document.getElementById('tKick'),  p => touchActionPress('kick', p));
  bindTouchButton(document.getElementById('tJump'),  p => touchDpadPress('up', p));
  bindTouchButton(document.getElementById('tParry'), p => { if (p && state === 'playing') tryParry(); });
  bindTouchButton(pauseBtn, p => {
    if (!p) return;
    initAudio();
    if (state === 'playing') enterPause();
    else if (state === 'paused') pauseBack();
  });

  // 画面幅に合わせてゲーム全体(枠込み)を自動的に縮小フィットさせる
  // (x1/x2/x3の表示設定とは別に、モバイルではみ出さないようCSS transformで調整する)
  function fitMobileScreen() {
    const gameWrap = document.getElementById('gameWrap');
    if (!gameWrap) return;
    gameWrap.style.transform = 'scale(1)';
    const rect = gameWrap.getBoundingClientRect();
    const availW = window.innerWidth * 0.96;
    const availH = window.innerHeight * 0.6; // 下部のバーチャルボタン分を確保
    const factor = Math.min(1, availW / rect.width, availH / rect.height);
    gameWrap.style.transform = `scale(${factor})`;
    gameWrap.style.transformOrigin = 'top center';
    // PAUSEボタンは下部の仮想スティック/アクションボタン群と重なって押せなくなる不具合があったため、
    // 画面下へ再配置するのをやめ、CSSで指定した画面右上に固定して常に確実に押せるようにする
  }
  fitMobileScreen();
  window.addEventListener('resize', fitMobileScreen);
  window.addEventListener('orientationchange', () => setTimeout(fitMobileScreen, 200));
}

// ================= Loop =================
buildKungfuDotTitle();
buildHeroDotSilhouette();
loadSettings();
loadLeaderboard();
applyMusicVolume();
applySfxVolume();
applyDisplayScale();
updateGamepadHintUI();
updateControlHintText();
setupTouchControls();
function loop() {
  frame++;
  try {
    if (assetsReady()) {
      // 自動再生がブロックされた場合の保険:タイトル画面表示中は毎フレーム再生を試みる
      if (state === 'start' && !titleConfirming && titleThemeAudio.paused) playChinaMusic();
      pollGamepad();
      update();
    }
    draw(); // draw() 自体は讀取中でも呼び続ける(内部で讀取畫面を表示するため)
  } catch (err) {
    // 何らかの予期しないエラーが発生しても、ループ自体は止めずに継続する
    // (エラー発生時にゲーム全体が無反応になってしまうのを防ぐため)
    console.error('game loop error:', err);
  }
  requestAnimationFrame(loop);
}
loop();
