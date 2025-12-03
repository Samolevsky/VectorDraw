// Copyright 2018 Raph Levien
// Licensed under the Apache License, Version 2.0

//! A library of primitives for curves and splines.

class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	norm() {
		return Math.hypot(this.x, this.y);
	}

	dot(other) {
		return this.x * other.x + this.y * other.y;
	}

	cross(other) {
		return this.x * other.y - this.y * other.x;
	}
}

class CubicBez {
	constructor(coords) {
		this.c = coords;
	}

	weightsum(c0, c1, c2, c3) {
		let x = c0 * this.c[0] + c1 * this.c[2] + c2 * this.c[4] + c3 * this.c[6];
		let y = c0 * this.c[1] + c1 * this.c[3] + c2 * this.c[5] + c3 * this.c[7];
		return new Vec2(x, y);
	}

	eval(t) {
		let mt = 1 - t;
		let c0 = mt * mt * mt;
		let c1 = 3 * mt * mt * t;
		let c2 = 3 * mt * t * t;
		let c3 = t * t * t;
		return this.weightsum(c0, c1, c2, c3);
	}

	deriv(t) {
		let mt = 1 - t;
		let c0 = -3 * mt * mt;
		let c3 = 3 * t * t;
		let c1 = -6 * t * mt - c0;
		let c2 = 6 * t * mt - c3;
		return this.weightsum(c0, c1, c2, c3);
	}

	deriv2(t) {
		let mt = 1 - t;
		let c0 = 6 * mt;
		let c3 = 6 * t;
		let c1 = 6 - 18 * mt;
		let c2 = 6 - 18 * t;
		return this.weightsum(c0, c1, c2, c3);
	}

	curvature(t) {
		let d = this.deriv(t);
		let d2 = this.deriv2(t);
		return d.cross(d2) / Math.pow(d.norm(), 3);
	}

	atanCurvature(t) {
		let d = this.deriv(t);
		let d2 = this.deriv2(t);
		return Math.atan2(d.cross(d2), Math.pow(d.norm(), 3));
	}

	leftHalf() {
		let c = new Float64Array(8);
		c[0] = this.c[0];
		c[1] = this.c[1];
		c[2] = 0.5 * (this.c[0] + this.c[2]);
		c[3] = 0.5 * (this.c[1] + this.c[3]);
		c[4] = 0.25 * (this.c[0] + 2 * this.c[2] + this.c[4]);
		c[5] = 0.25 * (this.c[1] + 2 * this.c[3] + this.c[5]);
		c[6] = 0.125 * (this.c[0] + 3 * (this.c[2] + this.c[4]) + this.c[6]);
		c[7] = 0.125 * (this.c[1] + 3 * (this.c[3] + this.c[5]) + this.c[7]);
		return new CubicBez(c);
	}

	rightHalf() {
		let c = new Float64Array(8);
		c[0] = 0.125 * (this.c[0] + 3 * (this.c[2] + this.c[4]) + this.c[6]);
		c[1] = 0.125 * (this.c[1] + 3 * (this.c[3] + this.c[5]) + this.c[7]);
		c[2] = 0.25 * (this.c[2] + 2 * this.c[4] + this.c[6]);
		c[3] = 0.25 * (this.c[3] + 2 * this.c[5] + this.c[7]);
		c[4] = 0.5 * (this.c[4] + this.c[6]);
		c[5] = 0.5 * (this.c[5] + this.c[7]);
		c[6] = this.c[6];
		c[7] = this.c[7];
		return new CubicBez(c);
	}
}

class Polynomial {
	constructor(c) {
		this.c = c;
	}

	eval(x) {
		let xi = 1;
		let s = 0;
		for (let a of this.c) {
			s += a * xi;
			xi *= x;
		}
		return s;
	}

	deriv() {
		let c = new Float64Array(this.c.length - 1);
		for (let i = 0; i < c.length; i++) {
			c[i] = (i + 1) * this.c[i + 1];
		}
		return new Polynomial(c);
	}
}

function hermite5(x0, x1, v0, v1, a0, a1) {
	return new Polynomial([x0,
		v0,
		0.5 * a0,
		-10 * x0 + 10 * x1 - 6 * v0 - 4 * v1 - 1.5 * a0 + 0.5 * a1,
		15 * x0 - 15 * x1 + 8 * v0 + 7 * v1 + 1.5 * a0 - a1,
		-6 * x0 + 6 * x1 - 3 * v0 - 3 * v1 + -.5 * a0 + 0.5 * a1]);
}

