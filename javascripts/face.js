// Our input frames will come from here.
const videoElement =
  document.getElementsByClassName('input_video')[0];
let canvasElement =
  document.getElementsByClassName('output_canvas')[0];
const controlsElement =
  document.getElementsByClassName('control-panel')[0];
const playerElement = document.getElementsByClassName('player_canvas');
for (var i=0;i<playerElement.length;i++){
  playerElement[i].getContext('2d').translate(playerElement[i].width, 0);
  playerElement[i].getContext('2d').scale(-1,1);
}
let canvasCtx = canvasElement.getContext('2d');
let player_ix = 0;
let player_rotate = 0;
let grip_time = 0;
let grip_status = 0;
let block_create_time  = 0;

// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new FPS();

// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
  videoElement.style.display = 'none';
};

function removeElements(landmarks, elements) {
  for (const element of elements) {
    delete landmarks[element];
  }
}

function removeLandmarks(results) {
  if (results.poseLandmarks) {
    removeElements(
      results.poseLandmarks,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]);
  }
}

function connect(ctx, connectors) {
  const canvas = ctx.canvas;
  for (const connector of connectors) {
    const from = connector[0];
    const to = connector[1];
    if (from && to) {
      if (from.visibility && to.visibility &&
        (from.visibility < 0.1 || to.visibility < 0.1)) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
      ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
      ctx.stroke();
    }
  }
}

function createShape(rightHandLandmarks, leftHandLandmarks){
  
  var now = new Date();
  var shape = [0, 0, 0, 0, 0, 0, 0, 0];

  if(rightHandLandmarks){
    var right_degree = Math.atan2( rightHandLandmarks[4].y - rightHandLandmarks[8].y, 
                            rightHandLandmarks[4].x - rightHandLandmarks[8].x )  * ( 180 / Math.PI );
    if(right_degree < 36){
      shape[0] = 1;
      shape[1] = 1;
    } 
    else if( right_degree < 72){
      shape[0] = 1;
      shape[5] = 1;      
    }
    else if(right_degree < 108){
      shape[0] = 1;
      shape[4] = 1;      
    }
    else if(right_degree < 144){
      shape[1] = 1;
      shape[4] = 1;
    }
    else{
      shape[4] = 1;
      shape[5] = 1;      
    }
  }
      
  if(leftHandLandmarks){
        
    var left_degree = Math.atan2( leftHandLandmarks[4].y -leftHandLandmarks[8].y, 
                              leftHandLandmarks[4].x - leftHandLandmarks[8].x )  * ( 180 / Math.PI );
    if(left_degree < 36){
      shape[2] = 1;
      shape[3] = 1;
    } 
    else if( left_degree < 72){
      shape[2] = 1;
      shape[7] = 1;      
    }
    else if(left_degree < 108){
      var offset =  shape[0] && shape[4] ?  1: 0;
          
      shape[2 -offset] = 1;
      shape[6 - offset] = 1;      
    }
    else if(left_degree < 144){
      shape[3] = 1;
      shape[6] = 1;
    }
    else{
      shape[6] = 1;
      shape[7] = 1;      
    }
  }

  var dummy_current = [];
  for ( var y = 0; y < 4; ++y ) {
    dummy_current[ y ] = [];
    for ( var x = 0; x < 4; ++x ) {
      var i = 4 * y + x;
      if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
        dummy_current[ y ][ x ] = color_index + 1;
      }
      else {
        dummy_current[ y ][ x ] = 0;
      }
    }
  }      
  // 0 4
  // 操作ブロックを描画する
  for ( var y = 0; y < 4; ++y ) {
    for ( var x = 0; x < 4; ++x ) {
      if ( dummy_current[ y ][ x ] ) {
        //496, 279
        canvasCtx.drawImage(blocks[ dummy_current[ y ][ x ] - 1],
                40 * (5 + x) + (W - 40 * 8)/2 , 
                40 * (0 + y) + 180, 40 ,40);
        //canvasCtx.drawImage(blocks[ dummy_current[ y ][ x ] - 1], BLOCK_W * (5 + x) + (496 - (496/11) * 4)/2 , BLOCK_H * (0 + y) + 200);
      }
    }
  }
  
  if(now.getTime() -  block_create_time > 2000){
        
    if(leftHandLandmarks || rightHandLandmarks){
      fallShape(shape);
    }
    else{      //決まらなかったらランダムで作成
      var id = Math.floor( Math.random() * shapes.length );  // ランダムにインデックスを出す
      fallShape(shapes[ id ]);
    }        
  }
}


