google.load("jquery", "1.3.2");
google.setOnLoadCallback(function(){$(function() {

var currentColor = 'rgb(0,0,0)';
var currentLineWidth = 1;
var currentPath = [];

var canvas = buildCanvas();
var ctx = canvas.getContext('2d');
var tool = new Pencil();

$(document).keypress(function(e) {
	if(e.charCode == 26 || (e.charCode == 122 && e.ctrlKey)) { // safari
		paths.pop();
		ctx.clearRect(0, 0, $(canvas).width(), $(canvas).height())
		drawPaths();
		save();
	}
});

$('.colors div').click(function(e){
	currentColor = getComputedStyle(e.target, null).getPropertyValue('background-color');
});
$('#lineWidth').change(function(e){
	var value = parseInt(e.target.value);
	if(value) currentLineWidth = value;
})

drawPaths();

function drawPaths() {
	if(paths.length == 0) return;

	for(i in paths) {
		var path = paths[i];
		ctx.beginPath();
		ctx.lineWidth   = path.stroke;
		ctx.strokeStyle = path.color;
		ctx.moveTo(path.points[0].x, path.points[0].y)
		for(j = 1; j < path.points.length; j++) {
			var point = path.points[j];
			ctx.lineTo(point.x, point.y);
			ctx.stroke();
		}
		ctx.closePath();
	}
}

function Pencil() {
	var tool = this;
	this.started = false;

	this.mousedown = function(ev) {
		ctx.beginPath();
		ctx.moveTo(ev._x, ev._y);
		tool.started = true;
		
		currentPath = {points: [], color: currentColor, stroke: currentLineWidth};
	};

	// This function is called every time you move the mouse. Obviously, it only 
	// draws if the tool.started state is set to true (when you are holding down 
	// the mouse button).
	this.mousemove = function(ev) {
		if (!tool.started) return;

		ctx.lineWidth   = currentLineWidth;
		ctx.strokeStyle = currentColor;
		
		ctx.lineTo(ev._x, ev._y);
		ctx.stroke();

		currentPath.points.push({x: ev._x, y: ev._y, });
	};

	// This is called when you release the mouse button.
	this.mouseup = function(ev) {
		if (tool.started) {
			tool.mousemove(ev);
			tool.started = false;
		}
		
		paths.push(currentPath);
		currentPath = {}
		
		save();
	};
}

function save() {
	var url = window.location.toString().split('/');
	url = url[url.length - 1];
	$.post('save', {'width': $(canvas).width(),
			'height': $(canvas).height(),
			'url': url, 'paths': printPaths()}, function(){
		$('#status').fadeIn().fadeOut();
	});
}

function eventHandler(ev) {
	if (ev.layerX || ev.layerX == 0) { // Firefox
		ev._x = ev.layerX;
		ev._y = ev.layerY;
	} else if (ev.offsetX || ev.offsetX == 0) { // Opera
		ev._x = ev.offsetX;
		ev._y = ev.offsetY;
	}
	
	ev._x -= $('canvas').position().left;
	ev._y -= $('canvas').position().top;

	// Call the event handler of the tool.
	tool[ev.type](ev);
}

function printPaths() {
	var s = ['['];
	for(i in paths) {
		var path = paths[i];
		s.push('{color:"' + path.color + '",stroke:' + path.stroke + ', points:[');
		for(i in path.points) {
			var point = path.points[i];
			s.push('{x:' + point.x + ',y: ' + point.y + '},');
		}
		
		s.push(']},');
	}
	s.push(']');
	return s.join('').replace(/,\]/g, ']');
}

function buildCanvas() {
	var canvasContainer = $('.container')[0];
	var canvas = document.createElement('canvas');
	canvas.id = 'canvas';
	canvas.width = canvasWidth || canvasContainer.scrollWidth;
	canvas.height = canvasHeight || canvasContainer.scrollHeight;
	canvas.style.width = canvasContainer.style.width + "px";
	canvas.style.height = canvasContainer.style.height + "px";
	canvas.style.overflow = 'visible';
	canvas.style.position = 'absolute';
	canvasContainer.appendChild(canvas);
	canvas.addEventListener('mousedown', eventHandler, false);
	canvas.addEventListener('mousemove', eventHandler, false);
	canvas.addEventListener('mouseup',	 eventHandler, false);
	
	return canvas;
}

})});

function reset() {
	window.location = '/';
}