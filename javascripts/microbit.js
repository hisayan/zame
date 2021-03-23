var socket = io.connect();

socket.on('connect', function(msg) 
{
    console.log("Connect");
});
    
// メッセージを受けたとき
socket.on('message', function(msg) 
{
    // console.log("ReceiveMessage", msg);
    // メッセージを画面に表示する
    // document.getElementById("receiveMsg").innerHTML += `<p>${msg.value}</p>`;           
    keyPress(msg);
});
    
// // メッセージを送る
// function SendMsg() 
// {
//   console.log("SendMessage");
//   var msg = document.getElementById("message").value;
//   // メッセージを発射する
//   socket.emit('message', { value: msg });
// }
// 切断する
// function DisConnect() {
//   console.log("DisConnect");
//   socket.emit('message', { value: "切断しました"})
//   // socketを切断する
//   socket.disconnect();
// }