// Apply random colors to selected items
var items = pg.selection.getSelectedItems();

for(var i=0; i<items.length; i++) {
	items[i].fillColor = new Color(Math.random(), Math.random(), Math.random());
}
