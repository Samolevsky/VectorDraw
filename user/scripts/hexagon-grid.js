// Create a hexagonal grid pattern
var hexRadius = 25;
var rows = 8;
var cols = 10;
var hexHeight = hexRadius * Math.sqrt(3);
var hexWidth = hexRadius * 2;

for(var row=0; row<rows; row++) {
	for(var col=0; col<cols; col++) {
		var x = col * hexWidth * 0.75;
		var y = row * hexHeight + (col % 2) * hexHeight / 2;
		
		var hex = new Path.RegularPolygon(new Point(x, y), 6, hexRadius);
		hex.strokeColor = 'black';
		hex.fillColor = new Color(col / cols, row / rows, 0.5);
	}
}
