//
function drawChart(d3, $, selector, pair, data) {
    var margin_x = 45;
    var margin_y = 30;
    var width = Math.min(960, $(window).width()) - margin_x;
    var height = 400 - margin_y;
    
    $(selector).empty();


    data = rebuildData(d3, data);

    var baseRate;
    if (pair == "EURUSD") {
      baseRate = Math.round(data[0].終値 * 1000) / 1000;
    } else {
      baseRate = Math.round(data[0].終値 * 10) / 10;
    }
    var thresholdRates = createThresholdRates(pair, baseRate);
    
    var $svg = d3.select(selector)
      .append("svg").attr("width", width + margin_x).attr("height", height + margin_y);
    
    // g
    $svg.append("g").attr("class", "chart");
    
    // circle
    $svg.selectAll("circle.macd")
      .data(data).enter().append("circle").attr("class", "macd");
    $svg.selectAll("circle.signal")
      .data(data).enter().append("circle").attr("class", "signal");
    $svg.selectAll("circle.rate")
      .data(data).enter().append("circle").attr("class", "rate");
    
    //yスケール
    var rate_extent = d3.extent(data, function(d){return d.終値;});
    rate_extent[0] = Math.min(thresholdRates[thresholdRates.length - 1], rate_extent[0]);
    rate_extent[1] = Math.max(thresholdRates[0], rate_extent[1]);
    var rateDiff = Math.abs(rate_extent[1] - rate_extent[0]);
    rate_extent[0] -= rateDiff * 0.2;
    rate_extent[1] += rateDiff * 0.2;
    var rate_scale = d3.scale.linear()
          .domain(rate_extent)
          .range([height, margin_y]);
    //xスケール
    var time_extent = d3.extent(data, function(d){return d.DATE;});
    var time_scale = d3.time.scale()
          .domain(time_extent)
          .range([margin_x, width]);
          
    var calcXS = function(d){return time_scale(d.DATE);};
    // 線
    var lineThreshold;
    for (var i = 0; i < thresholdRates.length; i++) {
      lineThreshold = d3.svg.line().x(calcXS).y(function(d){return rate_scale(thresholdRates[i]);});
      $svg.append("path").attr("d", lineThreshold(data)).style("stroke", "lightgrey");
    }
    // 線
    var lineRate = d3.svg.line().x(calcXS).y(function(d){return rate_scale(d.終値);});
    var lineAVE = d3.svg.line().x(calcXS).y(function(d){return rate_scale(d.AVE);});
    var lineS2P  = d3.svg.line().x(calcXS).y(function(d){return rate_scale(d.S2_P);});
    var lineS2M  = d3.svg.line().x(calcXS).y(function(d){return rate_scale(d.S2_M);});
    $svg.append("path").attr("d", lineAVE(data)).style("stroke", "gray");
    $svg.append("path").attr("d", lineS2P(data)).style("stroke", "gray");
    $svg.append("path").attr("d", lineS2M(data)).style("stroke", "gray");
    $svg.append("path").attr("d", lineRate(data)).style("stroke", "MediumBlue");

    
    //x軸
    var time_axis = d3.svg.axis()
          .scale(time_scale)
          //.ticks(8)
          .orient("bottom");
    $svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0, " + height + ")")
      .call(time_axis);
    //y軸
    var rate_axis = d3.svg.axis()
          .scale(rate_scale)
          .orient("left");
    $svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + margin_x + ", 0)")
      .call(rate_axis);
}

function rebuildData(d3, data) {
    var dateTimeFormat = d3.time.format("%Y-%m-%d %H:%M");
    var dateFormat = d3.time.format("%Y-%m-%d");
    var timeFormat = d3.time.format("%H:%M");
    var term = getCurrentTerm(dateFormat);
    var startRate;
    var newData = [];
    
    $.each(data, function(i,d){
      if (d.時間 == term.startTime) {
        startRate = d.終値;
        newData.push(d);
      } else if (newData.length > 0) {
        newData.push(d);
      }
    });
/*
    newData = data;
*/

/*
    var startDateTime = dateTimeFormat.parse(newData[0].日付+' '+newData[0].時間);
    for (var i = newData.length; i < 36; i++) {
      var t = dateTimeFormat(new Date(startDateTime.getTime() + (i - 1) * 5 * 60000));
      newData.push({"日付":dateFormat(t), "時間":timeFormat(t)});
    }
*/
    $.each(newData, function(i,d){
      d.DATE = dateTimeFormat.parse(d.日付+' '+d.時間);
    });
    
    return newData;
}

function getCurrentTerm(dateFormat) {
    var term = {}, now = new Date();
    
    if (now.getHours() >= 23) {
      term.startDate = dateFormat(now);
      term.endDate = dateFormat(new Date(now.getTime() + 24 * 3600000));
    } else if (now.getHours() < 1) {
      term.startDate = dateFormat(new Date(now.getTime() - 24 * 3600000));
      term.endDate = dateFormat(now);
    } else {
      term.startDate = dateFormat(now);
      term.endDate = term.startDate;
    }

    if (now.getHours() >= 23 || now.getHours() < 1) {
      term.startTime = "22:00";
      term.endTime = "01:00";
    } else if (now.getHours() < 3) {
      term.startTime = "00:00";
      term.endTime = "03:00";
    } else if (now.getHours() < 5) {
      term.startTime = "02:00";
      term.endTime = "05:00";
    } else if (now.getHours() < 11) {
      term.startTime = "08:00";
      term.endTime = "11:00";
    } else if (now.getHours() < 13) {
      term.startTime = "10:00";
      term.endTime = "13:00";
    } else if (now.getHours() < 15) {
      term.startTime = "12:00";
      term.endTime = "15:00";
    } else if (now.getHours() < 17) {
      term.startTime = "14:00";
      term.endTime = "17:00";
    } else if (now.getHours() < 19) {
      term.startTime = "16:00";
      term.endTime = "19:00";
    } else if (now.getHours() < 21) {
      term.startTime = "18:00";
      term.endTime = "21:00";
    } else if (now.getHours() < 23) {
      term.startTime = "20:00";
      term.endTime = "23:00";
    }
    return term;
}

function createThresholdRates(pair, baseRate) {
  if (pair == "USDJPY" || pair == "EURJPY") {
    return [
      baseRate + 0.35,
      baseRate + 0.20,
      baseRate + 0.10,
      baseRate,
      baseRate - 0.10,
      baseRate - 0.20,
      baseRate - 0.35
    ];
  } else if (pair == "GBPJPY") {
    return [
      baseRate + 0.40,
      baseRate + 0.25,
      baseRate + 0.10,
      baseRate,
      baseRate - 0.10,
      baseRate - 0.25,
      baseRate - 0.40
    ];
  } else if (pair == "EURUSD") {
    return [
      baseRate + 0.0040,
      baseRate + 0.0025,
      baseRate + 0.0010,
      baseRate,
      baseRate - 0.0010,
      baseRate - 0.0025,
      baseRate - 0.0040
    ];
  }
  return [];
}
