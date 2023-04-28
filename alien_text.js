function generate_glyph_map(letters, bitmap_width = 5, bitmap_height = 5) {
	let glyph_map = new Object();
	glyph_map.bitmap_width = bitmap_width;
	glyph_map.bitmap_height = bitmap_height;
	let bitmaps = new Object();
	let group_index = 0;
	let letter_index = 0;
	for (let j = 0; j < letters.length; j += 1) {
		let letter = letters[j];
		if (letter == " ") {
			group_index += 1;
			letter_index = 0;
			continue;
		}
		let left = false;
		let right = false;
		let top = false;
		let bottom = false;
		let dot = false;
		if (group_index == 0) {
			// vowels
			left = true;
		}
		if (group_index == 1) {
			// fricatives
			right = true;
			dot = true;
		}
		if (group_index == 2) {
			// plosives
			right = true;
		}
		if (letter_index == 0) {
			top = true;
		}
		if (letter_index == 1) {
			bottom = true;
		}
		if (letter_index == 2) {
			top = true;
			bottom = true;
		}
		if (letter_index == 3) {
			top = true;
			bottom = true;
			dot = true;
		}
		bitmaps[letter] = render_box(top, bottom, left, right, dot, bitmap_width, bitmap_height);
		letter_index += 1;
	}
	// special letters
	// confirm
	bitmaps["N"] = render_box(1, 1, 1, 1, 0, bitmap_width, bitmap_height);
	// cancel
	bitmaps["D"] = render_box(1, 1, 0, 0, 1, bitmap_width, bitmap_height);
	// space
	bitmaps["S"] = render_box(0, 1, 1, 1, 0, bitmap_width, bitmap_height);
	glyph_map.bitmaps = bitmaps;
	return glyph_map;
}
function render_box(top, bottom, left, right, dot, bitmap_width, bitmap_height) {
	let bitmap = new Array(bitmap_width * bitmap_height).fill(0);
	if (left) {
		for (let i = 0; i < bitmap_height; i += 1) {
			bitmap[i * bitmap_width] = 1;
		}
	}
	if (right) {
		for (let i = 0; i < bitmap_height; i += 1) {
			bitmap[i * bitmap_width + bitmap_width - 1] = 1;
		}
	}
	if (top) {
		for (let i = 0; i < bitmap_width; i += 1) {
			bitmap[i] = 1;
		}
	}
	if (bottom) {
		let bottom_begin_index = bitmap_width * (bitmap_height-1);
		for (let i = 0; i < bitmap_width; i += 1) {
			bitmap[i + bottom_begin_index] = 1;
		}
	}
	if (dot) {
		let center_index = Math.floor(bitmap_width * bitmap_height / 2);
		bitmap[center_index] = 1;
	}
	return bitmap;
}
function draw_text(text, glyph_map, x = 0, y = 0, size = 8, width = 0, height = 0, direction = "left", alternating = false) {
	let bitmap_width = glyph_map.bitmap_width;
	let bitmap_height = glyph_map.bitmap_width;
	let character_width = size;
	let character_height = size;
	let pixel_width = character_width / bitmap_width;
	let pixel_height = character_height / bitmap_height;
	let curr_x = x;
	let curr_y = y;
	if (width == 0) {
		width = canvas.width;
	}
	if (height == 0) {
		height = character_height;
	}
	let tokens = tokenize(text);
	if (direction == "right") {
		curr_x = x;
	}
	if (direction == "left") {
		curr_x = x - character_width;
	}
	// @Incomplete
	// word-wrap needs to be a separate phase before rendering
	// need to wrap on syllable
	// @Incomplete
	// the alternation between writing directions should be manual
	// because it has a special meaning
	// there is a special word to change the writing direction
	// probably a verb
	let ctx = canvas.getContext("2d");
	for (let j = 0; j < tokens.length; j += 1) {
		let token = tokens[j];
		if (token.str == " " && curr_x > 0) {
			let increment = character_width + pixel_width;
			if (direction == "right") {
				curr_x += increment;
			}
			else if (direction == "left") {
				curr_x -= increment;
			}
		}
		let new_line = token.str == "\n";
		// nocheckin
		// remove
		if (j != 0) {
			new_line |= (direction == "right")  * ((curr_x + character_width * token.str.length) > width);
			new_line |= (direction == "left") * ((curr_x - character_width * token.str.length) < 0);
		}
		if (new_line) {
			if (alternating) {
				if (direction == "right") {
					direction = "left";
				}
				else if (direction == "left") {
					direction = "right";
				}
			}
			if (direction == "right") {
				curr_x = x;
			}
			else if (direction == "left") {
				curr_x = x + width - character_width;
			}
			else {
				throw Error("unknown direction: \"" + direction + "\"");
			}
			curr_y += character_height * 2;
		}
		let bitmaps = glyph_map.bitmaps;
		for (let i = 0; i < token.str.length; i += 1) {
			let letter = token.str[i];
			let should_render = bitmaps.hasOwnProperty(letter);
			if (should_render) {
				let bitmap = bitmaps[letter];
				let pixel_x = 0;
				let pixel_y = 0;
				for (let y = 0; y < bitmap_height; y += 1) {
					for (let x = 0; x < bitmap_width; x += 1) {
						let pixel = bitmap[y * bitmap_width + x];
						if (pixel == 1) {
							ctx.fillStyle = "rgba(100, 140, 100, 1.0)";
							let begin_x = curr_x + pixel_x;
							let begin_y = curr_y + pixel_y;
							ctx.fillRect(begin_x, begin_y, pixel_width, pixel_height);
						}
						pixel_x += pixel_width;
						if (pixel_x + pixel_width > character_width) {
							pixel_x = 0;
						}
					}
					pixel_y += pixel_height;
				}
				if (direction == "right") {
					curr_x += character_width;
					curr_x += pixel_width;
				}
				else if (direction == "left") {
					curr_x -= character_width;
					curr_x -= pixel_width;
				}
				else {
					throw Error("unknown direction: \"" + direction + "\"");
				}
			}
		}
	}
}
const Token_Kind = {
	WORD: "word",
	WHITESPACE: "whitespace",
};
const Token = {
	kind: null,
	str: null,
};
function make_token(kind, str) {
	let token = Object.assign({}, Token);
	token.kind = kind;
	token.str = str;
	return token;
}
function tokenize(characters) {
	let tokens = new Array();
	let begin_character_index = 0;
	let end_character_index = 0;
	for (let i = 0; i < characters.length; i += 1) {
		let character = characters[i];
		let end_of_file = i == characters.length-1;
		end_character_index = i;
		let should_push_word = false;
		let should_push_whitespace = false;
		if (character == " " || character == "\n") {
			should_push_word = true;
			should_push_whitespace = true;
		}
		else if (end_of_file) {
			should_push_word = true;
			end_character_index += 1;
		}
		if (should_push_word) {
			let str = characters.substring(begin_character_index, end_character_index);
			let token = make_token(Token_Kind.WORD, str);
			tokens.push(token);
		}
		if (should_push_whitespace) {
			let token = make_token(Token_Kind.WHITESPACE, character);
			begin_character_index = i + 1;
			tokens.push(token);
		}
	}
	return tokens;
}