function gameStart(rightHandLandmarks, leftHandLandmarks){
  
  var is_grip_right_hand = false;
  var is_grip_left_hand = false;

  //右手握ったか判定
  if(rightHandLandmarks){
    var hand_degree = Math.atan2( rightHandLandmarks[17].y -rightHandLandmarks[0].y, 
                        rightHandLandmarks[17].x - rightHandLandmarks[0].x )  * ( 180 / Math.PI );
    //手が下を向いていおらず、
    //指の第一関節の位置が、付け根より下にあるかどうか
    if( hand_degree > -120 && hand_degree < -60 && 
           rightHandLandmarks[0].y > rightHandLandmarks[17].y &&
            rightHandLandmarks[7].y > rightHandLandmarks[5].y &&
            rightHandLandmarks[11].y > rightHandLandmarks[9].y &&
            rightHandLandmarks[15].y > rightHandLandmarks[13].y &&
            rightHandLandmarks[20].y > rightHandLandmarks[17].y){
            is_grip_right_hand = true;
    }
  }
  
  //左手握ったか判定
  if(leftHandLandmarks){
    var hand_degree = Math.atan2( leftHandLandmarks[17].y -leftHandLandmarks[0].y, 
                        leftHandLandmarks[17].x - leftHandLandmarks[0].x )  * ( 180 / Math.PI );
  
    //手が下を向いていおらず、
    //指の第一関節の位置が、付け根より下にあるかどうか
    if( hand_degree > -120 && hand_degree < -60 &&
        leftHandLandmarks[0].y > leftHandLandmarks[17].y &&
        leftHandLandmarks[7].y > leftHandLandmarks[5].y &&
        leftHandLandmarks[11].y > leftHandLandmarks[9].y &&
        leftHandLandmarks[15].y > leftHandLandmarks[13].y &&
        leftHandLandmarks[20].y > leftHandLandmarks[17].y){
        is_grip_left_hand = true;

    }
  }
  
  if(is_grip_right_hand && is_grip_left_hand){
    keyPress('start')    
  }
    
}

function gripAction(rightHandLandmarks, leftHandLandmarks, faceLandmarks){
  
  var now = new Date();
    
  var is_grip_right_hand = false;
  var is_grip_left_hand = false;
  var is_down_face = false;
  
  //右手握ったか判定
  if(rightHandLandmarks){
    var hand_degree = Math.atan2( rightHandLandmarks[17].y -rightHandLandmarks[0].y, 
                        rightHandLandmarks[17].x - rightHandLandmarks[0].x )  * ( 180 / Math.PI );
    //手が下を向いていおらず、
    //指の第一関節の位置が、付け根より下にあるかどうか
    if( hand_degree > -120 && hand_degree < -60 && 
           rightHandLandmarks[0].y > rightHandLandmarks[17].y &&
            rightHandLandmarks[7].y > rightHandLandmarks[5].y &&
            rightHandLandmarks[11].y > rightHandLandmarks[9].y &&
            rightHandLandmarks[15].y > rightHandLandmarks[13].y &&
            rightHandLandmarks[20].y > rightHandLandmarks[17].y){
            is_grip_right_hand = true;
    }
  }
  
  //左手握ったか判定
  if(leftHandLandmarks){
    var hand_degree = Math.atan2( leftHandLandmarks[17].y -leftHandLandmarks[0].y, 
                        leftHandLandmarks[17].x - leftHandLandmarks[0].x )  * ( 180 / Math.PI );
  
    //手が下を向いていおらず、
    //指の第一関節の位置が、付け根より下にあるかどうか
    if( hand_degree > -120 && hand_degree < -60 &&
        leftHandLandmarks[0].y > leftHandLandmarks[17].y &&
        leftHandLandmarks[7].y > leftHandLandmarks[5].y &&
        leftHandLandmarks[11].y > leftHandLandmarks[9].y &&
        leftHandLandmarks[15].y > leftHandLandmarks[13].y &&
        leftHandLandmarks[20].y > leftHandLandmarks[17].y){
        is_grip_left_hand = true;

    }
  }
  
  
  if(faceLandmarks){
    var face_degree = Math.atan2( faceLandmarks[10].y -faceLandmarks[152].y, 
                        faceLandmarks[10].z - faceLandmarks[152].z )  * ( 180 / Math.PI );
    if( face_degree < - 104){
      is_down_face = true;
    }
  }
  
  //両手が握られてる場合（回転）
  if(is_grip_right_hand && is_grip_left_hand){
    
    if(grip_status != 1 || (grip_status == 1 &&now.getTime()  - grip_time > 800)){
      //回転
      keyPress('rotate');
      grip_time = now.getTime();      
      
    }
    grip_status = 1;
  }
  //右移動
  else if(is_grip_right_hand){
    
    if(grip_status == 0 || (grip_status == 2 && now.getTime()  - grip_time > 500)){
      //移動
      keyPress('right');
      grip_time = now.getTime();
    }
    
    grip_status = 2;
  }
  //左移動
  else if(is_grip_left_hand){
    
    if(grip_status == 0 || (grip_status == 3 && now.getTime()  - grip_time > 500)){
      keyPress('left');      
      grip_time = now.getTime();
    }
    
    grip_status = 3;
  }
  else if(is_down_face){
    if(grip_status == 0 || (grip_status == 4 && now.getTime()  - grip_time > 400)){
      keyPress('down');      
      grip_time = now.getTime();
    }
    
    grip_status = 4;
  }
  else{
    //console.log("NONE");
    grip_time = 0;
    grip_status = 0;
  }
}

