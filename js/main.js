/**
 * @fileoverview Description of this file.
 */

var width = Math.max(960, innerWidth),
    height = Math.max(500, innerHeight);

/////////////////////
// initialize the gui
var params = {
  bars : 4,
  erase : false,
  save : false,
  clear : false,
  mode: 0,
  num_hits : 32,
  num_pitches : 10,
  temperature: .5,
  tempo: 120,
  meter: 4
};

function initGui() {
  var gui = new dat.GUI();
  //gui.remember(params);

  gui.add(params, 'erase');
  gui.add(params, 'save');
  gui.add(params, 'clear').onChange(function(newValue) {
    console.log("clear:  ", newValue);
    if ( newValue == true ) {
      sketch_container.selectAll("*").remove();
      initSketch();
      matrix_container.selectAll("*").remove();
      initMatrix();
      params.clear = false;
    }
  });
  gui.add(params, 'mode', { pentatonic: 0, major: 1, minor: 2 }).onChange(function(newValue) {
    console.log("mode: ", newValue);
    initScale( newValue );
    matrix_container.selectAll("*").remove();
    initMatrix();
  });
  gui.add(params, 'bars', 1, 8).step(1).onChange(function(newValue) {
    //console.log("bars: ", newValue);
    params.num_hits = params.meter * Math.floor(newValue);
    matrix_container.selectAll("*").remove();
    initMatrix();
  });
  gui.add(params, 'num_hits', 4, 128).step(1).listen().onChange(function(newValue) {
    //console.log("num_hits: ", newValue);
    matrix_container.selectAll("*").remove();
    initMatrix();
  });
  gui.add(params, 'num_pitches', 5, 40).step(1).onChange(function(newValue) {
    //console.log("num_pitches: ", newValue);
    matrix_container.selectAll("*").remove();
    initMatrix();
  });
  gui.add(params, 'temperature', 0, 1);
  gui.add(params, 'tempo', 40, 200).step(1).onChange(function(newValue) {
    params.tempo = newValue;
    matrix_container.selectAll("*").remove();
    initMatrix();
  });
  gui.add(params, 'meter', 1, 10).step(1).onChange(function(newValue) {
    params.num_hits = newValue * params.bars;
    matrix_container.selectAll("*").remove();
    initMatrix();
  });

}
initGui();

var margin = 10;
var gui_margin = 150;
var container_width = width / 2 - 2 * margin - gui_margin;
var container_height = container_width * .75;
var matrix;
var offColor = '#686868';
var downbeatColor = '#787878';
var onColor = 'white';
var bPressed = false;
var cell_margin = 2;
var bDrawing = false;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var sketch_container = d3.select("svg").append("svg")
  .attr("width", width / 2)
  .attr("height", width / 2 * .75 )
  .on("mousedown", handleStartDrawing )
  .on("mousemove", sketch )
  .on("mouseup", handleEndDrawing )
  .on("mouseleave", handleEndDrawing );

function initSketch() {
  sketch_container.append("rect")
    .attr("width", container_width)
    .attr("height", container_height)
    .attr("x", margin)
    .attr("y", margin)
    .attr("rx", 2)         // set the x corner curve radius
    .attr("ry", 2);
}
initSketch();

var matrix_container = d3.select("svg").append("svg")
  .attr("width", width / 2)
  .attr("height", width / 2 * .75 )
  .attr("x", container_width + 2 * margin);

var matrixData;
var row, column;
var cell_width, cell_height;
function initMatrix() {
  cell_width = ( container_width - cell_margin * ( Math.floor(params.num_hits) + 1 ) ) / Math.floor(params.num_hits);
  cell_height =  ( container_height - cell_margin * ( Math.floor(params.num_pitches) + 1 ) ) / Math.floor(params.num_pitches);
  matrix_container.append("rect")
    .attr("width", container_width)
    .attr("height", container_height)
    .attr("x", margin)
    .attr("y", margin)
    .attr("rx", 2)         // set the x corner curve radius
    .attr("ry", 2);

  row = matrix_container.selectAll(".row")
    .data(matrixData)
    .enter().append("g")
    .attr("class", "row");

  column = row.selectAll(".cell")
    .data(function(d) { return d; })
    .enter().append("rect")
    .attr("class","cell")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("width", function(d) { return d.width; })
    .attr("height", function(d) { return d.height; })
    .attr("rx", function(d) { return d.rx; })
    .attr("ry", function(d) { return d.ry; })
    .attr("pitch", function(d) { return d.pitch; })
    .attr("hit", function(d) { return d.hit; })
    .attr("startTime", function(d) { return d.startTime; })
    .attr("endTime", function(d) { return d.endTime; })
    .attr("downbeat", function(d) { return d.downbeat; })
    .attr("cell_off_color", function(d) { return d.cell_off_color; })
    .style("fill", function(d) { return d.cell_off_color; } )
    .style("stroke", function(d) { return d.cell_off_color; } )
    .on('click', function(d) {
       d.pressed = !d.pressed;
       if ( d.pressed ) {
          d3.select(this).style("fill", onColor );
          d3.select(this).style("stroke", onColor );
          console.log( "hit: ", d.hit, ", pitch: ", d.pitch, ", downbeat: ", d.downbeat, ", startTime: ", d.startTime, ", endTime: ", d.endTime );
       }
       else {
         d3.select(this).style("fill", d.cell_off_color );
         d3.select(this).style("stroke", d.cell_off_color );
       }
    });
}

var tonic = 48;
var mode = 0;
var scale_pitches = [];
var max_num_pitches = 40;
initScale( mode );
initMatrix();

