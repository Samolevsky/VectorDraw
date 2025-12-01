// Generate random stars
var numStars = 30;

for(var i=0; i<numStars; i++) {
	var points = 5 + Math.floor(Math.random() * 3); // 5-7 points
	var radius1 = 20 + Math.random() * 30;
	var radius2 = radius1 * 0.4;
	var star = new Path.Star(
		new Point(Math.random() * view.size.width, Math.random() * view.size.height),
		points,
		radius1,
		radius2
	);
	star.fillColor = new Color(Math.random(), Math.random(), Math.random());
	star.rotate(Math.random() * 360);
}
