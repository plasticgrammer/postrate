//
function drawChart(d3, $, selector, data) {
    var margin_x = 45;
    var margin_y = 30;
    var width = Math.min(960, $(window).width()) - margin_x;
    var height = 200 - margin_y;
    
    $(selector).empty();
    
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M");
    $.each(data, function(i,d){d.DATE = dateFormat.parse(d.日付+' '+d.時間);});
    
    
    var $svg = d3.select(selector)
      .append("svg").attr("width", width + margin_x).attr("height", height + margin_y);
    
    // g
    $svg.append("g").attr("class", "chart");
    
    // circle
    $svg.selectAll("circle.macd")
      .data(data).enter()
      .append("circle").attr("class", "macd");
    $svg.selectAll("circle.signal")
      .data(data).enter()
      .append("circle").attr("class", "signal");
    $svg.selectAll("circle.rate")
      .data(data).enter()
      .append("circle").attr("class", "rate");
    
    //yスケール
    var macd_extent = d3.extent(data, function(d){return d.MACD;});
    var signal_extent = d3.extent(data, function(d){return d.SIGNAL;});
    var count_extent = [
        Math.min(macd_extent[0], signal_extent[0]), 
        Math.max(macd_extent[1], signal_extent[1])
    ];
    count_extent[0] -= Math.abs(count_extent[1] - count_extent[0]) * 0.2;
    var count_scale = d3.scale.linear()
          .domain(count_extent)
          .range([height, margin_y]);
    
    //yスケール
    var rate_extent = d3.extent(data, function(d){return d.終値;});
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
    var lineRate = d3.svg.line()
          .x(calcXS).y(function(d){return rate_scale(d.終値);});
    var line1 = d3.svg.line()
          .x(calcXS).y(function(d){return count_scale(d.MACD);});
    var line2 = d3.svg.line()
          .x(calcXS).y(function(d){return count_scale(d.SIGNAL);});
    $svg.append("path").attr("d", lineRate(data)).style("stroke", "lightgrey");
    $svg.append("path").attr("d", line1(data)).style("stroke", "DeepPink");
    $svg.append("path").attr("d", line2(data)).style("stroke", "MediumBlue");
    
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
    var count_axis = d3.svg.axis()
          .scale(count_scale)
          .orient("left");
    $svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + margin_x + ", 0)")
      .call(count_axis);
    //y軸
    var rate_axis = d3.svg.axis()
          .scale(rate_scale)
          .orient("right");
    $svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + width + ", 0)")
      .call(rate_axis);
}
