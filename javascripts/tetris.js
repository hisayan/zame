var COLS = 11, ROWS = 21;  // 盤面のマスの数
var board = [];  // 盤面の状態を保持する変数
var gameMode = false;  // ゲーム中か（一番うえまで積み重なっちゃったかどうかフラグ）
var reverseMode = false; // リバースモード
var highscoreMode = false; // HighScore 表示中
var interval;  // ゲームタイマー保持用変数
var current; // 現在操作しているブロック
var currentX, currentY; // 現在操作しているブロックのいち
var score = 0;
// var countDownStart = 600;  // 1分30秒
// var countDownTimer = 0;
// var countDownHandler;
var color_index = 0;
init();

// ブロックのパターン
var shapes = [
  [ 1, 1, 1, 1],
  [ 1, 1, 1, 0,
    1 ],
  [ 1, 1, 1, 0,
    0, 0, 1 ],
  [ 1, 1, 0, 0,
    1, 1 ],
  [ 1, 1, 0, 0,
    0, 1, 1 ],
  [ 0, 1, 1, 0,
    1, 1 ],
  [ 0, 1, 0, 0,
    1, 1, 1 ]
];
/*base
var shapes = [
  [ 1, 1, 1, 1 ],
  [ 1, 1, 1, 0,
    1 ],
  [ 1, 1, 1, 0,
    0, 0, 1 ],
  [ 1, 1, 0, 0,
    1, 1 ],
  [ 1, 1, 0, 0,
    0, 1, 1 ],
  [ 0, 1, 1, 0,
    1, 1 ],
  [ 0, 1, 0, 0,
    1, 1, 1 ]
];*/
// ブロックの色
var colors = [
  '#a5e220', '#f2ca20', 'blue', 'yellow', 'red', 'green', 'purple'
];
var colorsCircle = [
  '#45e220', '#82ca20', '#000088', '#008888', '#880000', '#008800', '#888800'
];
var kenkenpa = [];

function hoge(){
  console.log("hoge");
}

function fallShape(shape){
  console.log(shape);
}

//ブロックの生成を行う
function newShape() {
   player_ix = 0;
   block_create_time =new Date().getTime();
   color_index = (color_index + 1 ) % 7;
}

function fallShape(shape){
  //var id = Math.floor( Math.random() * shapes.length );  // ランダムにインデックスを出す
  //var shape = shapes[ id ];
  // パターンを操作ブロックへセットする
  current = [];
  for ( var y = 0; y < 4; ++y ) {
    current[ y ] = [];
    for ( var x = 0; x < 4; ++x ) {
      var i = 4 * y + x;
      if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
        current[ y ][ x ] = color_index + 1;
      }
      else {
        current[ y ][ x ] = 0;
      }
    }
  }
  // ブロックを盤面の上のほうにセットする
  currentX = 4;
  currentY = 0;
  
  // TODO: 田中さん そして操作は最初のプレイヤーに
  player_ix = 1;
}
/*
function newShape() {
  // TODO: 田中さん ここをひとりめの操作に
  player_ix = 0;
  
  var id = Math.floor( Math.random() * shapes.length );  // ランダムにインデックスを出す
  var shape = shapes[ id ];
  // パターンを操作ブロックへセットする
  current = [];
  for ( var y = 0; y < 4; ++y ) {
    current[ y ] = [];
    for ( var x = 0; x < 4; ++x ) {
      var i = 4 * y + x;
      if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
        current[ y ][ x ] = id + 1;
      }
      else {
        current[ y ][ x ] = 0;
      }
    }
  }
  // ブロックを盤面の上のほうにセットする
  currentX = 4;
  currentY = 0;
  
  // TODO: 田中さん そして操作は最初のプレイヤーに
  player_ix = 1;
}
*/
// 盤面を空にする
function init() {
  document.getElementById( 'gameover' ).style.display = 'none';
  for ( var y = 0; y < ROWS; ++y ) {
    board[ y ] = [];
    for ( var x = 0; x < COLS; ++x ) {
      board[ y ][ x ] = 0;
    }
  }

  current = [];
  for ( var y = 0; y < 4; ++y ) {
    current[ y ] = [];
    for ( var x = 0; x < 4; ++x ) {
      current[ y ][ x ] = 0;
    }
  }
  
  player_ix = 0;
}

