// Various formatters.
var formatNumber = d3.format(",d"),
  formatChange = d3.format("+,d"),
  formatDate = d3.time.format("%B %d, %Y"),
  formatTime = d3.time.format("%I:%M %p");

// data across years
var extant = [];
var indCounties = d3.map();

var width = 250,
    height = 350;

var rateById = d3.map(),
  popById = d3.map(),
  nameById = d3.map();

var quantize = d3.scale.quantize()
    .domain([0, 4000])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

var projection = d3.geo.mercator()
     	.scale(1)
        .translate([0, 0]);
		
var path = d3.geo.path()
        .projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .direction('n')
  .html(function(d) {
     return d.properties.NAME
   });
    
svg.call(tip);

//   var legend = d3.select("#map-legend").
//     append("svg:svg").
//     attr("width", 160).
//     attr("height", 10)
//   for (var i = 0; i <= 4; i++) {
//     legend.append("svg:rect").
//     attr("x", i*20).
//     attr("height", 10).
//     attr("width", 20).
//     attr("class", "q" + i + "-9 ");//color
//   };

var nation = crossfilter(),
  all = nation.groupAll(),
  per_cap = nation.dimension(function(d) { return d.Per_capita_personal_income; }),
  per_caps = per_cap.group(),
  population = nation.dimension(function(d) { return d.Population; }),
  populations = population.group();

var my_data = [];



var incByHour= [],
    incByWeekDay=[],
	incByCounty=[];


var cf = crossfilter(),
  all_data = cf.dimension(function(d) {return d.COUNTY;})
  all_datag = all_data.group().reduceSum(function(d) {return +d.NUM_ACCIDENTS;}),
  per_hour = cf.dimension(function(d) { return d.COLLISION_TIME;}),
  per_hourg = per_hour.group().reduceSum(function(d) {return +d.NUM_ACCIDENTS;}),
  per_day = cf.dimension(function(d) { return d.WEEK_DAY_NUM;}),
  per_dayg = per_day.group().reduceSum(function(d) {return +d.NUM_ACCIDENTS;});


queue()

	.defer(d3.json, "indiana.json")
	//.defer(d3.json, "counties.json")
    .defer(d3.csv, "Accidents_By_County_Week_Hour.csv", function(d){
	 for(var propertyName in d) {
        if (propertyName == "COUNTY") {
          continue;
        };
        d[propertyName] = +d[propertyName];
      }

      cf.add([d]);
    //  indCounties.push(d.COUNTY_NUM);

	})
	.defer(d3.csv, "Indiana_Counties.csv", function(d){
		indCounties.set(d.COUNTYCDE, d.NUM_ACCIDENTS);
	  }
	  )
    .await(ready);                  

							 // Added from indiana map code
function ready(error, indiana, us) {
//	console.log(us);
//	console.log(indiana);
  
  var b = path.bounds(topojson.feature(indiana, indiana.objects.cb_2015_indiana_county_20m)),
 	  s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
 	  t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

  projection
           .scale(3300)
           .translate([5075, 2680]);   // best position for map in the viz
	
//  console.log(indCounties);
	
  svg.append("g")
      .attr("class", "counties")
    .selectAll("path")
      .data(topojson.feature(indiana, indiana.objects.cb_2015_indiana_county_20m).features)
    .enter().append("path")
    .attr("class", function(d) { 
	//console.log(indCounties.get(d.properties.COUNTYFP));
		return quantize(indCounties.get(d.properties.COUNTYFP)); 
				 
	    })
    //  .attr("Name", function(d) { return d.NAME; })
      .attr("d", path)
      .on('mouseover',tip.show)
      .on('mouseout', tip.hide);

  var charts = [
      
    barChart(true)
      .dimension(per_hour)
      .group(per_hourg)
    .x(d3.scale.linear()
      .domain([0, 24])
      .range([0, 250])),

    barChart(true)
      .dimension(per_day)
      .group(per_dayg)
    .x(d3.scale.linear()
      .domain([0, 8])
      .range([0, 100]))

  ];

  var chart = d3.selectAll(".chart")
    .data(charts)
    .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

  renderAll();

  // barChart
  function barChart(incBar) {
    if (!barChart.id) barChart.id = 0;

    incBar = typeof incBar !== 'undefined' ? incBar : false;
    var formatAsNumber = d3.format(",d");
    
    var axis = d3.svg.axis().orient("bottom");
    if (incBar == true) {
      axis.tickFormat(formatAsNumber);
      
    }
    var margin = {top: 10, right: 10, bottom: 20, left: 10},
      x,
      y = d3.scale.linear().range([80, 0]),
      id = barChart.id++,
      brush = d3.svg.brush(),
      brushDirty,
      dimension,
      group,
      round;

    function chart(svg) {
      var width = x.range()[1],
          height = y.range()[0];
      console.log(group.top(1)[0].value);   //// gives max of each bar graph
      try {
        y.domain([0, group.top(1)[0].value]);
      }
      catch(err) {
        window.reset
      } 

      svg.each(function() {
        var svg = d3.select(this),
            g = svg.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          svg.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");

          g = svg.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));

      var selected = [];

      dimension.filterRange(extent).top(Infinity).forEach(function(d) {
        selected.push(d.id)
      });
      svg.attr("class", "counties")
        .selectAll("path")
          .attr("class", function(d) { if (selected.indexOf(d.id) >= 0) {return "q8-9"} else if (extant.indexOf(d.id) >= 0) {return "q5-9"} else {return null;}});

    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts.forEach(function (c) {
      c.filter(null);
    })
    renderAll();
    svg.attr("class", "counties")
      .selectAll("path")
        .attr("class", function(d) { return quantize(rateById.get(d.id)); });
  };

}