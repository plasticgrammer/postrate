var rq = require('request');
var csv = require('comma-separated-values');
var _ = require('underscore');

/*
 * Rate情報をfxstreetより取得し、JSON形式で返却する
 */
var RatesJson = function() {
  var decorators = [];

  var handler = function(req, res) {
    var pair = req.params.pair.toLowerCase(),
        tf = req.params.tf;
    var param = ['period=' + (tf == '4h' ? 250 : 100), 'pair=' + pair, '&tf=' + (tf == '4h' ? '1h' : tf)];
    var url = 'http://www.fxstreet.jp/_enginys/ratehistorytools/export.aspx?' + param.join('&');

    // CSV取得リクエスト送信
    rq.get(url, function(error, resz, body) {
      // CSVデータをJSONに
      var json = new csv(body, {header: true}).parse();

      // 4h対応
      if (tf == '4h') {
        var h = 0;
        json = _.filter(json, function(item){
          return ((h++ % 4) === 0);
        });
      }
      
      // 日付変換（GMT日付+9、日付と時間に分離）
      json = _.map(json, function(item){
        var d = new Date();
        d.setTime(Date.parse(item['日付']) + 9 * 60 * 60 * 1000);
        item["日付"] = d.getFullYear() + "-" + ('0'+(d.getMonth() + 1)).slice(-2) + "-" + ('0'+d.getDate()).slice(-2);
        item["時間"] = ('0'+d.getHours()).slice(-2) + ":" + ('0'+d.getMinutes()).slice(-2);
        return item;
      });
      
      // 日付、時間の昇順でソート
      json = _.sortBy(json, function(item){
        return item['日付'] + item['時間'];
      });
      
      // 引数指定されたJSON加工処理を実行
      for (var i = 0; i < decorators.length; i++) {
        var result = decorators[i](json);
        if (result) {
          json = result;
        } else {
          console.log("decorator returned null.");
        }
      }
  
      // JSONを返却
      res.contentType('application/json');
      res.send(JSON.stringify(json));
    });
  };
  
  handler.decorator = function(d) {
    decorators.push(d);
    return handler;
  };
    
  return handler;
};

/*
 * 売買ジャッジ数値算出
 */
var sbj = function(json) {
  var i = 0, rsum = 0, msum = 0, preItem = {};
  json = _.map(json, function(item){
    /*
     EMA12:  12番目は1-12のRATE平均、それ以降は(今回終値*2+前回EMA12*11)/13
     EMA26:  26番目は1-26のRATE平均、それ以降は(今回終値*2+前回EMA26*25)/27
     MACD:   EMA12-EMA26
     SIGNAL: 34番目は26-34のMACD平均、それ以降は(今回MACD*2+前回SIGNAL*8)/10
     JUDGE:  MACD-SIGNAL
    */
    var r = item['終値'];
    i++, rsum += r;
    item['EMA12'] = i < 12 ? 0 : (i == 12 ? rsum / 12 : (r * 2 + preItem['EMA12'] * 11) / 13);
    item['EMA26'] = i < 26 ? 0 : (i == 26 ? rsum / 26 : (r * 2 + preItem['EMA26'] * 25) / 27);
    item['MACD'] = item['EMA12'] - item['EMA26'];
    msum += (i >= 26 && i <= 34 ? item['MACD'] : 0);
    item['SIGNAL'] = i < 34 ? 0 : (i == 34 ? msum / 9 : (item['MACD'] * 2 + preItem['SIGNAL'] * 8) / 10);
    item['JUDGE'] = item['MACD'] - item['SIGNAL'];
    preItem = item;
    return item;
  });

  return json;
};

/*
 * 標準偏差
 */
var sigma = function(json) {
  var signD = function(preItem, item, name) {return (preItem[name] <= item[name] ? '△' : '▼');};
  var preItem = {};
  var rateArray = [], term = 21;
  json = _.map(json, function(item){
    // 最大数がtermの終値リスト
    rateArray.push(item['終値']);
    if (rateArray.length > term) {
      rateArray.shift();
    }
    // リスト要素の合計値、平均値
    var sum = 0;
    _.each(rateArray, function(r){sum+=r;});
    var ave = sum / term;
    // 標準偏差
    var vsum = 0;
    _.each(rateArray, function(r){vsum+=Math.pow(r - ave, 2);});
    var sd = Math.sqrt(vsum / term);
    item['AVE'] = ave;
    item['SD'] = sd;
    item['SD_DIFF'] = item['SD'] - preItem['SD'];
    item['S2_P'] = (ave + sd * 2);
    item['S2_M'] = (ave - sd * 2);
    preItem = item;
    return item;
  });
  
  return json;
};


/*
 * 売買ジャッジ情報をJSONで返却
 */
exports.saleBuyJudge = RatesJson()
  .decorator(sbj)
  .decorator(sigma)
  .decorator(function(json) {
    var i = 0;
    // SIGNALが設定されている34番目から
    json = _.filter(json, function(item) {
      return (i++ >= 34);
    });
    return json;
   });