// newGameで指定した秒数毎に呼び出される関数。
// 操作ブロックを下の方へ動かし、
// 操作ブロックが着地したら消去処理、ゲームオーバー判定を行う
function tick() {
  if (! gameMode) {
    // もしゲームオーバなら最初から始める
    // newGame();
    clearInterval(interval);
    bgm = document.getElementById( 'gamesound' );
    bgm.pause();
    bgm.currentTime = 0;
    return false;
  }

  // １つ下へ移動する
  if(player_ix != 0){
    if ( valid( 0, 1 ) ) {
      ++currentY;
      player_ix = Math.floor(currentY / 7) + 1;
    }
    // もし着地していたら(１つしたにブロックがあったら)
    else {
      freeze();  // 操作ブロックを盤面へ固定する
      clearLines();  // ライン消去処理
      if (player_rotate >= 2) {
        player_rotate = 0;
      }else{
        player_rotate++;
      }
      // 新しい操作ブロックをセットする
      newShape();
    }
  }
}

// 操作ブロックを盤面にセットする関数
function freeze() {
  for ( var y = 0; y < 4; ++y ) {
    for ( var x = 0; x < 4; ++x ) {
      if ( current[ y ][ x ] ) {
        board[ y + currentY ][ x + currentX ] = current[ y ][ x ];
      }
    }
  }
}

// 操作ブロックを回す処理
function rotate( current ) {
  var newCurrent = [];
  for ( var y = 0; y < 4; ++y ) {
    newCurrent[ y ] = [];
    for ( var x = 0; x < 4; ++x ) {
      newCurrent[ y ][ x ] = current[ 3 - x ][ y ];
    }
  }
  return newCurrent;
}

//ブロックが消えたときの音楽
// $(function(){
//     xhr = new XMLHttpRequest();
//     xhr.open('POST', 'https://api.apigw.smt.docomo.ne.jp/voiceText/v1/textToSpeech?APIKEY=356f52666148512e4f31364779626b35314a714a37364a47784c36773071576644637a2e44444f6b746141', true);
//
//     xhr.responseType = 'arraybuffer'
//     xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
//     var datax = "text=３５億&speaker=hikari&emotion=happiness&emotion_level=2&format=ogg";
//
//     xhr.onload = function (e) {
//         if( this.status == 200){
//             view = new Uint8Array(this.response);
//             blob = new Blob([view], { "type" : "audio/wav" });
//             URL = window.URL || window.webkitURL;
//
//             audio = new Audio(URL.createObjectURL(blob));
//             audio.play();
//         }
//     };
//     data = datax;
//     xhr.send(data);
// });

// 一行が揃っているか調べ、揃っていたらそれらを消す
function clearLines() {
  var clearLines_count = 0;
  for ( var y = ROWS - 1; y >= 0; --y ) {
    var rowFilled = true;
    // 一行が揃っているか調べる
    for ( var x = 0; x < COLS; ++x ) {
      if ( board[ y ][ x ] == 0 ) {
        rowFilled = false;
        break;
      }
    }
    // もし一行揃っていたら, サウンドを鳴らしてそれらを消す。
    if ( rowFilled ) {
        clearLines_count++;
      
//      document.getElementById( 'clearsound' ).play();  // 消滅サウンドを鳴らす
      // その上にあったブロックを一つずつ落としていく
      for ( var yy = y; yy > 0; --yy ) {
        for ( var x = 0; x < COLS; ++x ) {
          board[ yy ][ x ] = board[ yy - 1 ][ x ];
        }
      }
      ++y;  // 一行落としたのでチェック処理を一つ下へ送る
    }
  }
  
  console.log("clearLines", clearLines_count);
  if (clearLines_count > 0) {
    document.getElementById( 'clearline' ).play();
    addScore((clearLines_count ** 2) * 100);  
  } else {
    playSE(document.getElementById( 'ground' ));
  }
}

