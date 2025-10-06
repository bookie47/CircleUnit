// src/CircleUnit.jsx
import React, { useMemo, useState, useRef, useCallback } from "react";
import { FiSearch } from "react-icons/fi";
import "./CircleUnit.css";

export default function CircleUnit() {
  const [deg, setDeg] = useState(""); // เก็บค่าจากอินพุต (string) เพื่อควบคุม "0 นำหน้า" ฯลฯ
  const [dragging, setDragging] = useState(false);

  const [focus, setFocus] = useState("none");
  const EDGE = "#000"; // สีดำปกติของสามเหลี่ยม
  const HYP = "#2b2b2b"; // ไฮโปเทนิวส์เดิม
  const SIN_ACTIVE = "#e2536b"; // สีแดงเวลาเน้น sin
  const COS_ACTIVE = "#2b6df2"; // สีน้ำเงินเวลาเน้น cos

  const sinStroke = focus === "sin" ? SIN_ACTIVE : EDGE;
  const cosStroke = focus === "cos" ? COS_ACTIVE : EDGE;
  const smooth = { transition: "stroke 160ms ease, stroke-width 160ms ease" };


  // ---- sanitize / derive number ----
  const clamp = (n) => Math.max(-360, Math.min(360, n));
  const normalize = (v) => {
    if (v === "" || v === "-") return v; // ให้พิมพ์ระหว่างทางได้
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    return String(clamp(n));
  };

  const d = useMemo(() => {
    const n = Number(deg);
    return Number.isFinite(n) ? clamp(n) : 0;
  }, [deg]);

  // ใช้ d (ตัวเลข) ในการคำนวณทั้งหมด
  const rad = useMemo(() => (d * Math.PI) / 180, [d]);
  const s = useMemo(() => Math.sin(rad), [rad]);
  const c = useMemo(() => Math.cos(rad), [rad]);

  // ---- Canvas params (ทำ responsive ผ่าน CSS; viewBox = size) ----
  const size = 560; // พื้นที่คงที่ของ viewBox (พิกัดภายใน SVG)
  const r = 190; // รัศมีวงกลมหน่วย (ในพิกัด viewBox)
  const cx = size / 2;
  const cy = size / 2;

  const px = cx + r * c;
  const py = cy - r * s;

  const fmt = (x) => (Math.round(x * 100) / 100).toFixed(2);

  // มุมมาตรฐาน (0° ขวา, ทวนเข็มบวก) → มุมสำหรับ polar()/SVG ปัจจุบัน (0° บน, ตามเข็มบวก)
  const toSvg = (theta) => 90 - theta;

  // ---- helpers ----
  const polar = (R, deg) => {
    const t = ((deg - 90) * Math.PI) / 180; // 0° = ขึ้น, เดินตามเข็ม = บวก (polar style)
    return { x: cx + R * Math.cos(t), y: cy + R * Math.sin(t) };
  };
  const ticks30 = Array.from({ length: 12 }, (_, i) => i * 30);
  const ticks45 = [45, 135, 225, 315];

  const Tick = ({ d, len = 12, stroke = "#7aa7ff", width = 3 }) => {
    const p1 = polar(r + 2, d);
    const p2 = polar(r - len, d);
    return (
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  };

  const AngleLabel = ({ d, text }) => {
    const p = polar(r + 36, d);
    return (
      <g transform={`translate(${p.x},${p.y})`}>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          className="deg-label"
        >
          {text ?? `${d}°`}
        </text>
      </g>
    );
  };

  const QuadrantLabel = ({ d, text, R = r + 130 }) => {
    const p = polar(R, d); // ใช้มุมแบบ polar helper ของคุณ
    return (
      <text
        x={p.x}
        y={p.y}
        className="quad"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {text}
      </text>
    );
  };

  // ===== Drag the red point (รองรับ responsive ด้วยการแปลงพิกัดจอ -> viewBox) =====
  const svgRef = useRef(null);

  const getAngleFromPointer = useCallback(
    (e) => {
      const svg = svgRef.current;
      if (!svg) return d;
      const rect = svg.getBoundingClientRect();

      // สเกลจากพิกัดจอ -> viewBox
      const scaleX = size / rect.width;
      const scaleY = size / rect.height;

      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const dx = mx - cx;
      const dy = cy - my; // แกน y ของ SVG คว่ำ

      let ang = (Math.atan2(dy, dx) * 180) / Math.PI; // [-180, 180]
      if (ang < 0) ang += 360; // [0, 360)
      return Math.round(ang);
    },
    [cx, cy, size, d]
  );

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDeg(String(getAngleFromPointer(e)));
    // จับ pointer เพื่อไม่หลุดเมื่อเลื่อนออก
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    setDeg(String(getAngleFromPointer(e)));
  };
  const handlePointerUp = (e) => {
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      console.log(e);
    }
  };

  return (
    <div className="wrap">
      <div className="card">
        <div className="title">Magic Unit Circle</div>

        <div className="stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${size} ${size}`}
            width="100%"
            height="100%"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* defs */}
            <defs>
              <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d5fff3" />
                <stop offset="100%" stopColor="#a9e4db" />
              </linearGradient>
              <linearGradient id="sinFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffc9b9" />
                <stop offset="100%" stopColor="#ffb49b" />
              </linearGradient>
              <linearGradient id="cosFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d7f8c7" />
                <stop offset="100%" stopColor="#bff2a4" />
              </linearGradient>
            </defs>

            {/* outer ring & main circle */}
            <circle cx={cx} cy={cy} r={r + 34} fill="url(#ring)" />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="#fff"
              stroke="#254f91"
              strokeWidth={7}
            />

            {/* axes */}
            <line
              x1={cx - r - 18}
              y1={cy}
              x2={cx + r + 18}
              y2={cy}
              stroke="#254f91"
              strokeWidth={6}
              strokeLinecap="round"
            />
            <line
              x1={cx}
              y1={cy - r - 18}
              x2={cx}
              y2={cy + r + 18}
              stroke="#254f91"
              strokeWidth={6}
              strokeLinecap="round"
            />

            {/* quadrant tints */}
            <path
              d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${
                cx + r
              } ${cy} Z`}
              fill="#fff4d6"
              opacity=".7"
            />
            <path
              d={`M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${
                cy + r
              } Z`}
              fill="#f4e6ff"
              opacity=".6"
            />
            <path
              d={`M ${cx} ${cy} L ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${
                cx - r
              } ${cy} Z`}
              fill="#e7fbe2"
              opacity=".7"
            />
            <path
              d={`M ${cx} ${cy} L ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${
                cy - r
              } Z`}
              fill="#e9f5ff"
              opacity=".7"
            />
            {/* quadrant labels */}
            <QuadrantLabel d={toSvg(45)} text="Q1" />
            <QuadrantLabel d={toSvg(135)} text="Q2" />
            <QuadrantLabel d={toSvg(225)} text="Q3" />
            <QuadrantLabel d={toSvg(315)} text="Q4" />

            {/* ticks + labels */}
            {ticks30.map((d0) => (
              <Tick key={`t-${d0}`} d={toSvg(d0)} />
            ))}
            {ticks45.map((d0) => (
              <Tick
                key={`t45-${d0}`}
                d={toSvg(d0)}
                len={18}
                stroke="#b38bff"
                width={3.5}
              />
            ))}
            {ticks30.map((d0) => (
              <AngleLabel key={`a-${d0}`} d={toSvg(d0)} text={`${d0}°`} />
            ))}
            {ticks45.map((d0) => (
              <AngleLabel key={`a45-${d0}`} d={toSvg(d0)} text={`${d0}°`} />
            ))}

            {/* special points */}
            <text x={cx + r + 55} y={cy + 3} className="pt">
              (1,0)
            </text>
            <text x={cx - r - 85} y={cy + 3} className="pt">
              (-1,0)
            </text>
            <text x={cx - 14} y={cy - r - 55} className="pt">
              (0,1)
            </text>
            <text x={cx - 14} y={cy + r + 57} className="pt">
              (0,-1)
            </text>

            {/* ===== Right triangle + inner reference angle (always inside) ===== */}
            {(() => {
              // มุมฉากสี่เหลี่ยม (inset เพื่อไม่ทับเส้น)
              const box = 12;
              const pad = 2;
              const sx = -Math.sign(c || 1); // ทิศเข้าด้านในของแกน x
              const sy = -Math.sign(s || 1); // ทิศเข้าด้านในของแกน y
              const x0 = px + sx * pad;
              const y0 = cy + sy * pad;

              // ===== Inner angle arc (always inside triangle) =====
              const arcRadius = 28;
              const strokeW = 3; // ความหนาเส้นโค้ง
              const capMarginDeg = (strokeW / 2 / arcRadius) * (180 / Math.PI);
              // มุมเผื่อให้ปลายเส้นไม่ล้ำออก (คำนวณจากครึ่งความหนาเส้น)

              // 1) มุม polar: 0° = ขึ้น, เดินตามเข็มเป็นบวก
              const baseSvg = c >= 0 ? 90 : 270;
              const hypSvg = 90 - d;

              // 2) มุมสั้นสุด
              const shortest = (from, to) => {
                let delta = to - from;
                while (delta > 180) delta -= 360;
                while (delta < -180) delta += 360;
                return delta;
              };
              let delta = shortest(baseSvg, hypSvg);
              const sign = Math.sign(delta) || 1;

              // 3) กันชนจากขาทั้งสอง + เผื่อปลายเส้นตาม stroke
              let insetDeg = 2;
              if (Math.abs(delta) < insetDeg * 2) {
                insetDeg = Math.max(0.5, Math.abs(delta) / 2 - 0.1);
              }
              const totalInset = insetDeg + capMarginDeg;

              // 4) คำนวณโค้ง
              const startSvg = baseSvg + sign * totalInset;
              const sweepInset = delta - sign * 2 * totalInset;
              const endSvg = startSvg + sweepInset;
              // ทิศทางโค้งด้านใน
              const sweepCW = delta > 0;

              // mid-angle ของโค้ง
              const midSvg = startSvg + sweepInset / 2;

              // เวคเตอร์ทิศทางจากศูนย์กลาง
              const th = ((midSvg - 90) * Math.PI) / 180;
              const ux = Math.cos(th);
              const uy = Math.sin(th);

              // กรอบสี่เหลี่ยมมุมฉาก
              const xMin = Math.min(x0, x0 + sx * box);
              const xMax = Math.max(x0, x0 + sx * box);
              const yMin = Math.min(y0, y0 + sy * box);
              const yMax = Math.max(y0, y0 + sy * box);

              // ฟังก์ชันหา “ขอบแรก” ที่ ray ชน
              function rayFirstHitToAABB(
                cx,
                cy,
                ux,
                uy,
                xMin,
                yMin,
                xMax,
                yMax
              ) {
                const INF = 1e18;
                let tHit = INF;

                if (Math.abs(ux) > 1e-6) {
                  const t1 = (xMin - cx) / ux,
                    y1 = cy + t1 * uy;
                  if (t1 > 0 && y1 >= yMin && y1 <= yMax)
                    tHit = Math.min(tHit, t1);

                  const t2 = (xMax - cx) / ux,
                    y2 = cy + t2 * uy;
                  if (t2 > 0 && y2 >= yMin && y2 <= yMax)
                    tHit = Math.min(tHit, t2);
                }
                if (Math.abs(uy) > 1e-6) {
                  const t3 = (yMin - cy) / uy,
                    x3 = cx + t3 * ux;
                  if (t3 > 0 && x3 >= xMin && x3 <= xMax)
                    tHit = Math.min(tHit, t3);

                  const t4 = (yMax - cy) / uy,
                    x4 = cx + t4 * ux;
                  if (t4 > 0 && x4 >= xMin && x4 <= xMax)
                    tHit = Math.min(tHit, t4);
                }

                return tHit;
              }

              // ระยะชนจริง
              const tHit = rayFirstHitToAABB(
                cx,
                cy,
                ux,
                uy,
                xMin,
                yMin,
                xMax,
                yMax
              );

              // เงื่อนไขว่าชนขอบแรก ⇒ ไม่โชว์โค้ง
              const COLLISION_MARGIN = 6;
              const arcEdge = arcRadius + strokeW / 2;
              const collidesFirstEdge =
                tHit !== 1e18 && arcEdge >= tHit - COLLISION_MARGIN;

              // ความยาวโค้งขั้นต่ำเพื่อกันกรณีสั้นจิ๋ว
              const MIN_ARC_PX = 12;
              const sweepRad = (Math.abs(sweepInset) * Math.PI) / 180;
              const arcLen = arcRadius * sweepRad;

              // เผื่อครึ่งความหนาเส้น (ปลายเส้นจะไม่ถือว่าชนถ้ายังไม่โดนจริง)
              const ARC_PADDING = strokeW * 0.5;

              // สรุปว่าจะโชว์ไหม
              const showArc = !collidesFirstEdge && arcLen >= MIN_ARC_PX;

              return (
                <g>
                  {/* ฐาน = cos (ดำปกติ; น้ำเงินเมื่อ focus==='cos') */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={px}
                    y2={cy}
                    stroke={cosStroke}
                    strokeWidth={4}
                    style={smooth}
                  />

                  {/* ตั้ง = sin (ดำปกติ; แดงเมื่อ focus==='sin') */}
                  <line
                    x1={px}
                    y1={py}
                    x2={px}
                    y2={cy}
                    stroke={sinStroke}
                    strokeWidth={4}
                    strokeDasharray="6 6" // เก็บเป็นเส้นประเหมือนเดิม
                    style={smooth}
                  />

                  {/* ไฮโปเทนิวส์ คงเดิม */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={px}
                    y2={py}
                    stroke={HYP}
                    strokeWidth={4}
                  />

                  {/* มุมฉากเป็นสี่เหลี่ยมเล็ก */}
                  <rect
                    x={Math.min(x0, x0 + sx * box)}
                    y={Math.min(y0, y0 + sy * box)}
                    width={box}
                    height={box}
                    fill="none"
                    stroke="#000"
                    strokeWidth={3}
                  />

                  {showArc && (
                    <>
                      <path
                        d={describeArcSweep(
                          cx,
                          cy,
                          arcRadius,
                          startSvg,
                          endSvg,
                          sweepCW
                        )}
                        fill="none"
                        stroke="#ffcc33"
                        strokeWidth={strokeW}
                        strokeLinecap="butt" // <<< เปลี่ยนจาก round เป็น butt
                      />
                    </>
                  )}
                </g>
              );
            })()}

            {/* radius & moving point (เส้นหลัก + จุดแดงที่ลากได้) */}
            <line
              x1={cx}
              y1={cy}
              x2={px}
              y2={py}
              stroke="#2b2b2b"
              strokeWidth={4}
            />
            <circle
              cx={px}
              cy={py}
              r={11}
              fill="#ff5a5a"
              stroke="#fff"
              strokeWidth={5}
              style={{ cursor: "pointer" }}
              onPointerDown={handlePointerDown}
            />
          </svg>
        </div>

        {/* controls */}
        <div className="actions">
          <button
            className={`btn pink ${focus === "sin" ? "active" : ""}`}
            onClick={() => setFocus(focus === "sin" ? "none" : "sin")}
          >
            Find Sin
          </button>

          <button
            className={`btn blue ${focus === "cos" ? "active" : ""}`}
            onClick={() => setFocus(focus === "cos" ? "none" : "cos")}
          >
            Find Cos
          </button>

          <div className="input_Container">
            <label className="Angle">
              <FiSearch className="searchIcon" /> Angle :
            </label>
            <input
              className="inputAngle"
              type="number"
              value={deg}
              min={-360}
              max={360}
              onChange={(e) => setDeg(normalize(e.target.value))}
              onBlur={() => setDeg((prev) => normalize(prev))}
            />
            <span className="unit">°</span>
          </div>
        </div>

        <input
          className="range"
          type="range"
          min="-360"
          max="360"
          value={d}
          onChange={(e) => setDeg(String(clamp(Number(e.target.value))))}
        />

        <div className="readouts">
          <div className="pill violet">
            <p className="Header1">Angle</p>
            <p className="textInfo">{d}°</p>
          </div>
          <div className="pill orange">
            <p className="Header1">Sin(θ)</p>
            <p className="textInfo">{fmt(s)}</p>
          </div>
          <div className="pill green">
            <p className="Header1"> Cos(θ) </p>
            <p className="textInfo">{fmt(c)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== helpers (geometry) ===== */
function polarToCartesian(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180; // 0° = ขึ้น, เดินตามเข็ม = บวก
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArcSweep(cx, cy, r, startDeg, endDeg, sweepCW = true) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = sweepCW ? 1 : 0; // 1 = clockwise
  return ["M", start.x, start.y, "A", r, r, 0, large, sweep, end.x, end.y].join(
    " "
  );
}
