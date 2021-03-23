// var nameChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#@&_(),.:;?!\\|{}<>[]`^~";
var nameChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.-";  // TODO: Space が欲しいけど、後回し
var $entryName;
var entryNameMode = 0;

var endpoint = "https://0z864th976.execute-api.ap-northeast-1.amazonaws.com/prod";
var apikey = "xY3UTkOm3y1nnGStzJO0A4trl0VtfVzU8YxpLlp5";

$(function(){
    var qs = $.deparam.querystring();
    var score = 0;

    // 10位以内じゃなければ、名前は入力できない。
    if (qs.score) {
        score = qs.score;
        // id 追加
        $.ajax({
            type: 'GET',
            url: endpoint,
            data: {"app": 1, "action": "add", "score": score, "name": "___"} ,
            headers: {
              'x-api-key': apikey,
              'Content-Type': 'application/json',
            },
        }).then(function(response){
            console.log(response)
            var newrec = response;

            $.ajax({
                type: 'GET',
                url: endpoint,
                data: {"app": 1, "action": "records"} ,
                headers: {
                  'x-api-key': apikey,
                  'Content-Type': 'application/json',
                },
            }).then(function(response){
                console.log(response)
                rankingTable(response);
                // Best 10 に、さっきの ID がはいってるか確認
                for(var i = 0; i < response.length; i++) {                    
                    var r = response[i];
                    if (r["レコード番号"]["value"] == newrec.id) {
                        entryName(newrec.id);
                        break;                        
                    }
                }
            });
        });            
    } else {
        $.ajax({
            type: 'GET',
            url: endpoint,
            data: {"app": 1, "action": "records"} ,
            headers: {
              'x-api-key': apikey,
              'Content-Type': 'application/json',
            },
        }).then(function(response){
            rankingTable(response);            
        });
    }
});

var ordinal = ["1ST", "2ND", "3RD", "4TH", "5TH", "6TH", "7TH", "8TH", "9TH", "10TH"];

function rankingTable(records) {
    $("table tbody").html("");
    for(var i = 0; i < records.length; i++) {
        var r = records[i];
        // <tr id="rankXXXX"><td class="rank">10TH</td><td class="name">KEN</td><td class="score">3,500,000,000</td></tr>        
        $("table tbody").append('<tr id="rank' + r["レコード番号"]['value'] + '"><td class="rank">' + ordinal[i] + '</td><td class="name" data-recid="' + r['レコード番号']['value'] + '">' + r['name']['value'] + '</td><td class="score">' + numberFormat(r['score']['value']) + '</td></tr>');
    }
}
function entryName(rank) {
    // 位置づける
    $entryName = $("tr#rank" + rank + " td.name");
    var n = $entryName.text();
    var nn = n.split("");
    var nnn = "<span>" + nn.join("</span><span>") + "</span>";
    $entryName.html(nnn);
    entryNameSetPosition(1);
}

function entryNameSetPosition(p) {
    entryNameMode = p;
    $entryName.find("span").removeClass("blinking");    
    if (p == 0) return;
    $entryName.find("span:nth-of-type(" + entryNameMode + ")").addClass("blinking");
    entryNameSelect(0); // _ を A にするために 
}

function entryNameSelect(lr) {
    var c = $entryName.find("span:nth-of-type(" + entryNameMode + ")").text();
    var i = nameChars.indexOf(c);
    if (i == -1) i = 0;
    i += lr;
    if (i < 0) i = nameChars.length - 1;
    if (i > (nameChars.length - 1)) i = 0;
    $entryName.find("span:nth-of-type(" + entryNameMode + ")").text(nameChars.charAt(i));
}

function keyPress( key ) {
    if (entryNameMode == 0) {
        if (key == "start") {
            parent.jQuery.fancybox.getInstance().close();
        }    
    } else {
        switch ( key ) {
            case 'left':
                document.getElementById( 'audioken' ).play();
                entryNameSelect(-1);
                break;
            case 'right':
                document.getElementById( 'audioken' ).play();
                entryNameSelect(+1);
                break;
            case 'down':
                if (entryNameMode > 1) {
                    entryNameMode--;
                }
                break;
            case 'rotate':
                document.getElementById( 'audiopa' ).play();
                if (entryNameMode == 3) {
                    // 書き込みするぞ
                    entryNameSetPosition(0);                    
                    $.ajax({
                        type: 'GET',
                        url: endpoint,
                        data: {"app": 1, "action": "update", "id":$entryName.data("recid"), "name": $entryName.text()} ,
                        headers: {
                          'x-api-key': apikey,
                          'Content-Type': 'application/json',
                        },
                    }).then(function(response){
                        console.log(response);
                    });                    
                } else {
                    entryNameSetPosition(++entryNameMode);
                }
                break;
            case 'start':
                // 書き込み
                if (entryNameMode > 0) {
                    $.ajax({
                        type: 'GET',
                        url: endpoint,
                        data: {"app": 1, "action": "update", "id":$entryName.data("recid"), "name": $entryName.text()} ,
                        headers: {
                          'x-api-key': apikey,
                          'Content-Type': 'application/json',
                        },
                    }).then(function(response){
                        // 閉じる
                        parent.jQuery.fancybox.getInstance().close();                   
                    });
                } else {
                    // 閉じる
                    parent.jQuery.fancybox.getInstance().close();                   
                }
                break;                
        }
    }
}  

function numberFormat(num){
    return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}
