function loadPage() {
	loadDefaultValues();
	loadMarcFormat();
}

function reset() {
  loadDefaultValues();
  loadData();
}

function loadDefaultValues() {
  DATA_TYPE = 'datafield';
  COUNT_TYPE = 'record_occurrence';
  MARC_FILE_LOCATION = '/marc.json';

	DEFAULT_GRAPH_WIDTH = 500;
	MIN_COLUMN_WIDTH = 30;
	HEIGHT_SCALE = .8; // 80% of the page
	MARGIN = 100;
	DEFAULT_FONT_SIZE = 12;

	height = (window.innerHeight * HEIGHT_SCALE) - MARGIN;

	data = [];
}

function getDataUrl() {
  if(DATA_TYPE == 'datafield') {
    return '/' + DATA_TYPE + '/' + COUNT_TYPE;
  }
  else {
    if(COUNT_TYPE == 'regex_count') {
      return '/' + DATA_TYPE + '/' + COUNT_TYPE + '/' + FIELD + '/' + REGEX;
    }
    else if(COUNT_TYPE == 'regex_value') {
      return '/' + DATA_TYPE + '/' + COUNT_TYPE + '/' + FIELD +  '/' + MATCH + '/' + REGEX;
    }    else {
      return '/' + DATA_TYPE + '/' + COUNT_TYPE + '/' + FIELD;
    }
  }
}

function loadMarcFormat(){
  d3.json(MARC_FILE_LOCATION, function(error, response) {
    MARC_FORMAT = response;
    loadData();
  });
}

function loadData() {
  if(DATA_TYPE == 'value') {
    document.getElementById('value-options').style.visibility = 'visible'; 
    document.getElementById('field-options').style.visibility = 'hidden'; 
  }
  else {
    document.getElementById('field-options').style.visibility = 'visible'; 
    document.getElementById('value-options').style.visibility = 'hidden'; 
  }

	d3.json(getDataUrl(), function(error, response) {
    	if (error) throw error;

      document.getElementById('graph-title').innerHTML = getGraphTitle();

    	data = response;
    	displayChart(data);
    	updateDisplayedFields(data, []);
	});
}

function showRegexCount() {
  COUNT_TYPE = 'regex_count';
  REGEX = document.getElementById('regex').value;
  loadData();
}

function getGraphTitle() {
  var title = 'ALL ' + DATA_TYPE.toUpperCase() + 'S'
  if(DATA_TYPE == 'subfield') {
    title = title + ' FROM DATAFIELD ' + FIELD +
        '<br>' +getFieldDescription('datafield', FIELD);

  }
  else if(DATA_TYPE == 'value') {
    title = title + ' FROM DATAFIELD ' + FIELD.split('_')[0] + ' SUBFIELD ' + FIELD.split('_')[1] +
        '<br>' +getFieldDescription('subfield', FIELD);
  }
  return title;
}

function updateChart() {
  COUNT_TYPE = document.getElementById('chart-type').value;
  loadData();
}

function updateDisplayedFields(included_fields, excluded_fields) {
	var includedFieldsOptions = document.getElementById('include');

	// remove all fields
	includedFieldsOptions.innerHTML = '';
	excluded_fields.innerHTML = '';

    for (var i = 0; i < included_fields.length; i++) {
      createSelectOptions(includedFieldsOptions, included_fields[i]);
    }

    var selects = document.getElementsByClassName('elements');
    var elementsToShow = (height - 50) / DEFAULT_FONT_SIZE
    selects[0].setAttribute('size', elementsToShow);
    selects[1].setAttribute('size', elementsToShow);
}

function createSelectOptions(element, data) {
	var option = document.createElement("option");
  	option.text = data._id;
  	option.value = data._id;
  	element.appendChild(option);
}

function type(d) {
  d.value = +d.value;
  return d;
}

function updateIncludedFields(from, to) {
  var from = document.getElementById(from).options;
  var to = document.getElementById(to);

  for (var i = from.length - 1; i >= 0; i--) {
    if (from[i].selected) {
      to.appendChild(from[i]);
    }  
  }
  
  var exclude = document.getElementById('exclude').options;
  display_data = data.slice();
  
  for (var i = 0; i < exclude.length; i++) {
    for (var j = 0; j < display_data.length; j++) {
      if (exclude[i].text == display_data[j]._id) {
        display_data.splice(j, 1);
        break;
      }  
    }
  }

  displayChart(display_data);
}

