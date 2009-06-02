$(function(){

$('#colorpicker').ColorPicker({
	color: '#000',
	onShow: function (colpkr) {
		$(colpkr).fadeIn(500);
		return false;
	},
	onHide: function (colpkr) {
		$(colpkr).fadeOut(500);
		return false;
	},
	onChange: function (hsb, hex, rgb) {
		$('#colorpicker div').css('backgroundColor', '#' + hex);
		currentColor = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
	}
});

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
	// mwahaha
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

	this.mousemove = function(e) {
		if (!tool.started) return;

		ctx.lineWidth   = currentLineWidth;
		ctx.strokeStyle = currentColor;
		
		ctx.lineTo(e._x, e._y);
		ctx.stroke();

		currentPath.points.push({x: e._x, y: e._y, });
	};

	this.mouseup = function(e) {
		if (tool.started) {
			tool.mousemove(e);
			tool.started = false;
		}
		
		paths.push(currentPath);
		currentPath = {}
		
		save();
	};
}

function save() {
	$.post('save', {'width': $(canvas).width(),
			'height': $(canvas).height(),
			'url': url, // url is defined outside
			'paths': printPaths()}, function(){
		$('#status').fadeIn().fadeOut();
	});
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
	// removes last comma
	return s.join('').replace(/,\]/g, ']');
}

// used for lack of percentage dimensions support
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

function eventHandler(e) {
	if (e.layerX || e.layerX == 0) { // Firefox
		e._x = e.layerX;
		e._y = e.layerY;
	} else if (e.offsetX || e.offsetX == 0) { // Opera
		e._x = e.offsetX;
		e._y = e.offsetY;
	}
	
	// canvas mouse event handling bug
	e._x -= $('canvas').position().left;
	e._y -= $('canvas').position().top;

	tool[e.type](e);
}

});

function reset() {
	window.location = '/';
}