var drag_right_hand = -1;
var drag_left_hand = -1;

function dragAction(rightHandLandmarks, leftHandLandmarks, faceLandmarks){
  
  var now = new Date();
  var is_down_face = false;
  var do_rotation = false;
  //右手握ったか判定
  if(rightHandLandmarks){
    var hand_degree = Math.atan2( rightHandLandmarks[17].y -rightHandLandmarks[0].y, 
                        rightHandLandmarks[17].x - rightHandLandmarks[0].x )  * ( 180 / Math.PI );
    //手が下を向いていおらず、
    //指の第一関節の位置が、付け根より下にあるかどうか
    if( hand_degree > -120 && hand_degree < -60 && 
           rightHandLandmarks[0].y > rightHandLandmarks[17].y &&
            rightHandLandmarks[7].y > rightHandLandmarks[5].y &&
            rightHandLandmarks[11].y > rightHandLandmarks[9].y &&
            rightHandLandmarks[15].y > rightHandLandmarks[13].y &&
            rightHandLandmarks[20].y > rightHandLandmarks[17].y &&
            drag_left_hand == -1){
            if(drag_right_hand == -1){
              drag_right_hand = rightHandLandmarks[0].x;
            }
    }
    else{
      drag_right_hand = -1;
    }
  }
  else{
      drag_right_hand = -1;
  }
  
  //左手握ったか判定
  if(leftHandLandmarks){
    var hand_degree = Math.atan2( leftHandLandmarks[17].y -leftHandLandmarks[0].y, 
                        leftHandLandmarks[17].x - leftHandLandmarks[0].x )  * ( 180 / Math.PI );
  
    //手が下を向いていおらず、
    //指の第一関節の位置が、付け根より下にあるかどうか
    if( hand_degree > -120 && hand_degree < -60 &&
        leftHandLandmarks[0].y > leftHandLandmarks[17].y &&
        leftHandLandmarks[7].y > leftHandLandmarks[5].y &&
        leftHandLandmarks[11].y > leftHandLandmarks[9].y &&
        leftHandLandmarks[15].y > leftHandLandmarks[13].y &&
        leftHandLandmarks[20].y > leftHandLandmarks[17].y &&
        drag_right_hand == -1){
        
        if(drag_left_hand == -1){
          drag_left_hand = leftHandLandmarks[0].x;
        }
    }
    else{
      drag_left_hand = -1;
    }    
  }
  else{
    drag_left_hand = -1;  
  }
  
  
  if(faceLandmarks){
    var face_down_degree = Math.atan2( faceLandmarks[10].y -faceLandmarks[152].y, 
                        faceLandmarks[10].z - faceLandmarks[152].z )  * ( 180 / Math.PI );
                        
    var face_degree = Math.atan2( faceLandmarks[152].x -faceLandmarks[10].x, 
                        faceLandmarks[152].y - faceLandmarks[10].y )  * ( 180 / Math.PI );                        
    
    if(face_degree < -20 || face_degree > 20){
      do_rotation = true;
    }
    
    else if( face_down_degree < - 104){
      is_down_face = true;
    }
    
    
    
  }
  
  if(do_rotation){
    if(grip_status != 1 || (grip_status == 1 &&now.getTime()  - grip_time > 800)){
      //回転
      keyPress('rotate');
      grip_time = now.getTime();      
      
    }
    grip_status = 1;
  //右移動
  }
  else if(drag_right_hand != -1){
    console.log(rightHandLandmarks[0].x - drag_right_hand);
    if(rightHandLandmarks[0].x - drag_right_hand > 0.2){
      //移動
      keyPress('left');
      drag_right_hand = rightHandLandmarks[0].x;
    }
    else if(rightHandLandmarks[0].x - drag_right_hand < -0.2){
      keyPress('right');
      drag_right_hand = rightHandLandmarks[0].x;
      
    }
  }
  //左移動
  else if(drag_left_hand != -1){
    if(leftHandLandmarks[0].x - drag_left_hand > 0.2){
      //移動
      keyPress('left');
      drag_left_hand = leftHandLandmarks[0].x;
    }
    else if(leftHandLandmarks[0].x - drag_left_hand < -0.2){
      keyPress('right');
      drag_left_hand = leftHandLandmarks[0].x;
      
    }
  }
  else if(is_down_face){
    if(grip_status == 0 || (grip_status == 4 && now.getTime()  - grip_time > 400)){
      keyPress('down');      
      grip_time = now.getTime();
    }
    
    grip_status = 4;
  }
  else{
  }
}