function displayChart(data) {
	  display_data = data;
    var width = DEFAULT_GRAPH_WIDTH;
    if ((window.innerWidth / data.length) < MIN_COLUMN_WIDTH) {
      width = data.length * MIN_COLUMN_WIDTH - MARGIN;
    }

    x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
    if ((window.innerWidth / data.length) > MIN_COLUMN_WIDTH) {
      x = d3.scale.ordinal().rangeRoundBands([0, width], .5);
    }

    y = d3.scale.linear().range([height, 0]);

    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    d3.select("svg").remove();

    var svg = d3.select("#chart").append("svg")
        .attr("width", width + MARGIN)
        .attr("height", height + MARGIN)
        .append("g")
        .attr("transform", "translate(" + MARGIN/2 + "," + MARGIN/2 + ")");

    x.domain(data.map(function(d) { return d._id; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll('.tick')
        .style("cursor","default")
        .on('mouseover', showToolTipFromLabel)
        .on('mouseout', removeToolTip)
        .selectAll("text")	
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)" 
                });

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Records");

    d3.selectAll("g.x.axis g.tick text")
    .attr("class", function(d){
       if(DATA_TYPE == 'datafield' && MARC_FORMAT[d] == undefined) {
           return 'unknown';
       }
       if(DATA_TYPE == 'subfield') {
         var fields = d.split("_");
         if (MARC_FORMAT[fields[0]]['subfields'][fields[1]] == undefined) {
           return 'unknown';
         }
       }
       return null;
    });

    svg.selectAll(".bar")
        .data(display_data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d._id); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return height - y(d.value); })
        .on("mouseover", showToolTip)
        .on("mouseout", removeToolTip)
        .on("click", function(d) {
          removeToolTip(d);
          if(DATA_TYPE != 'value') {

            if(DATA_TYPE == 'datafield') {
              DATA_TYPE = 'subfield';
            }  
            else {
              DATA_TYPE = 'value';
              COUNT_TYPE = 'total_count';
            }

            FIELD = d._id;
            loadData();
          }
          else {
            if(COUNT_TYPE == 'regex_count') {
                COUNT_TYPE = 'regex_value';
            }

            if(d._id == 'match') {
              MATCH = true;
            }
            else {
              MATCH = false;
            }
            loadData();
          }
          //window.location.href = '/subfield/' + d._id;    
        });


}

function showToolTipFromLabel(d) {
  for (var j = 0; j < display_data.length; j++) {
      if (display_data[j]._id == d) {
        showToolTip(display_data[j]);
        break;
    }
  }
}

function getFieldDescription(type, field) {
  if(type == 'datafield') {
    if(MARC_FORMAT[field] != undefined) {
      description = MARC_FORMAT[field]['description']
    }
    else {
      description = 'UNKNOWN';
    }
  }
  else {
    var fields = field.split("_");
    if(MARC_FORMAT[fields[0]]['subfields'][fields[1]] != undefined) {
      description = MARC_FORMAT[fields[0]]['subfields'][fields[1]];
    }
    else {
      description = 'UNKNOWN';
    }
  }
  return description;
}

function showToolTip(d)
{
  var tooltip = d3.select("#chart").append("a")
        .attr("class", "tooltip")   
        .style("opacity", 0);

  if(tooltip != undefined) {
  	var description;
    if(DATA_TYPE == 'datafield') {
    	if(typeof MARC_FORMAT[d._id] !== 'undefined') {
    		description = MARC_FORMAT[d._id]['description']
    	}
    	else {
    		description = 'UNKNOWN';
    	}
    }
    else if(DATA_TYPE == 'subfield') {
      var fields = d._id.split("_");
      if(typeof MARC_FORMAT[fields[0]]['subfields'][fields[1]] !== 'undefined') {
        description = MARC_FORMAT[fields[0]]['subfields'][fields[1]];
      }
      else {
        description = 'UNKNOWN';
      }
    }

    if(DATA_TYPE == 'value') {
      html = 'Value'
      + ": " + d._id
      + "<br/>"
      + "Records: " + d.value;
    }
  	else {
      html = d._id
  		+ ": " + description
  		+ "<br/>"
  		+ "Records: " + d.value;
    }

  	/*html = "Value: " + d._id
  		+ "<br/>"
  		+ "Count: " + d.value;*/
    tooltip
      .html(html)
      .attr("href", "/subfield/" + d._id) 
      .style("visibility", "visible")
      .style("opacity", 0.9)
      .style("left", (d3.event.pageX + 10) + "px")   
      .style("top", (d3.event.pageY) + "px");   
  }
}

function removeToolTip(d)
{
  d3.select(".tooltip").remove();
}