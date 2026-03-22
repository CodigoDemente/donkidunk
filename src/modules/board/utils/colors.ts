type RGB = {
	r: number;
	g: number;
	b: number;
};

type HSL = {
	h: number;
	s: number;
	l: number;
};

export function getTextColorForBackground(backgroundColor: string): string {
	const rgb: RGB = hexStringToRgb(backgroundColor);

	// compute relative luminance per WCAG
	function srgbToLinear(c: number) {
		c = c / 255;
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	}

	const R = srgbToLinear(rgb.r);
	const G = srgbToLinear(rgb.g);
	const B = srgbToLinear(rgb.b);

	const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B; // 0 (dark) .. 1 (bright)

	// prefer white text in the dark-themed app; only use black for light backgrounds
	const LIGHT_THRESHOLD = 0.5;
	return luminance > LIGHT_THRESHOLD ? '#000000' : '#ffffff';
}

export function getHoverBackgroundColor(backgroundColor: string): string {
	const rgb: RGB = hexStringToRgb(backgroundColor);

	const hsl = rgbToHsl(rgb);

	const newL = Math.max(0, hsl.l - 0.1);

	const hslAdjusted = {
		h: hsl.h,
		s: hsl.s,
		l: newL
	};

	const rgbAdjusted = hslToRgb(hslAdjusted);

	return (
		'#' +
		rgbAdjusted.r.toString(16).padStart(2, '0') +
		rgbAdjusted.g.toString(16).padStart(2, '0') +
		rgbAdjusted.b.toString(16).padStart(2, '0')
	);
}

function hslToRgb(hsl: HSL): RGB {
	const { h, s, l } = hsl;

	const C = (1 - Math.abs(2 * l - 1)) * s;
	const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - C / 2;

	let rgbPre: RGB;

	if (0 <= h && h < 60) {
		rgbPre = {
			r: C,
			g: X,
			b: 0
		};
	} else if (60 <= h && h < 120) {
		rgbPre = {
			r: X,
			g: C,
			b: 0
		};
	} else if (120 <= h && h < 180) {
		rgbPre = {
			r: 0,
			g: C,
			b: X
		};
	} else if (180 <= h && h < 240) {
		rgbPre = {
			r: 0,
			g: X,
			b: C
		};
	} else if (240 <= h && h < 300) {
		rgbPre = {
			r: X,
			g: 0,
			b: C
		};
	} else {
		rgbPre = {
			r: C,
			g: 0,
			b: X
		};
	}

	return {
		r: Math.round((rgbPre.r + m) * 255),
		g: Math.round((rgbPre.g + m) * 255),
		b: Math.round((rgbPre.b + m) * 255)
	};
}

function rgbToHsl(rgb: RGB): HSL {
	const rgbNormalized: RGB = {
		r: rgb.r / 255,
		g: rgb.g / 255,
		b: rgb.b / 255
	};

	const cMax = Math.max(...Object.values(rgbNormalized));
	const cMin = Math.min(...Object.values(rgbNormalized));

	const delta = cMax - cMin;

	const hue = computeHue(cMax, rgbNormalized, delta);
	const lightness = Math.trunc(((cMax + cMin) / 2) * 100) / 100;
	const saturation = computeSaturation(delta, lightness);

	return {
		h: hue,
		s: saturation,
		l: lightness
	};
}

function computeSaturation(delta: number, lightness: number): number {
	let s = 0;

	if (delta === 0) return s;

	s = delta / (1 - Math.abs(2 * lightness - 1));

	return Math.trunc(s * 100) / 100;
}

function computeHue(colorMax: number, rgbNormalized: RGB, delta: number): number {
	let h = 0;

	if (delta === 0) return h;

	switch (colorMax) {
		case rgbNormalized.r:
			h = 60 * (((rgbNormalized.g - rgbNormalized.b) / delta) % 6);
			break;
		case rgbNormalized.g:
			h = 60 * ((rgbNormalized.b - rgbNormalized.r) / delta + 2);
			break;
		case rgbNormalized.b:
			h = 60 * ((rgbNormalized.r - rgbNormalized.g) / delta + 4);
			break;
	}

	return Math.round(h);
}

export function hexStringToRgb(hex: string): RGB {
	let hexColor = hex.replace('#', '');

	if (hexColor.length === 3) {
		hexColor = hexColor
			.split('')
			.map((c) => c + c)
			.join('');
	}

	const bigint = parseInt(hexColor, 16);

	return {
		r: (bigint >> 16) & 255,
		g: (bigint >> 8) & 255,
		b: bigint & 255
	};
}