function matrixData() {
    var matrix = new Array();
    var xpos = margin + cell_margin; //starting xpos and ypos
    var ypos = margin + cell_margin;
    var pressed = false;

    // iterate for columns
    for (var column = 0; column < params.num_hits; column++) {
        matrix.push( new Array() );

        // iterate for rows inside columns
        for (var row = 0; row < params.num_pitches; row++) {
          var this_downbeat, this_cell_off_color, this_startTime, this_endTime;
          if ( column % params.meter == 0 ) {
            this_downbeat = true;
            this_cell_off_color = downbeatColor;
          }
          else {
            this_downbeat = false;
            this_cell_off_color = offColor;
          }
          this_startTime = ( column * 60 ) / ( params.meter * params.tempo );
          this_endTime = ((column + 1) * 60) / ( params.meter * params.tempo );
            matrix[column].push({

                x: xpos,
                y: ypos,
                width: cell_width,
                height: cell_height,
                rx: 2,
                ry: 2,
                pressed: pressed,
                pitch: scale_pitches[row],
                hit: column,
                startTime: this_startTime,
                endTime: this_endTime,
                downbeat: this_downbeat,
                cell_off_color: this_cell_off_color

            });
            // increment the y position
            ypos += cell_height + cell_margin;
            //console.log( "scale_pitches: ", scale_pitches[ row ] );
            //console.log( "matrix_pitch: ", matrix[ column ][ row ].pitch );


        }
        // reset the y position after a column is complete
        ypos = margin + cell_margin;

        // increment the x position for the next row. Move it down 50 (height variable)
        xpos += cell_width + cell_margin;
    }
    return matrix;
}

// active line drawing
var ptdata = [];
var session = [];
var path;
var line;

function handleStartDrawing() {
  bDrawing = true;
  if ( !params.erase ) {
    ptdata = [];
    line = d3.line()
      .x(function(d, i) { return d.x; })
      .y(function(d, i) { return d.y; });

    path = sketch_container.append("path") // start a new line
      .data([ptdata])
      .attr("class", "line")
      .attr("d", line);
  }
}

function sketch() {
  //console.log("bdrawing: " + bDrawing);
  if ( bDrawing ) {
    var point = d3.mouse(this);

    if ( params.erase ) {
      //console.log( "erasing: " + point );
      erase( point );
    }

    else {
      //console.log( "drawing: " + point );
      ptdata.push({ x: point[0], y: point[1] });
      path.attr("d", function(d) { return line(d); }); // Redraw the path:
    }
  }
}

function handleEndDrawing() {
  //console.log("endDrawing called");
  if ( bDrawing ){
    bDrawing = false;
    if ( !params.erase ){
      ptdata = simplify(ptdata);
      session.push(ptdata);
    }
  }
}

var erase_radius = 15;
function erase( m_pos ) {
  //console.log( "in erase function: " + m_pos );
  if ( m_pos[ 0 ] > margin + erase_radius && m_pos[ 0 ] < margin + container_width - erase_radius ) {
    if ( m_pos[ 1 ] > margin + erase_radius && m_pos[ 1 ] < margin + container_height - erase_radius ) {
      sketch_container.insert('circle')
      .attr("cx", m_pos[0])
      .attr("cy", m_pos[1])
      .attr("r", erase_radius)
      .style("stroke", '#282828')
      .style("fill", '#282828')
      .style("stroke-opacity", 1);
    }
  }
}


function initScale( current_mode ) {
  console.log( "initScale: ", max_num_pitches );
  if ( current_mode == 0 ) {
        //pentatonic
        for ( var i = 0; i < max_num_pitches; i ++ ) {
            if ( i % 5 == 0 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 5 );
            }
            if ( i % 5 == 1 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 5 ) + 2;
            }
            if ( i % 5 == 2 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 5 ) + 4;
            }
            if ( i % 5 == 3 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 5 ) + 7;
            }
            if ( i % 5 == 4 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 5 ) + 9;
            }
            //cout << "scale_pitches: " << scale_pitches[ i ] << ", " << endl;
          //console.log( "scale_pitches: ", scale_pitches[ i ] );
        }
    }

    if ( current_mode == 1 ) {
        //major
        for ( var i = 0; i < max_num_pitches; i ++ ) {
            if ( i % 7 == 0 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 );
            }
            if ( i % 7 == 1 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 2;
            }
            if ( i % 7 == 2 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 4;
            }
            if ( i % 7 == 3 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 5;
            }
            if ( i % 7 == 4 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 7;
            }
            if ( i % 7 == 5 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 9;
            }
            if ( i % 7 == 6 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 11;
            }
            //cout << "scale_pitches: " << scale_pitches[ i ] << ", " << endl;
            //console.log( "scale_pitches: ", scale_pitches[ i ] );

        }
    }

    if ( current_mode == 2 ) {
        //minor
        for ( var i = 0; i < max_num_pitches; i ++ ) {
            if ( i % 7 == 0 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 );
            }
            if ( i % 7 == 1 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 2;
            }
            if ( i % 7 == 2 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 3;
            }
            if ( i % 7 == 3 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 5;
            }
            if ( i % 7 == 4 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 7;
            }
            if ( i % 7 == 5 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 8;
            }
            if ( i % 7 == 6 ) {
                scale_pitches[ i ] = tonic + 12 * Math.floor( i / 7 ) + 10;
            }
            //cout << "scale_pitches: " << scale_pitches[ i ] << ", " << endl;
            //console.log( "scale_pitches: ", scale_pitches[ i ] );

        }
    }
}
//initScale( mode );