function tridiag(a, b, c, d, x) {
	let n = x.length;
	for (var i = 1; i < n; i++) {
		let m = a[i] / b[i - 1];
		b[i] -= m * c[i - 1];
		d[i] -= m * d[i - 1];
	}
	x[n - 1] = d[n - 1] / b[n - 1];
	for (var i = n - 2; i >= 0; i--) {
		x[i] = (d[i] - c[i] * x[i + 1]) / b[i];
	}
}

function myCubic(th0, th1) {
	function myCubicLen(th0, th1) {
		let offset = 0.3 * Math.sin(th1 * 2 - 0.4 * Math.sin(th1 * 2));
		let scale = 1.0 / (3 * 0.8);
		let len = scale * (Math.cos(th0 - offset) - 0.2 * Math.cos((3 * (th0 - offset))));
		return len;
	}

	var coords = new Float64Array(8);
	let len0 = myCubicLen(th0, th1);
	coords[2] = Math.cos(th0) * len0;
	coords[3] = Math.sin(th0) * len0;

	let len1 = myCubicLen(th1, th0);
	coords[4] = 1 - Math.cos(th1) * len1;
	coords[5] = Math.sin(th1) * len1;
	coords[6] = 1;
	return coords;
}

class TwoParamCurve {
	computeCurvatureDerivs(th0, th1) {
		let epsilon = 1e-6;
		let scale = 2.0 / epsilon;
		let k0plus = this.computeCurvature(th0 + epsilon, th1);
		let k0minus = this.computeCurvature(th0 - epsilon, th1);
		let dak0dth0 = scale * (k0plus.ak0 - k0minus.ak0);
		let dak1dth0 = scale * (k0plus.ak1 - k0minus.ak1);
		let k1plus = this.computeCurvature(th0, th1 + epsilon);
		let k1minus = this.computeCurvature(th0, th1 - epsilon);
		let dak0dth1 = scale * (k1plus.ak0 - k1minus.ak0);
		let dak1dth1 = scale * (k1plus.ak1 - k1minus.ak1);
		return {dak0dth0: dak0dth0, dak1dth0: dak1dth0, dak0dth1: dak0dth1, dak1dth1: dak1dth1};
	}
}

class MyCurve extends TwoParamCurve {
	render(th0, th1) {
		let c = myCubic(th0, th1);
		return [new Vec2(c[2], c[3]), new Vec2(c[4], c[5])];
	}

	render4Quintic(th0, th1, k0, k1) {
		let cb = this.convCubic(this.render4Cubic(th0, th1, k0, k1));
		function curvAdjust(t, th, k) {
			if (k === null) return new Vec2(0, 0);
			let c = Math.cos(th);
			let s = Math.sin(th);
			let d2 = cb.deriv2(t);
			let d2cross = d2.y * c - d2.x * s;
			let d = cb.deriv(t);
			let ddot = d.x * c + d.y * s;
			let oldK = d2cross / (ddot * ddot);
			let kAdjust = k - oldK;
			let aAdjust = kAdjust * (ddot * ddot);
			return new Vec2(-s * aAdjust, c * aAdjust);
		}
		let a0 = curvAdjust(0, th0, k0);
		let a1 = curvAdjust(1, -th1, k1);
		let hx = hermite5(0, 0, 0, 0, a0.x, a1.x);
		let hy = hermite5(0, 0, 0, 0, a0.y, a1.y);
		let hxd = hx.deriv();
		let hyd = hy.deriv();
		let c0 = cb.leftHalf();
		let c1 = cb.rightHalf();
		let cs = [c0.leftHalf(), c0.rightHalf(), c1.leftHalf(), c1.rightHalf()];
		let result = [];
		let scale = 1./12;
		for (let i = 0; i < 4; i++) {
			let t = 0.25 * i;
			let t1 = t + 0.25;
			let c = cs[i].c;
			let x0 = hx.eval(t);
			let y0 = hy.eval(t);
			let x1 = x0 + scale * hxd.eval(t);
			let y1 = y0 + scale * hyd.eval(t);
			let x3 = hx.eval(t1);
			let y3 = hy.eval(t1);
			let x2 = x3 - scale * hxd.eval(t1);
			let y2 = y3 - scale * hyd.eval(t1);
			if (i != 0) {
				result.push(new Vec2(c[0] + x0, c[1] + y0));
			}
			result.push(new Vec2(c[2] + x1, c[3] + y1));
			result.push(new Vec2(c[4] + x2, c[5] + y2));
		}
		return result;
	}