// キーボードが押された時に呼び出される関数
function keyPress( key ) {
  
  switch ( key ) {
    case 'start':
      newGame();
      return;
  }
  
  if (! gameMode) return;
  
  switch ( key ) {
  case 'left':
    if (reverseMode) {
      if ( valid( 1 ) ) {
        ++currentX;  // 左に一つずらす
        playSE(document.getElementById( 'move' ));
      }  
    } else {
      if ( valid( -1 ) ) {
        --currentX;  // 左に一つずらす
        playSE(document.getElementById( 'move' ));
      }  
    }
    checkKenpa(1);
    break;
  case 'right':
    if (reverseMode) {
      if ( valid( -1 ) ) {
        --currentX;  // 右に一つずらす
        playSE(document.getElementById( 'move' ));
      }
    } else {
      if ( valid( 1 ) ) {
        ++currentX;  // 右に一つずらす
        playSE(document.getElementById( 'move' ));
      }
    }
    checkKenpa(1);
    break;
  case 'down':
    if ( valid( 0, 1 ) ) {
      ++currentY;  // 下に一つずらす
      addScore(1);
    }
    break;
  case 'rotate':
    // 操作ブロックを回す
    var rotated = rotate( current );
    if ( valid( 0, 0, rotated ) ) {
      current = rotated;  // 回せる場合は回したあとの状態に操作ブロックをセットする
      playSE(document.getElementById( 'move' ));
    }
    checkKenpa(2);
    break;
  case 'reverse':   
    if (gameMode) { 
      if (reverseMode) {
        document.getElementById( 'reverseend' ).play();            
        reverseMode = false;
        $("#logo").addClass('normal').removeClass('reverse');
      } else {
        document.getElementById( 'reversestart' ).play();                  
        reverseMode = true;      
        $("#logo").addClass('reverse').removeClass('normal');
      }
    }
    break;
  case 'highscore':
    highscoreMode = true;
    // preload について要確認。これ true にしたら height が合う
    showHighscore();
    break;
  }
}

function showHighscore(score) {
  $.fancybox.open( {
    "caption" : "High Score", "src" : "/ranking.html?score=" + score, "type" : "iframe" , "iframe":{preload : true},
    "infobar" : false, "toolbar": false,
    "autoFocus" : true,
    "afterShow": function(){console.log("afterShow");$(".fancybox-iframe").focus()	;},
    "afterClose":function(){highscoreMode = false;}
  });
}

function checkKenpa(kenpa) {
  var l = kenkenpa.length;
  var master = [1,2,1,2,1,1,2];

  if (kenpa == 1)   document.getElementById( 'audioken' ).play();
  if (kenpa == 2)   document.getElementById( 'audiopa' ).play();

  addScore(kenpa);

  if (master[l] == kenpa) {
    kenkenpa.push(kenpa);
    if (kenkenpa.length == 7) {
      renderKenpa();
      addScore(1000);
      document.getElementById( 'audiokenkenpa' ).play();      
      kenkenpa = [];
      setTimeout(renderKenpa, 1000);
      return;
    }
  } else {
    kenkenpa = [];
  }
  renderKenpa();
  // console.log(kenpa, kenkenpa.length, kenkenpa);
}

function renderKenpa() {
  for(var i = 0 ; i < 7; i++ ) {
    if (kenkenpa[i]) {
      $('.kenpa' + (i + 1) + '.on').show();
      $('.kenpa' + (i + 1) + '.off').hide();
    } else {
      $('.kenpa' + (i + 1) + '.on').hide();
      $('.kenpa' + (i + 1) + '.off').show();
    }
  }
}

