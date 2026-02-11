/**
 * Polyfills for browser APIs required by pdfjs-dist in Node.js Lambda environment.
 *
 * pdf-parse v2 depends on pdfjs-dist v5, which expects browser APIs.
 * In Node.js, pdfjs-dist loads @napi-rs/canvas (native C++ module) to provide them.
 * Since esbuild cannot bundle native C++ binaries, we provide lightweight stubs
 * for the APIs that pdfjs-dist needs for text extraction.
 *
 * Note: These stubs support text extraction (getText).
 * For image/screenshot features, a real canvas implementation would be needed.
 */

if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = class DOMMatrix {
        constructor(init) {
            const m = Array.isArray(init) ? init : [];
            this.a = m[0] ?? 1; this.b = m[1] ?? 0;
            this.c = m[2] ?? 0; this.d = m[3] ?? 1;
            this.e = m[4] ?? 0; this.f = m[5] ?? 0;
            this.is2D = true;
        }
        inverse() { return new DOMMatrix(); }
        multiply() { return new DOMMatrix(); }
        translate() { return new DOMMatrix(); }
        scale() { return new DOMMatrix(); }
        transformPoint(p) { return p || { x: 0, y: 0, z: 0, w: 1 }; }
    };
}

if (typeof globalThis.ImageData === 'undefined') {
    globalThis.ImageData = class ImageData {
        constructor(sw, sh) {
            this.width = sw;
            this.height = sh;
            this.data = new Uint8ClampedArray(sw * sh * 4);
        }
    };
}

if (typeof globalThis.Path2D === 'undefined') {
    globalThis.Path2D = class Path2D {
        constructor() {}
    };
}