	convCubic(pts) {
		let coords = new Float64Array(8);
		coords[2] = pts[0].x;
		coords[3] = pts[0].y;
		coords[4] = pts[1].x;
		coords[5] = pts[1].y;
		coords[6] = 1;
		return new CubicBez(coords);
	}

	render4Cubic(th0, th1, k0, k1) {
		let cb = new CubicBez(myCubic(th0, th1));
		let result = [];
		function deriv_scale(t, th, k) {
			if (k === null) return 1/3;
			let c = Math.cos(th);
			let s = Math.sin(th);
			let d = cb.deriv(t);
			let d2 = cb.deriv2(t);
			let d2cross = d2.y * c - d2.x * s;
			let ddot = d.x * c + d.y * s;
			let oldK = d2cross / (ddot * ddot);
			if (Math.abs(oldK) < 1e-6) oldK = 1e-6;
			let ratio = k / oldK;
			let scale = 1/(2 + ratio);
			return scale;
		}
		let scale0 = deriv_scale(0, th0, k0);
		let d0 = cb.deriv(0);
		result.push(new Vec2(d0.x * scale0, d0.y * scale0));
		let d1 = cb.deriv(1);
		let scale1 = deriv_scale(1, -th1, k1);
		result.push(new Vec2(1 - d1.x * scale1, - d1.y * scale1));
		return result;
	}

	render4(th0, th1, k0, k1) {
		if (k0 === null && k1 === null) {
			return this.render(th0, th1);
		}
		return this.render4Quintic(th0, th1, k0, k1);
	}

	computeCurvature(th0, th1) {
		let cb = new CubicBez(myCubic(th0, th1));
		function curv(t, th) {
			let c = Math.cos(th);
			let s = Math.sin(th);
			let d2 = cb.deriv2(t);
			let d2cross = d2.y * c - d2.x * s;
			let d = cb.deriv(t);
			let ddot = d.x * c + d.y * s;
			return Math.atan2(d2cross, ddot * Math.abs(ddot));
		}
		let ak0 = curv(0, th0);
		let ak1 = curv(1, -th1);
		return {ak0: ak0, ak1: ak1};
	}

	endpointTangent(th) {
		return 0.5 * Math.sin(2 * th);
	}
}

function mod2pi(th) {
	let twopi = 2 * Math.PI;
	let frac = th * (1 / twopi);
	return twopi * (frac - Math.round(frac)); 
}

class TwoParamSpline {
	constructor(curve, ctrlPts) {
		this.curve = curve;
		this.ctrlPts = ctrlPts;
		this.startTh = null;
		this.endTh = null;
	}

	initialThs() {
		var ths = new Float64Array(this.ctrlPts.length);
		for (var i = 1; i < ths.length - 1; i++) {
			let dx0 = this.ctrlPts[i].x - this.ctrlPts[i - 1].x;
			let dy0 = this.ctrlPts[i].y - this.ctrlPts[i - 1].y;
			let l0 = Math.hypot(dx0, dy0);
			let dx1 = this.ctrlPts[i + 1].x - this.ctrlPts[i].x;
			let dy1 = this.ctrlPts[i + 1].y - this.ctrlPts[i].y;
			let l1 = Math.hypot(dx1, dy1);
			let th0 = Math.atan2(dy0, dx0);
			let th1 = Math.atan2(dy1, dx1);
			let bend = mod2pi(th1 - th0);
			let th = mod2pi(th0 + bend * l0 / (l0 + l1));
			ths[i] = th;
			if (i == 1) { ths[0] = th0; }
			if (i == ths.length - 2) { ths[i + 1] = th1; }
		}
		if (this.startTh !== null) {
			ths[0] = this.startTh;
		}
		if (this.endTh !== null) {
			ths[ths.length - 1] = this.endTh;
		}
		this.ths = ths;
		return ths;
	}

	getThs(i) {
		let dx = this.ctrlPts[i + 1].x - this.ctrlPts[i].x;
		let dy = this.ctrlPts[i + 1].y - this.ctrlPts[i].y;
		let th =  Math.atan2(dy, dx);
		let th0 = mod2pi(this.ths[i] - th);
		let th1 = mod2pi(th - this.ths[i + 1]);
		let chord = Math.hypot(dx, dy);
		return {th0: th0, th1: th1, chord: chord};
	}

