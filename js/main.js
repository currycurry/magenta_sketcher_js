var boundingWidth;
var boundingHeight;
var windowWidth;
var windowHeight;

function resizeAndRedrawCanvas()
{
  var desiredWidth = $(window).width(); // For instance: $(window).width();
  var desiredHeight = $(window).height(); // For instance $('#canvasContainer').height();

  boundingWidth = desiredWidth/3;
  boundingHeight = boundingWidth;
  windowWidth = desiredWidth;
  windowHeight = desiredHeight;

  view.viewSize = new Size(desiredWidth, desiredHeight);
  view.draw();
}

paper.install(window);

var background;
$( document ).ready(function() {
  resizeAndRedrawCanvas();
  var backgroundRect = new Rectangle(new Point(0, 0), view.size);
  background = new Path.Rectangle(backgroundRect);
  background.fillColor = {
  	gradient: {
  		stops: [ ['white', 0], ['darkBlue', 1] ]
  	},
  	origin: [ windowWidth / 2, 0 ],
  	destination: [ windowWidth / 2, windowHeight ]
  }

  background.sendToBack();

  initContainers();

});

var sketch_container;
var matrix_container;
var matrix;
var offColor = 'black';
var onColor = 'white';
var num_hits = 16;
var num_notes = 10;
matrix_cell_rectangle = new Array();
matrix = new Array();
cell_color = new Array();
pressed = new Array();

function initContainers() {
	  //draw 
  var margin = 10;
  var cell_margin = 2;
  var container_width = ( windowWidth - 3 * margin ) / 2 ;
  var container_height = container_width * .75;
  var container_size = new Size( container_width, container_height );
  var sketch_rectangle = new Rectangle(new Point( margin, margin ), container_size );
  sketch_container = new Path.Rectangle(sketch_rectangle);
  sketch_container.fillColor = '#484848';

  var matrix_rectangle = new Rectangle(new Point( (windowWidth + margin ) / 2, margin ), container_size );
  matrix_container = new Path.Rectangle(matrix_rectangle);
  matrix_container.fillColor = '#484848';

  var cell_size = new Size(( matrix_rectangle.width - cell_margin * ( num_hits - 1 ) ) / num_hits, ( matrix_rectangle.height - cell_margin * ( num_notes - 1 ) ) / num_notes );

  for ( var i = 0; i < num_hits; i ++ ) {
  	matrix_cell_rectangle[ i ] = new Array();
  	matrix[ i ] = new Array();
  	cell_color[ i ] = new Array();
  	pressed[ i ] = new Array();
  	for ( var j = 0; j < num_notes; j ++ ) {
  		matrix_cell_rectangle[ i ][ j ] = new Rectangle( new Point( matrix_rectangle.x + i * ( cell_size.width + cell_margin ), matrix_rectangle.y + j * ( cell_size.height + cell_margin ) ), cell_size );
  		matrix[ i ][ j ] = new Path.Rectangle( matrix_cell_rectangle[ i ][ j ] );
  		cell_color[ i ][ j ] = offColor;
  		matrix[ i ][ j ].fillColor = cell_color[ i ][ j ];

  		pressed[ i ][ j ] = false;
  	}
  }

}

function onMouseMove(event) {


}

function onMouseDown(event) {

	for ( var i = 0; i < num_hits; i ++ ) {
	    for( var j = 0; j < num_notes; j ++ ) {
	        
	        if( matrix[ i ][ j ].bounds.contains( event.point )) {
	            
	            pressed[ i ][ j ] = !pressed[ i ][ j ];

	            
	            if ( pressed[ i ][ j ] ) {
	                cell_color[ i ][ j ] = onColor;

	            }
	            
	            if ( !pressed[ i ][ j ] ) {
	                //if ( i % hits_per_beat ==0 ) {
	                  //  box_color[ i ][ j ] = downbeat_off_color;
	                //}
	                //else {
	                    cell_color[ i ][ j ] = offColor;
	                //}
	            }
	            matrix[ i ][ j ].fillColor = cell_color[ i ][ j ];

	        }
	    }
	}

}

function onMouseUp(event) {


}