// 指定された方向に、操作ブロックを動かせるかどうかチェックする
// ゲームオーバー判定もここで行う
function valid( offsetX, offsetY, newCurrent ) {
  offsetX = offsetX || 0;
  offsetY = offsetY || 0;
  offsetX = currentX + offsetX;
  offsetY = currentY + offsetY;
  newCurrent = newCurrent || current;
  for ( var y = 0; y < 4; ++y ) {
    for ( var x = 0; x < 4; ++x ) {
      if ( newCurrent[ y ][ x ] ) {
        if ( typeof board[ y + offsetY ] == 'undefined'
             || typeof board[ y + offsetY ][ x + offsetX ] == 'undefined'
             || board[ y + offsetY ][ x + offsetX ]
             || x + offsetX < 0
             || y + offsetY >= ROWS
             || x + offsetX >= COLS ) {
               if (offsetY == 1 && offsetX-currentX == 0 && offsetY-currentY == 1 && gameMode){
                 console.log('game over');
                 gameMode = false; // もし操作ブロックが盤面の上にあったらゲームオーバーにする
                 const audioGameover = document.getElementById( 'audio_gameover' );
                 audioGameover.volume=0.1;
                 audioGameover.play();
                 document.getElementById( 'gameover' ).style.display = 'block';
                 
                // clearTimeout(countDownHandler);
                // setTimeout(function(){showHighscore(score)}, 2000);
               }
               return false;
             }
      }
    }
  }
  return true;
}

function newGame() {
  document.getElementById( 'audiostart' ).play();
  
  clearInterval(interval);  // ゲームタイマーをクリア
  init();  // 盤面をまっさらにする
  newShape();  // 新しい
  kenkenpa = [];
  renderKenpa();
  score = 0;
  addScore(0);
  
  gameMode = true;
  block_create_time = new Date().getTime();     
  reverseMode = false;
  $("#logo").addClass('normal').removeClass('reverse');
  
  // countDownTimer = countDownStart;
  // showTimer();
  // countDownHandler = setTimeout(countDown, 1000);

  interval = setInterval( tick, 1000 );  // 250ミリ秒ごとにtickという関数を呼び出す
  // document.getElementById( 'gamesound' ).stop(); //ゲーム中に流れる音楽
  bgm = document.getElementById( 'gamesound' );
  bgm.pause();
  bgm.currentTime = 0;
  bgm.volume=0.05;
  bgm.play(); //ゲーム中に流れる音楽  
}

// function showTimer(){
//   var s = countDownTimer % 60;
//   var m = (countDownTimer - s) / 60;
//   var ss = ("00" + s).slice(-2);
//   var mm = ("00" + m).slice(-2);
//   $("#time").html(
//     '<img src="/images/numbers/' + mm.slice(0,1) + '.png" /><img src="/images/numbers/' + mm.slice(1,2) + '.png" />:<img src="/images/numbers/' + ss.slice(0,1) + '.png" /><img src="/images/numbers/' + ss.slice(1,2) + '.png" />'
//   );  
// }

// function countDown(){
//   countDownTimer--;
//   showTimer();
//   if (countDownTimer == 0) {
//     console.log('time is up');
//     tick();
//     gameMode = false;
//     document.getElementById( 'timeisup' ).play();
//     setTimeout(function(){showHighscore(score)}, 2000);
//   } else {
//     countDownHandler = setTimeout(countDown, 1000);    
//   }
// }

function playSE(se) {
  se.pause();
  se.currentTime = 0;
  se.play();
}

function addScore(s){
  if (! gameMode) return;

  score = score + s;
  // console.log(score);
  // $("#score").text(score);
  var t = score;
  var a = 0;
  if (t == 0) {
    $("#score").html("<img src='/images/numbers/0.png' />");    
  } else {
    $("#score").html("");    
    while (t != 0) {
      a = t % 10;
      t = (t - a) / 10;
      $("#score").prepend("<img src='/images/numbers/" + a + ".png' />");
    }    
  }
  // $("#score").text(score);  
}
// newGame();  // ゲームを開始する
