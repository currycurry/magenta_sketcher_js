var width = Math.max(960, innerWidth),
    height = Math.max(500, innerHeight);

var margin = 10;
var gui_margin = 150;
var container_width = width / 2 - 2 * margin - gui_margin;
var container_height = container_width * .75;
var matrix;
var offColor = '#686868';
var onColor = 'white';
var bPressed = false;
var num_hits = 16;
var num_notes = 10;
var cell_margin = 2;
var cell_width = ( container_width - cell_margin * ( num_hits + 1 ) ) / num_hits;
var cell_height =  ( container_height - cell_margin * ( num_notes + 1 ) ) / num_notes;
var bDrawing = false;

//console.log( matrixData );

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var sketch_container = d3.select("svg").append("svg")
  .attr("width", width / 2)
  .attr("height", width / 2 * .75 )    
  .on("mousedown", handleStartDrawing )
  .on("mousemove", sketch )
  .on("mouseup", handleEndDrawingUp )
  .on("mouseleave", handleEndDrawingOut );

function initSketch() {
  sketch_container.append("rect")
    .attr("width", container_width)
    .attr("height", container_height)
    .attr("x", margin)
    .attr("y", margin);
}
initSketch();

var matrix_container = d3.select("svg").append("svg")
  .attr("width", width / 2)
  .attr("height", width / 2 * .75 )
  .attr("x", container_width + 2 * margin);

var matrixData;
var row, column;
function initMatrix() {
  matrix_container.append("rect")
    .attr("width", container_width)
    .attr("height", container_height)
    .attr("x", margin)
    .attr("y", margin);

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
    .style("fill", offColor )
    .style("stroke", offColor )
    .on('click', function(d) {
       d.pressed = !d.pressed;
       if ( d.pressed ) {
          d3.select(this).style("fill", onColor );
          d3.select(this).style("stroke", onColor );
       }
       else {
          d3.select(this).style("fill", offColor );
          d3.select(this).style("stroke", offColor );
       }
    });
}
initMatrix();

function matrixData() {
    var matrix = new Array();
    var xpos = margin + cell_margin; //starting xpos and ypos 
    var ypos = margin + cell_margin;
    var pressed = false;

    // iterate for rows 
    for (var row = 0; row < num_notes; row++) {
        matrix.push( new Array() );

        // iterate for cells/columns inside rows
        for (var column = 0; column < num_hits; column++) {
            matrix[row].push({
                x: xpos,
                y: ypos,
                width: cell_width,
                height: cell_height,
                pressed: pressed
            })
            // increment the x position
            xpos += cell_width + cell_margin;
        }
        // reset the x position after a row is complete
        xpos = margin + cell_margin;
        // increment the y position for the next row. Move it down 50 (height variable)
        ypos += cell_height + cell_margin; 
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
      console.log( "erasing: " + point );
      erase( point );
    }

    else {
      //console.log( "drawing: " + point );
      ptdata.push({ x: point[0], y: point[1] });
      path.attr("d", function(d) { return line(d); }) // Redraw the path:
    }
  }
}

function handleEndDrawingUp() {
  console.log("endDrawing up called");
  if ( bDrawing ){
    bDrawing = false;
    if ( !params.erase ){
      ptdata = simplify(ptdata);
      session.push(ptdata);

    }

  } 
}

function handleEndDrawingOut() {
  console.log("endDrawing out called");
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
  console.log( "in erase function: " + m_pos );
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

/////////////////////
// initialize the gui
var params = {
  bars : 4,
  erase : false,
  save : false,
  clear : false,
  num_hits : 16,
  num_notes : 10
};

var clearCallback;

function initGui() {
  var gui = new dat.GUI( );
  //gui.remember(params);
  gui.add(params, 'bars', 1, 8).listen();
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
  gui.add(params, 'num_hits', 4, 128);
  gui.add(params, 'num_notes', 5, 40);

}

initGui();