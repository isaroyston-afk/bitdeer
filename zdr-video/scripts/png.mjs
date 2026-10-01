// Minimal PNG decoder (8-bit RGB/RGBA, non-interlaced) for the tracing scripts.
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

export const readPng = (path) => {
	const buf = readFileSync(path);
	let off = 8, width = 0, height = 0, colorType = 0, depth = 0;
	const idat = [];
	while (off < buf.length) {
		const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
		if (type === 'IHDR') {width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; colorType = data[9]; if (data[12]) throw new Error('interlaced PNG');}
		if (type === 'IDAT') idat.push(data);
		off += 12 + len;
	}
	if (depth !== 8 || (colorType !== 6 && colorType !== 2)) throw new Error(`unsupported PNG: depth ${depth} type ${colorType}`);
	const bpp = colorType === 6 ? 4 : 3, stride = width * bpp;
	const raw = inflateSync(Buffer.concat(idat));
	const out = Buffer.alloc(width * height * 4);
	let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
	for (let y = 0; y < height; y++) {
		const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
		for (let x = 0; x < stride; x++) {
			const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
			let v = line[x];
			if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
			else if (f === 4) {const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;}
			cur[x] = v & 255;
		}
		for (let x = 0; x < width; x++) {
			const o = (y * width + x) * 4;
			out[o] = cur[x * bpp]; out[o + 1] = cur[x * bpp + 1]; out[o + 2] = cur[x * bpp + 2]; out[o + 3] = bpp === 4 ? cur[x * bpp + 3] : 255;
		}
		[prev, cur] = [cur, prev];
	}
	return {width, height, data: out};
};

/** Writes an 8-bit RGBA PNG (used for debugging masks). */
export const writePng = async (path, width, height, rgba) => {
	const {deflateSync} = await import('node:zlib');
	const {writeFileSync} = await import('node:fs');
	const crcTable = Array.from({length: 256}, (_, n) => {let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;});
	const crc = (buf) => {let c = 0xFFFFFFFF; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0;};
	const chunk = (type, data) => {const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]);};
	const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
	const raw = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 0; y < height; y++) rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
	writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
};
