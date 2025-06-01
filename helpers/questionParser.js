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
module.exports = { parseOptions, buildOptionsArray, formatCorrectAnswer };