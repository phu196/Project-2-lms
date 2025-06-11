function parseOptions(optionText, correctAnswer) {
  const lines = optionText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
  

  return lines.map(line => {
    const value = line.replace(/^[A-D]\.\s*/, '').trim(); // loại "A. ", "B. "
    return {
      optionText: line,
      isCorrect: Array.isArray(correctAnswer)
        ? correctAnswer.includes(line) || correctAnswer.includes(value)
        : correctAnswer === line || correctAnswer === value
    };
  });
}


function buildOptionsArray(raw = '') {
  return raw
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(text => ({ text, isCorrect: false }));
}

/* cập nhật isCorrect dựa trên correctAnswers */
function formatCorrectAnswer(q, options) {
  const rawCorrect = (q.correctAnswers || q.correctAnswer || '').split(',').map(s => s.trim());
  rawCorrect.forEach(ans => {
    const idx = Number(ans);
    if (!Number.isNaN(idx) && options[idx]) options[idx].isCorrect = true;
  });
  return rawCorrect; // lưu mảng hoặc string tuỳ schema bạn định nghĩa
}
// Hàm chuẩn hóa lựa chọn để so sánh chính xác
function normalizeAnswerItem(item) {
    return String(item)
        .replace(/^[A-D]\.\s*/, '') // loại "A. ", "B. ", v.v.
        .trim()
        .toLowerCase();
}

// Hàm so sánh hai mảng đã chuẩn hóa
function isEqualArray(arr1, arr2) {
    const a1 = arr1.map(normalizeAnswerItem).sort();
    const a2 = arr2.map(normalizeAnswerItem).sort();
    return JSON.stringify(a1) === JSON.stringify(a2);
}
module.exports = { parseOptions, buildOptionsArray, formatCorrectAnswer , isEqualArray, normalizeAnswerItem };