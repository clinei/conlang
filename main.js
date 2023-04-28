// @Incomplete
// buffer can be written to directly
// @Incomplete
// overlay text on button
// latin script
// alien script

// @Incomplete
// need a monitor with 3 pixel coordinates
// https://en.wikipedia.org/wiki/Trilinear_coordinates
// https://en.wikipedia.org/wiki/Barycentric_coordinate_system

let canvas = null;
let glyph_map = null;
let buttons = null;
let controls = {
	mouse_x: 0,
	mouse_y: 0,
};
let curr_time = 0;

let script = "alien";
let alphabet = "aueiscfptk";
let buffer = [];

function init_canvas() {
	canvas = document.getElementById("canvas");
	resize_canvas();
}
function resize_canvas() {
	let cs = window.getComputedStyle(canvas);
	canvas.width = parseInt(cs.width.substring(0, cs.width.length-1));
	canvas.height = parseInt(cs.height.substring(0, cs.height.length-1));
}
const Button = {
	x: 0,
	y: 0,
	radius: 20,
	hovered: false,
	pressed: false,
	played_back: false,
	action: "none",
};
function make_button(x = 0, y = 0, radius = 20) {
	let button = Object.assign({}, Button);
	button.x = x;
	button.y = y;
	button.radius = radius;
	return button;
}
function generate_buttons() {
	// @Incomplete
	// should use triangular coordinates
	// @Incomplete
	// need button for Space
	let buttons = new Array();
	let radius = 20;
	let center_x = canvas.width / 2;
	let center_y = canvas.height / 2;
	for (let j = 0; j < 3; j += 1) {
		let set_rotation = Math.PI*2 -(j * Math.PI*2 / 3);
		let x = 0;
		let y = 0;
		y -= radius * 3.9;
		let set_x = Math.cos(set_rotation) * x - Math.sin(set_rotation) * y;
		let set_y = Math.sin(set_rotation) * x + Math.cos(set_rotation) * y;
		for (let i = 0; i < 3; i += 1) {
			let eye_rotation = Math.PI*2 -(i * Math.PI*2 / 3);
			let x = 0;
			let y = 0;
			y -= radius * 1.3;
			let eye_x = Math.cos(eye_rotation) * x - Math.sin(eye_rotation) * y;
			let eye_y = Math.sin(eye_rotation) * x + Math.cos(eye_rotation) * y;
			let final_x = eye_x + set_x + center_x;
			let final_y = eye_y + set_y + center_y;
			buttons.push(make_button(final_x, final_y, radius));
		}
	}
	// center buttons
	{
		let x = 0;
		let y = 0;
		y -= radius * 1.3;
		for (let k = 0; k < 3; k += 1) {
			let center_rotation = Math.PI*2 -(k * Math.PI*2 / 3);
			let button_x = Math.cos(center_rotation) * x - Math.sin(center_rotation) * y;
			let button_y = Math.sin(center_rotation) * x + Math.cos(center_rotation) * y;
			let final_x = button_x + center_x;
			let final_y = button_y + center_y;
			buttons.push(make_button(final_x, final_y, radius));
		}
		let i_button = buttons[9];
		buttons.splice(9, 1);
		buttons.splice(3, 0, i_button);
	}
	for (let i = 0; i < alphabet.length; i += 1) {
		let button = buttons[i];
		button.action = alphabet[i];
	}
	buttons[10].action = "N";
	buttons[11].action = "D";
	return buttons;
}
function draw() {
	let ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < buttons.length; i += 1) {
		let button = buttons[i];
		let x = button.x;
		let y = button.y;
		let radius = button.radius;
		if (button.played_back) {
			ctx.fillStyle = "rgb(100, 100, 60)";
		}
		else if (button.pressed) {
			ctx.fillStyle = "rgb(60, 60, 60)";
		}
		else if (button.hovered) {
			ctx.fillStyle = "rgb(100, 100, 100)";
		}
		else {
			ctx.fillStyle = "rgb(80, 80, 80)";
		}
		ctx.beginPath();
		ctx.ellipse(x, y, radius, radius, 0, 0, Math.PI*2);
		ctx.fill();
		ctx.font = "20px sans-serif";
		ctx.fillStyle = "rgb(60, 200, 60)";
		let button_text = button.action;
		if (script == "latin") {
			ctx.fillText(button_text, x - 6, y + 6);
		}
		else if (script == "alien") {
			ctx.fillStyle = "rgb(200, 0, 0)";
			let size = 12;
			let final_x = x + size / 2;
			let final_y = y - size / 2;
			draw_text(button_text, glyph_map, final_x, final_y, 12);
		}
	}
	let center_x = canvas.width / 2;
	let center_y = canvas.height / 2;
	if (playback.active == false) {
		let text_x = center_x - 200;
		let text_y = center_y + 200;
		ctx.fillStyle = "rgb(100, 100, 100)";
		ctx.font = "40px sans-serif";
		let text = "";
		for (let i = 0; i < buffer.length; i += 1) {
			let button = buttons[buffer[i]];
			text += button.action;
		}
		ctx.fillText(text, text_x, text_y);
	}
}
function update() {
	curr_time = new Date().getTime();
	update_playback();
	draw();
	requestAnimationFrame(update);
}
function init_controls() {
	canvas.addEventListener("mousemove", canvas_mousemove);
	canvas.addEventListener("mousedown", canvas_mousedown);
	canvas.addEventListener("mouseup", canvas_mouseup);
}
function canvas_mousemove(event) {
	controls.mouse_x = event.offsetX;
	controls.mouse_y = event.offsetY;
	update_buttons();
}
function canvas_mousedown(event) {
	controls.mouse_pressed = true;
	// nocheckin
	// move this into update
	update_buttons();
}
function canvas_mouseup(event) {
	controls.mouse_pressed = false;
	update_buttons();
}
function distance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
function update_buttons() {
	for (let i = 0; i < buttons.length; i += 1) {
		let button = buttons[i];
		let dist = distance(controls.mouse_x, controls.mouse_y, button.x, button.y);
		if (dist < button.radius) {
			button.hovered = true;
			if (controls.mouse_pressed) {
				button.pressed = true;
			}
			else {
				if (button.pressed) {
					press_button(i);
				}
				button.pressed = false;
			}
		}
		else {
			button.hovered = false;
			button.pressed = false;
		}
	}
}
function press_button(i) {
	let button = buttons[i];
	if (button.action == "D") {
		buffer.length = 0;
	}
	else if (button.action == "N") {
		start_playback();
	}
	else {
		buffer.push(i);
	}
}
const Playback = {
	current_index: 0,
	duration: 0.6,
	last_time: 0,
	active: false,
};
function make_playback() {
	let playback = Object.assign({}, Playback);
	return playback;
}
let playback = make_playback();
function start_playback() {
	playback.current_index = 0;
	playback.last_time = curr_time;
	playback.active = true;
}
function stop_playback() {
	clear_playback();
	buffer.length = 0;
	playback.last_time = curr_time;
	playback.active = false;
}
function clear_playback() {
	for (let i = 0; i < buttons.length; i += 1) {
		let button = buttons[i];
		button.played_back = false;
	}
}
function update_playback() {
	if (playback.active) {
		if (playback.current_index == buffer.length) {
			stop_playback();
			return;
		}
		let elapsed = curr_time - playback.last_time;
		elapsed /= 1000;
		let duration = playback.duration;
		let padding = duration / 3;
		let button = buttons[buffer[playback.current_index]];
		if (padding < elapsed && elapsed < (duration - padding)) {
			button.played_back = true;
		}
		if (elapsed > duration) {
			button.played_back = false;
			playback.current_index += 1;
			playback.last_time = curr_time;
		}
	}
}
function init_text() {
	glyph_map = generate_glyph_map("auei scf ptk");
}
function main() {
	curr_time = new Date().getTime();
	init_canvas();
	buttons = generate_buttons();
	init_controls();
	init_text();
	update();
}
main();