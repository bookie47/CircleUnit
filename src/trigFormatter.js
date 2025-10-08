// formatTrigValue.js
const pi = "\u03C0";

export function formatTrigValue(value) {
  const known = [
    { val: 0, text: "0" },
    { val: 0.5, text: "1/2" },
    { val: Math.sqrt(3) / 2, text: "√3/2" },
    { val: 1 / Math.sqrt(2), text: "1/√2" },
    { val: Math.sqrt(2) / 2, text: "√2/2" },
    { val: 1, text: "1" },
  ];

  const rounded = parseFloat(value.toFixed(4));
  for (let item of known) {
    if (Math.abs(item.val - rounded) < 0.01) return item.text;
  }

  // ไม่ตรงกับค่าที่รู้จัก → แสดงทศนิยม
  return value.toFixed(2);
}
