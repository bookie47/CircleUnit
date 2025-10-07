// utils/trigFormatter.js
export function approxToExactTrig(val) {
  const table = [
    { num: 0, exact: "0" },
    { num: 0.5, exact: "1/2" },
    { num: Math.sqrt(2) / 2, exact: "√2/2" },
    { num: Math.sqrt(3) / 2, exact: "√3/2" },
    { num: 1, exact: "1" },
  ];

  // เทียบทั้งบวก/ลบ
  for (let { num, exact } of table) {
    if (Math.abs(val - num) < 0.01) return exact;
    if (Math.abs(val + num) < 0.01) return `-${exact}`;
  }

  // ถ้าไม่เจอ → คืนค่าเดิม (ปัดทศนิยม 2 หลัก)
  return val.toFixed(2);
}
