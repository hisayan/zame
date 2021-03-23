/*
 現在の盤面の状態を描画する処理
 */
var canvas = document.getElementsByTagName( 'canvas' )[ 0 ];  // キャンバス
var ctx = canvas.getContext( '2d' ); // コンテクスト
var W = 330, H = 630;  // キャンバスのサイズ
var BLOCK_W = W / COLS, BLOCK_H = H / ROWS;  // マスの幅を設定

// x, yの部分へマスを描画する処理
function drawBlock( x, y ) {
  ctx.fillRect( BLOCK_W * x, BLOCK_H * y, BLOCK_W - 1 , BLOCK_H - 1 );
  ctx.strokeRect( BLOCK_W * x, BLOCK_H * y, BLOCK_W - 1 , BLOCK_H - 1 );
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.arc(BLOCK_W * x + (BLOCK_W / 2) , BLOCK_H * y + (BLOCK_H / 2), BLOCK_W / 8, 0, 360,false);
  ctx.stroke();
}

var background = new Image();
background.src = "/images/bg.png";

var blocks = [];
for (var i = 1; i <= 7 ; i++) {
  var img = new Image();
  img.src = "/images/block0" + i + ".png";
  blocks.push(img);
}


// 盤面と操作ブロックを描画する
function render() {
  ctx.clearRect( 0, 0, W, H );  // 一度キャンバスを真っさらにする
  ctx.drawImage( background, 0, 0 );
  ctx.strokeStyle = 'black';  // えんぴつの色を黒にする

  // 盤面を描画する
  for ( var x = 0; x < COLS; ++x ) {
    for ( var y = 0; y < ROWS; ++y ) {
      if ( board[ y ][ x ] ) {  // マスが空、つまり0ゃなかったら
        // ctx.fillStyle = colors[ board[ y ][ x ] - 1 ];  // マスの種類に合わせて塗りつぶす色を設定
        // ctx.strokeStyle = colorsCircle[ board[ y ][ x ] - 1 ];
        // drawBlock( x, y );  // マスを描画        
        ctx.drawImage(blocks[board[ y ][ x ] - 1], BLOCK_W * (x), BLOCK_H * (y));
      }
    }
  }

  // 操作ブロックを描画する
  for ( var y = 0; y < 4; ++y ) {
    for ( var x = 0; x < 4; ++x ) {
      if ( current[ y ][ x ] ) {
        // ctx.fillStyle = colors[ current[ y ][ x ] - 1 ];  // マスの種類に合わせて塗りつぶす色を設定
        // ctx.strokeStyle = colorsCircle[ current[ y ][ x ] - 1 ];
        // drawBlock( currentX + x, currentY + y );  // マスを描画
        ctx.drawImage(blocks[ current[ y ][ x ] - 1], BLOCK_W * (currentX + x), BLOCK_H * (currentY + y));
      }
    }
  }
}

// 30ミリ秒ごとに状態を描画する関数を呼び出す
setInterval( render, 30 );
