function renderOptionPreview(textarea) {
  const index = textarea.dataset.index;
  const container = document.getElementById(`option-preview-${index}`);
  const lines = textarea.value.split('\n').filter(line => line.trim() !== '');
  const questionBlock = textarea.closest('.question-block');
  const selectType = questionBlock.querySelector(`select[name="questions[${index}][type]"]`);
  const type = selectType.value;

  container.innerHTML = '';

  if (!['single_choice', 'multiple_choice'].includes(type)) {
    return; // Không cần hiển thị options với câu hỏi tự luận, nộp file...
  }

  lines.forEach((line, i) => {
    const optId = `q${index}_opt${i}`;

    // Input: đáp án đúng
    const input = document.createElement('input');
    input.className = 'form-check-input';
    input.type = (type === 'multiple_choice') ? 'checkbox' : 'radio';
    input.name = `questions[${index}][correctAnswer]${type === 'multiple_choice' ? '[]' : ''}`;
    input.id = optId;
    input.value = line.trim();

    // Label: nội dung đáp án
    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.setAttribute('for', optId);
    label.innerText = line;

    // Gộp lại
    const wrapper = document.createElement('div');
    wrapper.className = 'form-check my-1';
    wrapper.appendChild(input);
    wrapper.appendChild(label);

    container.appendChild(wrapper);
  });
}

function toggleOptions(select) {
  const questionBlock = select.closest('.question-block');
  const index = questionBlock.dataset.index;
  const textarea = questionBlock.querySelector(`textarea[name="questions[${index}][options]"]`);
  renderOptionPreview(textarea);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.option-input').forEach(textarea => {
    renderOptionPreview(textarea);

    // Bắt sự kiện nhập để cập nhật preview ngay
    textarea.addEventListener('input', () => renderOptionPreview(textarea));
  });

  document.querySelectorAll('.question-type-select').forEach(select => {
    select.addEventListener('change', () => toggleOptions(select));
  });
});

window.addQuestion = function() {
  const container = document.getElementById('questions-container');
  const index = typeof window.questionIndex === 'number' ? window.questionIndex : document.querySelectorAll('.question-block').length;
  const html = `
    <div class="question-block p-3 mb-4 border rounded bg-light" data-index="${index}">
      <div class="mb-2">
        <label class="form-label">Loại câu hỏi</label>
        <select class="form-select" name="questions[${index}][type]" onchange="toggleOptions(this)">
          <option value="single_choice">Trắc nghiệm 1 đáp án</option>
          <option value="multiple_choice">Trắc nghiệm nhiều đáp án</option>
          <option value="fill_in_blank">Điền đáp án</option>
        </select>
      </div>
      <div class="mb-2">
        <label class="form-label">Nội dung câu hỏi</label>
        <input class="form-control" type="text" name="questions[${index}][content]" required>
      </div>
      <div class="mb-2">
        <label class="form-label">Tuỳ chọn đáp án (mỗi dòng là 1 đáp án)</label>
        <textarea class="form-control option-input" name="questions[${index}][options]" rows="4" placeholder="A. Đáp án 1\nB. Đáp án 2" data-index="${index}" oninput="renderOptionPreview(this)"></textarea>
      </div>
      <div class="mb-2 preview-options" id="option-preview-${index}"></div>
      <div class="mb-2">
        <label class="form-label">Đáp án đúng (nếu nhiều đáp án, cách nhau bởi dấu phẩy)</label>
        <input class="form-control" type="text" name="questions[${index}][correctAnswer]">
      </div>
      <button class="btn btn-outline-danger btn-sm mt-2" type="button" onclick="removeQuestion(this)">Xóa câu hỏi</button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
  window.questionIndex = index + 1;
};

window.removeQuestion = function(btn) {
  btn.closest('.question-block').remove();
};
function addImageInput(btn, index) {
    var container = document.getElementById('images-list-' + index);
    var inputIdx = container.querySelectorAll('.image-input-block').length;
    var div = document.createElement('div');
    div.className = 'image-input-block mb-2 d-flex align-items-center';
    div.innerHTML = `
      <input type="file" name="questions[${index}][images]" accept="image/*" class="form-control me-2" style="max-width:220px;">
      <button type="button" class="btn btn-danger btn-sm" onclick="this.parentNode.remove()">Xóa</button>
    `;
    container.appendChild(div);
  }

  // Khởi tạo sẵn 1 input ảnh cho câu hỏi đầu tiên (nếu muốn)
  document.addEventListener('DOMContentLoaded', function() {
    addImageInput(null, 0);
  });