function onResults(results) {
  // Hide the spinner.
  document.body.classList.add('loaded');

  // Remove landmarks we don't want to draw.
  removeLandmarks(results);

  // Update the frame rate.
  fpsControl.tick();

  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image, 0, 0, canvasElement.width, canvasElement.height);
  /*
  // Pose...
  drawConnectors(
    canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
    { color: '#00FF00' });
  drawLandmarks(
    canvasCtx, results.poseLandmarks,
    { color: '#00FF00', fillColor: '#FF0000' });
  */
  // Hands...
  drawConnectors(
    canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
    { color: '#00CC00' });
  drawLandmarks(
    canvasCtx, results.rightHandLandmarks, {
    color: '#00FF00',
    fillColor: '#FF0000',
    lineWidth: 2,
    radius: (landmark) => {
      return lerp(landmark.z, -0.15, .1, 10, 1);
    }
  });
  drawConnectors(
    canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
    { color: '#CC0000' });
  drawLandmarks(
    canvasCtx, results.leftHandLandmarks, {
    color: '#FF0000',
    fillColor: '#00FF00',
    lineWidth: 2,
    radius: (landmark) => {
      return lerp(landmark.z, -0.15, .1, 10, 1);
    }
  });
  
  var now = new Date();
  
  //ブロックプレイヤー時
  if(player_ix == 0){
    if(gameMode){
      createShape(results.rightHandLandmarks, results.leftHandLandmarks);
    }
    else{
      gameStart(results.rightHandLandmarks, results.leftHandLandmarks);
    }
    /*
    var shape = [0, 0, 0, 0, 0, 0, 0, 0];
    if(results.rightHandLandmarks){
      var right_degree = Math.atan2( results.rightHandLandmarks[4].y -results.rightHandLandmarks[8].y, 
                            results.rightHandLandmarks[4].x - results.rightHandLandmarks[8].x )  * ( 180 / Math.PI );
      if(right_degree < 36){
        shape[0] = 1;
        shape[1] = 1;
      } 
      else if( right_degree < 72){
        shape[0] = 1;
        shape[5] = 1;      
      }
      else if(right_degree < 108){
        shape[0] = 1;
        shape[4] = 1;      
      }
      else if(right_degree < 144){
        shape[1] = 1;
        shape[4] = 1;
      }
      else{
        shape[4] = 1;
        shape[5] = 1;      
      }
    }
      
    if(results.leftHandLandmarks){
        
      var left_degree = Math.atan2( results.leftHandLandmarks[4].y -results.leftHandLandmarks[8].y, 
                              results.leftHandLandmarks[4].x - results.leftHandLandmarks[8].x )  * ( 180 / Math.PI );
      if(left_degree < 36){
                
        shape[2] = 1;
        shape[3] = 1;
      } 
      else if( left_degree < 72){
        shape[2] = 1;
        shape[7] = 1;      
      }
      else if(left_degree < 108){
        var offset =  shape[0] && shape[4] ?  1: 0;
          
        shape[2 -offset] = 1;
        shape[6 - offset] = 1;      
      }
      else if(left_degree < 144){
        shape[3] = 1;
        shape[6] = 1;
      }
      else{
        shape[6] = 1;
        shape[7] = 1;      
      }
    }
    

    if(gameMode){
      if(now.getTime() -  block_create_time > 2000){
        
        if(results.leftHandLandmarks || results.rightHandLandmarks){
          fallShape(shape);
        }
        else{      //決まらなかったらランダムで作成
          var id = Math.floor( Math.random() * shapes.length );  // ランダムにインデックスを出す
          fallShape(shapes[ id ]);
        }        
      }
    }
    */
  }
  //操作プレイヤー時
  else{
    gripAction(results.rightHandLandmarks, results.leftHandLandmarks, results.faceLandmarks);
    //dragAction(results.rightHandLandmarks, results.leftHandLandmarks, results.faceLandmarks);
  }


  // Face...
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
    { color: '#C0C0C070', lineWidth: 1 });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYE,
    { color: '#FF3030' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYEBROW,
    { color: '#FF3030' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYE,
    { color: '#30FF30' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYEBROW,
    { color: '#30FF30' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_FACE_OVAL,
    { color: '#E0E0E0' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_LIPS,
    { color: '#E0E0E0' });

  // Connect elbows to hands.
  /*
  canvasCtx.lineWidth = 5;
  if (results.poseLandmarks) {
    if (results.rightHandLandmarks) {
      canvasCtx.strokeStyle = '#00FF00';
      connect(canvasCtx, [[
        results.poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        results.rightHandLandmarks[0]
      ]]);
    }
    if (results.leftHandLandmarks) {
      canvasCtx.strokeStyle = '#FF0000';
      connect(canvasCtx, [[
        results.poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW],
        results.leftHandLandmarks[0]
      ]]);
    }
  }
  */
  canvasCtx.restore();
}


// const hands = new Hands({
//   locateFile: (file) => {
//     return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
//   }
// });
// hands.onResults(onResults);
const holistic = new Holistic({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.1/${file}`;
  }
});
holistic.onResults(onResults);

/**
 * Instantiate a camera. We'll feed each frame we receive into the solution.
 */
(function () {/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
  var e = "function" == typeof Object.defineProperties ? Object.defineProperty : function (a, b, c) {
    if (a == Array.prototype || a == Object.prototype) return a; a[b] = c.value; return a
  };
  function f(a) {
    a = ["object" == typeof globalThis && globalThis, a, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
    for (var b = 0; b < a.length; ++b) {
      var c = a[b];
      if (c && c.Math == Math) return c
    }
    throw Error("Cannot find global object");
  }
  var h = f(this);
  function k(a, b) {
    if (b) a: {
      var c = h; a = a.split(".");
      for (var d = 0; d < a.length - 1; d++) {
        var g = a[d]; if (!(g in c)) break a; c = c[g]
      }
      a = a[a.length - 1];
      d = c[a];
      b = b(d);
      b != d && null != b && e(c, a, { configurable: !0, writable: !0, value: b })
    }
  }
  var l = "function" == typeof Object.assign ? Object.assign : function (a, b) {
    for (var c = 1; c < arguments.length; c++) {
      var d = arguments[c]; if (d) for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (a[g] = d[g])
    }
    return a
  };
  k("Object.assign", function (a) { return a || l });
  var m = this || self;
  var n = { facingMode: "user", width: 640, height: 480 };
  function p(a, b) {
    this.video = a; this.a = 0; this.b = Object.assign(Object.assign({}, n), b)
  }
  function q(a) {
    window.requestAnimationFrame(function () { r(a) })
  }
  function t(a, b) {
    a.video.srcObject = b;
    a.video.onloadedmetadata = function () {
      console.log(a.video.videoWidth, a.video.videoHeight);
      canvasElement.style.width = a.video.videoWidth + 'px';
      canvasElement.style.height = a.video.videoHeight + 'px';
      a.video.play();
      q(a)
    }
  }
  function r(a) {
    var b = null; a.video.paused || a.video.currentTime === a.a || (a.a = a.video.currentTime, b = a.b.onFrame()); b ? b.then(function () { q(a) }) : q(a)
  }
  p.prototype.start = function () {
    var a = this; navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia || alert("No navigator.mediaDevices.getUserMedia exists.");
    var b = this.b; return navigator.mediaDevices.getDisplayMedia({ video: true })
      .then(function (c) { t(a, c) })
      .catch(function (c) {
        console.error("Failed to acquire camera feed: " + c);
        alert("Failed to acquire camera feed: " + c); throw c;
      })
  };
  var u = ["Camera"], v = m;
  u[0] in v || "undefined" == typeof v.execScript || v.execScript("var " + u[0]);
  for (var w; u.length && (w = u.shift());)u.length || void 0 === p ? v[w] && v[w] !== Object.prototype[w] ? v = v[w] : v = v[w] = {} : v[w] = p;
}).call(this);


const camera = new Camera(videoElement, {
  onFrame: async () => {
    // 400 x 225
    // await hands.send({ image: videoElement });
    // playerElement[0].getContext('2d').drawImage(videoElement, 13, 102, 496, 279, 0, 0, 400, 225);
    // playerElement[1].getContext('2d').drawImage(videoElement, 515, 102, 496, 279, 0, 0, 400, 225);
    // playerElement[2].getContext('2d').drawImage(videoElement, 13, 387, 496, 279, 0, 0, 400, 225);
    // playerElement[3].getContext('2d').drawImage(videoElement, 515, 387, 496, 279, 0, 0, 400, 225);  
    playerElement[0].getContext('2d').drawImage(videoElement, 13, 102, 496, 279, 0, 0, 496, 279);
    
    playerElement[(player_rotate + 0) % 3 + 1].getContext('2d').drawImage(videoElement, 515, 102, 496, 279, 0, 0, 496, 279);
    playerElement[(player_rotate + 1) % 3 + 1].getContext('2d').drawImage(videoElement, 13, 387, 496, 279, 0, 0, 496, 279);
    playerElement[(player_rotate + 2) % 3 + 1].getContext('2d').drawImage(videoElement, 515, 387, 496, 279, 0, 0, 496, 279);

    canvasElement = playerElement[player_ix];
    canvasCtx = canvasElement.getContext('2d');
    canvasCtx.lineWidth = 10;
    canvasCtx.strokeStyle = "rgb(0, 255, 255)";
    canvasCtx.strokeRect(0,0,496,279);
    await holistic.send({ image: canvasElement });
  },
  // width: 1280,
  // height: 720
});
camera.start();

// Present a control panel through which the user can manipulate the solution
// options.
// new ControlPanel(controlsElement, {
//   selfieMode: false,
//   maxNumHands: 4,
//   minDetectionConfidence: 0.5,
//   minTrackingConfidence: 0.5
// })
//   .add([
//     new StaticText({ title: 'MediaPipe Hands' }),
//     fpsControl,
//     new Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
//     new Slider(
//       { title: 'Max Number of Hands', field: 'maxNumHands', range: [1, 8], step: 1 }),
//     new Slider({
//       title: 'Min Detection Confidence',
//       field: 'minDetectionConfidence',
//       range: [0, 1],
//       step: 0.01
//     }),
//     new Slider({
//       title: 'Min Tracking Confidence',
//       field: 'minTrackingConfidence',
//       range: [0, 1],
//       step: 0.01
//     }),
//   ])
//   .on(options => {
//     videoElement.classList.toggle('selfie', options.selfieMode);
//     hands.setOptions(options);
//   });

new ControlPanel(controlsElement, {
  selfieMode: true,
  upperBodyOnly: true,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
})
  .add([
    new StaticText({ title: 'MediaPipe Holistic' }),
    fpsControl,
    new Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new Toggle({ title: 'Upper-body Only', field: 'upperBodyOnly' }),
    new Toggle(
      { title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
    new Slider({
      title: 'Min Detection Confidence',
      field: 'minDetectionConfidence',
      range: [0, 1],
      step: 0.01
    }),
    new Slider({
      title: 'Min Tracking Confidence',
      field: 'minTrackingConfidence',
      range: [0, 1],
      step: 0.01
    }),
  ])
  .on(options => {
    videoElement.classList.toggle('selfie', options.selfieMode);
    holistic.setOptions(options);
  });
