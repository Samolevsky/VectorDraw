// Create a triangle mosaic pattern
var rows = 10;
var cols = 15;
var size = 30;

for(var row=0; row<rows; row++) {
	for(var col=0; col<cols; col++) {
		var x = col * size;
		var y = row * size;
		
		var triangle = new Path.RegularPolygon(new Point(x, y), 3, size / 2);
		triangle.fillColor = new Color(Math.random(), Math.random(), Math.random());
		triangle.strokeColor = 'white';
		triangle.strokeWidth = 1;
		triangle.rotate((row + col) % 2 === 0 ? 0 : 180);
	}
}