	iterDumb(iter) {
		function computeErr(ths0, ak0, ths1, ak1) {
			let ch0 = Math.sqrt(ths0.chord);
			let ch1 = Math.sqrt(ths1.chord);
			let a0 = Math.atan2(Math.sin(ak0.ak1) * ch1, Math.cos(ak0.ak1) * ch0);
			let a1 = Math.atan2(Math.sin(ak1.ak0) * ch0, Math.cos(ak1.ak0) * ch1);
			return a0 - a1;
		}

		let n = this.ctrlPts.length;
		if (this.startTh === null) {
			let ths0 = this.getThs(0);
			this.ths[0] += this.curve.endpointTangent(ths0.th1) - ths0.th0;
		}

		if (this.endTh === null) {
			let ths0 = this.getThs(n - 2);
			this.ths[n - 1] -= this.curve.endpointTangent(ths0.th0) - ths0.th1;
		}
		if (n < 3) return 0;

		var absErr = 0;
		var x = new Float64Array(n - 2);
		var ths0 = this.getThs(0);
		var ak0 = this.curve.computeCurvature(ths0.th0, ths0.th1);
		for (var i = 0; i < n - 2; i++) {
			let ths1 = this.getThs(i + 1);
			let ak1 = this.curve.computeCurvature(ths1.th0, ths1.th1);
			let err = computeErr(ths0, ak0, ths1, ak1);
			absErr += Math.abs(err);

			let epsilon = 1e-3;
			let ak0p = this.curve.computeCurvature(ths0.th0, ths0.th1 + epsilon);
			let ak1p = this.curve.computeCurvature(ths1.th0 - epsilon, ths1.th1);
			let errp = computeErr(ths0, ak0p, ths1, ak1p);
			let derr = (errp - err) * (1 / epsilon);
			x[i] = err / derr;

			ths0 = ths1;
			ak0 = ak1;
		}

		for (var i = 0; i < n - 2; i++) {
			let scale = Math.tanh(0.25 * (iter + 1));
			this.ths[i + 1] += scale * x[i];
		}

		return absErr;
	}

	renderSvg() {
		let c = this.ctrlPts;
		if (c.length == 0) { return ""; }
		let path = `M${c[0].x} ${c[0].y}`;
		let cmd = " C";
		for (var i = 0; i < c.length - 1; i++) {
			let ths = this.getThs(i);
			let render = this.curve.render(ths.th0, ths.th1);
			let dx = c[i + 1].x - c[i].x;
			let dy = c[i + 1].y - c[i].y;
			for (var j = 0; j < render.length; j++) {
				let pt = render[j];
				let x = c[i].x + dx * pt.x - dy * pt.y;
				let y = c[i].y + dy * pt.x + dx * pt.y;
				path += `${cmd}${x} ${y}`;
				cmd = " ";
			}
			path += ` ${c[i + 1].x} ${c[i + 1].y}`;
		}
		return path;
	}
}

class Spline {
	constructor(ctrlPts, isClosed) {
		this.ctrlPts = ctrlPts;
		this.isClosed = isClosed;
		this.curve = new MyCurve();
	}

	pt(i, start) {
		let length = this.ctrlPts.length;
		return this.ctrlPts[(i + start + length) % length];
	}

	startIx() {
		if (!this.isClosed) {
			return 0;
		}
		for (let i = 0; i < this.ctrlPts.length; i++) {
			let pt = this.ctrlPts[i];
			if (pt.ty === "corner" || pt.lth !== null) {
				return i;
			}
		}
		return 0;
	}

	solve() {
		let start = this.startIx();
		let length = this.ctrlPts.length - (this.isClosed ? 0 : 1);
		
		// Special handling for closed paths with all smooth points
		if (this.isClosed && start === 0) {
			// Check if all points are smooth
			let allSmooth = true;
			for (let pt of this.ctrlPts) {
				if (pt.ty === "corner" || pt.lth !== null) {
					allSmooth = false;
					break;
				}
			}
			
			if (allSmooth) {
				// Solve closed smooth curve with special iteration
				this.solveClosedSmooth();
				return;
			}
		}
		
		let i = 0;
		while (i < length) {
			let ptI = this.pt(i, start);
			let ptI1 = this.pt(i + 1, start);
			if ((i + 1 == length || ptI1.ty === "corner")
				&& ptI.rth === null && ptI1.lth === null) {
				let dx = ptI1.pt.x - ptI.pt.x;
				let dy = ptI1.pt.y - ptI.pt.y;
				let th = Math.atan2(dy, dx);
				ptI.rTh = th;
				ptI1.lTh = th;
				i += 1;
			} else {
				let innerPts = [ptI.pt];
				let j = i + 1;
				while (j < length + 1) {
					let ptJ = this.pt(j, start);
					innerPts.push(ptJ.pt);
					j += 1;
					if (ptJ.ty === "corner" || ptJ.lth !== null) {
						break;
					}
				}
				let inner = new TwoParamSpline(this.curve, innerPts);
				inner.startTh = this.pt(i, start).rth;
				inner.endTh = this.pt(j - 1, start).lth;
				let nIter = 10;
				inner.initialThs();
				for (let k = 0; k < nIter; k++) {
					inner.iterDumb(k);
				}
				for (let k = i; k + 1 < j; k++) {
					this.pt(k, start).rTh = inner.ths[k - i];
					this.pt(k + 1, start).lTh = inner.ths[k + 1 - i];
					let ths = inner.getThs(k - i);
					let aks = this.curve.computeCurvature(ths.th0, ths.th1);
					this.pt(k, start).rAk = aks.ak0;
					this.pt(k + 1, start).lAk = aks.ak1;
				}
				i = j - 1;
			}
		}
	}

	solveClosedSmooth() {
		let n = this.ctrlPts.length;
		if (n < 3) return;
		
		// Initialize tangent angles for all points
		let ths = new Float64Array(n);
		for (let i = 0; i < n; i++) {
			let prev = (i - 1 + n) % n;
			let next = (i + 1) % n;
			
			let dx0 = this.ctrlPts[i].pt.x - this.ctrlPts[prev].pt.x;
			let dy0 = this.ctrlPts[i].pt.y - this.ctrlPts[prev].pt.y;
			let l0 = Math.hypot(dx0, dy0);
			
			let dx1 = this.ctrlPts[next].pt.x - this.ctrlPts[i].pt.x;
			let dy1 = this.ctrlPts[next].pt.y - this.ctrlPts[i].pt.y;
			let l1 = Math.hypot(dx1, dy1);
			
			let th0 = Math.atan2(dy0, dx0);
			let th1 = Math.atan2(dy1, dx1);
			let bend = mod2pi(th1 - th0);
			ths[i] = mod2pi(th0 + bend * l0 / (l0 + l1));
		}
		
		// Iterate to achieve curvature continuity
		let nIter = 10;
		for (let iter = 0; iter < nIter; iter++) {
			let x = new Float64Array(n);
			
			for (let i = 0; i < n; i++) {
				let next = (i + 1) % n;
				
				// Get chord vector and length
				let dx = this.ctrlPts[next].pt.x - this.ctrlPts[i].pt.x;
				let dy = this.ctrlPts[next].pt.y - this.ctrlPts[i].pt.y;
				let chord = Math.hypot(dx, dy);
				let chth = Math.atan2(dy, dx);
				
				// Compute relative tangent angles
				let th0 = mod2pi(ths[i] - chth);
				let th1 = mod2pi(chth - ths[next]);
				
				// Compute curvatures
				let ak = this.curve.computeCurvature(th0, th1);
				
				// Get next segment for continuity constraint
				let nextnext = (next + 1) % n;
				let dx2 = this.ctrlPts[nextnext].pt.x - this.ctrlPts[next].pt.x;
				let dy2 = this.ctrlPts[nextnext].pt.y - this.ctrlPts[next].pt.y;
				let chord2 = Math.hypot(dx2, dy2);
				let chth2 = Math.atan2(dy2, dx2);
				
				let th0_2 = mod2pi(ths[next] - chth2);
				let th1_2 = mod2pi(chth2 - ths[nextnext]);
				let ak2 = this.curve.computeCurvature(th0_2, th1_2);
				
				// Compute curvature continuity error
				let ch0 = Math.sqrt(chord);
				let ch1 = Math.sqrt(chord2);
				let a0 = Math.atan2(Math.sin(ak.ak1) * ch1, Math.cos(ak.ak1) * ch0);
				let a1 = Math.atan2(Math.sin(ak2.ak0) * ch0, Math.cos(ak2.ak0) * ch1);
				let err = a0 - a1;
				
				// Compute derivative for Newton step
				let epsilon = 1e-3;
				let ak_p = this.curve.computeCurvature(th0, th1 + epsilon);
				let ak2_p = this.curve.computeCurvature(th0_2 - epsilon, th1_2);
				let a0_p = Math.atan2(Math.sin(ak_p.ak1) * ch1, Math.cos(ak_p.ak1) * ch0);
				let a1_p = Math.atan2(Math.sin(ak2_p.ak0) * ch0, Math.cos(ak2_p.ak0) * ch1);
				let err_p = a0_p - a1_p;
				let derr = (err_p - err) / epsilon;
				
				if (Math.abs(derr) > 1e-9) {
					x[next] = err / derr;
				}
			}
			
			// Apply updates
			let scale = Math.tanh(0.25 * (iter + 1));
			for (let i = 0; i < n; i++) {
				ths[i] += scale * x[i];
			}
		}
		
		// Apply solved tangents to all points equally
		for (let i = 0; i < n; i++) {
			this.ctrlPts[i].lTh = ths[i];
			this.ctrlPts[i].rTh = ths[i];
			
			// Compute curvatures for the next step
			let next = (i + 1) % n;
			let dx = this.ctrlPts[next].pt.x - this.ctrlPts[i].pt.x;
			let dy = this.ctrlPts[next].pt.y - this.ctrlPts[i].pt.y;
			let chord = Math.hypot(dx, dy);
			let chth = Math.atan2(dy, dx);
			let th0 = mod2pi(ths[i] - chth);
			let th1 = mod2pi(chth - ths[next]);
			let aks = this.curve.computeCurvature(th0, th1);
			this.ctrlPts[i].rAk = aks.ak0;
			this.ctrlPts[next].lAk = aks.ak1;
		}
	}

	chordLen(i) {
		let ptI = this.pt(i, 0).pt;
		let ptI1 = this.pt(i + 1, 0).pt;
		return Math.hypot(ptI1.x - ptI.x, ptI1.y - ptI.y);
	}

	computeCurvatureBlending() {
		function myTan(th) {
			if (th > Math.PI / 2) {
				return Math.tan(Math.PI - th);
			} else if (th < -Math.PI / 2) {
				return Math.tan(-Math.PI - th);
			} else {
				return Math.tan(th);
			}
		}
		for (let pt of this.ctrlPts) {
			pt.kBlend = null;
		}
		let length = this.ctrlPts.length - (this.isClosed ? 0 : 1);
		for (let i = 0; i < length; i++) {
			let pt = this.pt(i, 0);
			if (pt.ty === "smooth" && pt.lth !== null) {
				if (Math.sign(pt.rAk) != Math.sign(pt.lAk)) {
					pt.kBlend = 0;
				} else {
					let rK = myTan(pt.rAk) / this.chordLen(i - 1);
					let lK = myTan(pt.lAk) / this.chordLen(i);
					pt.kBlend = 2 / (1 / rK + 1 / lK);
				}
			}
		}
	}

	render() {
		let path = new BezPath;
		if (this.ctrlPts.length == 0) {
			return path;
		}
		let pt0 = this.ctrlPts[0];
		path.moveto(pt0.pt.x, pt0.pt.y);
		let length = this.ctrlPts.length - (this.isClosed ? 0 : 1);
		let i = 0;
		for (let i = 0; i < length; i++) {
			path.mark(i);
			let ptI = this.pt(i, 0);
			let ptI1 = this.pt(i + 1, 0);
			let dx = ptI1.pt.x - ptI.pt.x;
			let dy = ptI1.pt.y - ptI.pt.y;
			let chth = Math.atan2(dy, dx);
			let chord = Math.hypot(dy, dx);
			let th0 = mod2pi(ptI.rTh - chth);
			let th1 = mod2pi(chth - ptI1.lTh);
			let k0 = ptI.kBlend !== null ? ptI.kBlend * chord : null;
			let k1 = ptI1.kBlend !== null ? ptI1.kBlend * chord : null;
			let render = this.curve.render4(th0, th1, k0, k1);
			let c = [];
			for (let j = 0; j < render.length; j++) {
				let pt = render[j];
				c.push(ptI.pt.x + dx * pt.x - dy * pt.y);
				c.push(ptI.pt.y + dy * pt.x + dx * pt.y);
			}
			c.push(ptI1.pt.x);
			c.push(ptI1.pt.y);
			for (let j = 0; j < c.length; j += 6) {
				path.curveto(c[j], c[j + 1], c[j + 2], c[j + 3], c[j + 4], c[j + 5]);
			}
		}
		if (this.isClosed) {
			path.closepath();
		}
		return path;
	}

	renderSvg() {
		return this.render().renderSvg();
	}
}

class ControlPoint {
	constructor(pt, ty, lth, rth) {
		this.pt = pt;
		this.ty = ty;
		this.lth = lth;
		this.rth = rth;
	}
}
