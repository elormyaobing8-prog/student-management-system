'use strict';

/* =====================================================================
   Academic Performance & Grade Management System

   THE MAIN ARRAY
   `students` holds every student record. Each item is one object:
     { id, name, marks: [assignment, midsem, exam], total, grade }
   `marks` is a small array inside each record (3 items).
   Every feature below works by looping over, searching or changing
   these arrays.
   ===================================================================== */

const STORAGE_KEY = 'academic-performance-system.students.v1';
const MARK_NAMES = ['assignment', 'midsem', 'exam'];   // position in the marks array
const MARK_LIMITS = [20, 30, 50];                       // maximum for each position
const GRADES = ['A', 'B', 'C', 'D', 'F'];               // position in the distribution array

let students = [];        // the main array
let editingId = null;     // ID of the student being edited, or null when adding

const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------------------
   Calculations
   --------------------------------------------------------------------- */

/** Add up the marks array with a loop. */
function calculateTotal(marks) {
  let total = 0;
  for (let i = 0; i < marks.length; i++) {
    total += marks[i];
  }
  return Math.round(total * 10) / 10;   // keep one decimal place
}

function calculateGrade(total) {
  if (total >= 80) return 'A';
  if (total >= 70) return 'B';
  if (total >= 60) return 'C';
  if (total >= 50) return 'D';
  return 'F';
}

/* ---------------------------------------------------------------------
   Array operations
   --------------------------------------------------------------------- */

/** LINEAR SEARCH: check each item from the start until the ID matches. Returns the index or -1. */
function findStudentIndex(id) {
  const wanted = id.trim().toLowerCase();
  for (let i = 0; i < students.length; i++) {
    if (students[i].id.toLowerCase() === wanted) return i;
  }
  return -1;
}

/** SEARCH BOX: loop through the array and keep students whose ID or name contains the text. */
function searchStudents(list, text) {
  const term = text.trim().toLowerCase();
  if (term === '') return list.slice();
  const matches = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].id.toLowerCase().includes(term) || list[i].name.toLowerCase().includes(term)) {
      matches.push(list[i]);
    }
  }
  return matches;
}

/** SORT: sort a copy so the original order (order added) is kept. */
function sortStudents(list, sortBy) {
  const copy = list.slice();
  if (sortBy === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === 'id') copy.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  else if (sortBy === 'total-desc') copy.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  else if (sortBy === 'total-asc') copy.sort((a, b) => a.total - b.total || a.name.localeCompare(b.name));
  return copy;
}

/** STATISTICS: one pass through the array finds the sum, the highest and the lowest. */
function getStatistics(list) {
  if (list.length === 0) return null;
  let sum = 0;
  let highest = list[0];
  let lowest = list[0];
  for (let i = 0; i < list.length; i++) {
    sum += list[i].total;
    if (list[i].total > highest.total) highest = list[i];
    if (list[i].total < lowest.total) lowest = list[i];
  }
  return { average: sum / list.length, highest, lowest };
}

/** DISTRIBUTION: an array of 5 counters, one for each grade (A, B, C, D, F). */
function getGradeCounts(list) {
  const counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < list.length; i++) {
    counts[GRADES.indexOf(list[i].grade)]++;
  }
  return counts;
}

/* ---------------------------------------------------------------------
   Saving in the browser
   --------------------------------------------------------------------- */

function saveStudents() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); } catch (error) { /* storage unavailable */ }
}

function isValidSavedStudent(s) {
  return s && typeof s.id === 'string' && typeof s.name === 'string' && Array.isArray(s.marks) &&
    s.marks.length === 3 && s.marks.every((m, i) => typeof m === 'number' && m >= 0 && m <= MARK_LIMITS[i]);
}

function loadStudents() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      const loaded = [];
      for (let i = 0; i < saved.length; i++) {
        if (isValidSavedStudent(saved[i])) {
          const total = calculateTotal(saved[i].marks);
          loaded.push({ id: saved[i].id, name: saved[i].name, marks: saved[i].marks.slice(), total, grade: calculateGrade(total) });
        }
      }
      students = loaded;
    }
  } catch (error) { students = []; }
}

/* ---------------------------------------------------------------------
   Form: validation, add, edit, delete
   --------------------------------------------------------------------- */

function clearErrors() {
  ['id', 'name', ...MARK_NAMES].forEach((field) => { $('error-' + field).textContent = ''; });
}

/** Read the form and check every field. Returns { valid, student }. */
function readForm() {
  clearErrors();
  let valid = true;
  const id = $('student-id').value.trim();
  const name = $('student-name').value.trim().replace(/\s+/g, ' ');

  if (id === '') { $('error-id').textContent = 'Enter the student ID.'; valid = false; }
  else {
    const existing = findStudentIndex(id);
    if (existing !== -1 && students[existing].id.toLowerCase() !== (editingId || '').toLowerCase()) {
      $('error-id').textContent = 'This ID is already in the list.'; valid = false;
    }
  }
  if (name === '') { $('error-name').textContent = 'Enter the student name.'; valid = false; }

  const marks = [];
  for (let i = 0; i < MARK_NAMES.length; i++) {
    const raw = $('mark-' + MARK_NAMES[i]).value.trim();
    const value = Number(raw);
    if (raw === '' || !Number.isFinite(value)) {
      $('error-' + MARK_NAMES[i]).textContent = 'Enter a mark.'; valid = false;
    } else if (value < 0 || value > MARK_LIMITS[i]) {
      $('error-' + MARK_NAMES[i]).textContent = `Must be between 0 and ${MARK_LIMITS[i]}.`; valid = false;
    }
    marks.push(value);
  }
  if (!valid) return { valid: false };
  const total = calculateTotal(marks);
  return { valid: true, student: { id, name, marks, total, grade: calculateGrade(total) } };
}

function resetForm() {
  $('student-form').reset();
  editingId = null;
  $('form-title').textContent = 'Add a student';
  $('save-btn').textContent = 'Add student';
  $('cancel-btn').hidden = true;
  clearErrors();
  updatePreview();
}

function handleSubmit(event) {
  event.preventDefault();
  const result = readForm();
  if (!result.valid) {
    const firstError = document.querySelector('.error:not(:empty)');
    if (firstError) firstError.previousElementSibling.focus();
    return;
  }
  if (editingId !== null) {
    const index = findStudentIndex(editingId);       // find the slot, then replace it
    if (index !== -1) students[index] = result.student;
    showToast(`${result.student.name} updated.`);
  } else {
    students.push(result.student);                   // push adds to the end of the array
    showToast(`${result.student.name} added.`);
  }
  saveStudents();
  resetForm();
  render();
  $('student-id').focus();
}

function startEdit(id) {
  const index = findStudentIndex(id);
  if (index === -1) return;
  const s = students[index];
  editingId = s.id;
  $('student-id').value = s.id;
  $('student-name').value = s.name;
  $('mark-assignment').value = s.marks[0];
  $('mark-midsem').value = s.marks[1];
  $('mark-exam').value = s.marks[2];
  $('form-title').textContent = `Edit ${s.name}`;
  $('save-btn').textContent = 'Save changes';
  $('cancel-btn').hidden = false;
  clearErrors();
  updatePreview();
  $('student-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('student-name').focus();
}

function deleteStudent(id) {
  const index = findStudentIndex(id);
  if (index === -1) return;
  const name = students[index].name;
  if (!window.confirm(`Delete ${name} (${students[index].id})?`)) return;
  students.splice(index, 1);                         // splice removes one item and closes the gap
  if (editingId !== null && editingId.toLowerCase() === id.toLowerCase()) resetForm();
  saveStudents();
  render();
  showToast(`${name} deleted.`);
}

/** Live preview of the total and grade while typing marks. */
function updatePreview() {
  const marks = [];
  let complete = true;
  for (let i = 0; i < MARK_NAMES.length; i++) {
    const raw = $('mark-' + MARK_NAMES[i]).value.trim();
    const value = Number(raw);
    if (raw === '' || !Number.isFinite(value) || value < 0 || value > MARK_LIMITS[i]) complete = false;
    marks.push(Number.isFinite(value) ? value : 0);
  }
  const badge = $('preview-grade');
  if (complete) {
    const total = calculateTotal(marks);
    const grade = calculateGrade(total);
    $('preview-total').textContent = total;
    badge.textContent = grade;
    badge.className = 'grade-badge grade-' + grade.toLowerCase();
  } else {
    $('preview-total').textContent = '0';
    badge.textContent = '\u2013';
    badge.className = 'grade-badge grade-none';
  }
}

/* ---------------------------------------------------------------------
   Showing things on the page
   --------------------------------------------------------------------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatMark(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function renderStats() {
  const stats = getStatistics(students);
  $('stat-count').textContent = students.length;
  $('stat-count-note').textContent = students.length === 0 ? 'No records yet' : (students.length === 1 ? 'student recorded' : 'students recorded');
  if (!stats) {
    ['stat-avg', 'stat-high', 'stat-low'].forEach((id) => { $(id).textContent = '\u2014'; });
    $('stat-high-name').textContent = '\u00a0';
    $('stat-low-name').textContent = '\u00a0';
    return;
  }
  $('stat-avg').textContent = stats.average.toFixed(1);
  $('stat-high').textContent = formatMark(stats.highest.total);
  $('stat-high-name').textContent = stats.highest.name;
  $('stat-low').textContent = formatMark(stats.lowest.total);
  $('stat-low-name').textContent = stats.lowest.name;
}

function renderDistribution() {
  const counts = getGradeCounts(students);
  let biggest = 0;
  for (let i = 0; i < counts.length; i++) if (counts[i] > biggest) biggest = counts[i];
  const box = $('distribution');
  box.replaceChildren();
  for (let i = 0; i < GRADES.length; i++) {
    const row = el('div', 'dist-row');
    row.append(el('span', 'grade-badge grade-' + GRADES[i].toLowerCase(), GRADES[i]));
    const track = el('div', 'dist-track');
    const bar = el('div', 'dist-bar grade-bar-' + GRADES[i].toLowerCase());
    bar.style.width = biggest === 0 ? '0%' : Math.round((counts[i] / biggest) * 100) + '%';
    track.append(bar);
    row.append(track, el('span', 'dist-count', String(counts[i])));
    box.append(row);
  }
  const passed = students.length - counts[4];
  $('distribution-note').textContent = students.length === 0
    ? 'How many students earned each grade.'
    : `${passed} of ${students.length} students passed (50 and above).`;
}

function renderTable() {
  const visible = sortStudents(searchStudents(students, $('search').value), $('sort').value);
  const body = $('student-table');
  body.replaceChildren();

  for (let i = 0; i < visible.length; i++) {
    const s = visible[i];
    const row = el('tr');
    row.append(el('td', 'muted', String(i + 1)), el('td', '', s.id), el('td', 'name-cell', s.name));
    for (let m = 0; m < s.marks.length; m++) row.append(el('td', 'num', formatMark(s.marks[m])));
    row.append(el('td', 'num total-cell', formatMark(s.total)));
    const gradeCell = el('td');
    gradeCell.append(el('span', 'grade-badge grade-' + s.grade.toLowerCase(), s.grade));
    row.append(gradeCell);
    row.append(el('td', s.grade === 'F' ? 'remark fail' : 'remark pass', s.grade === 'F' ? 'Fail' : 'Pass'));

    const actions = el('td', 'actions-col');
    const edit = el('button', 'link-btn', 'Edit');
    edit.type = 'button';
    edit.setAttribute('aria-label', `Edit ${s.name}`);
    edit.addEventListener('click', () => startEdit(s.id));
    const remove = el('button', 'link-btn danger', 'Delete');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${s.name}`);
    remove.addEventListener('click', () => deleteStudent(s.id));
    actions.append(edit, remove);
    row.append(actions);
    body.append(row);
  }

  $('results-count').textContent = `Showing ${visible.length} of ${students.length} student${students.length === 1 ? '' : 's'}`;
  const empty = $('empty-state');
  empty.hidden = visible.length > 0;
  if (visible.length === 0) {
    if (students.length === 0) {
      $('empty-title').textContent = 'No students yet';
      $('empty-text').textContent = 'Add a student with the form above, or load a few sample students to try it out.';
    } else {
      $('empty-title').textContent = 'No matching students';
      $('empty-text').textContent = 'Try a different ID or name.';
    }
  }
}

function render() {
  renderStats();
  renderDistribution();
  renderTable();
}

let toastTimer;
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

/* ---------------------------------------------------------------------
   Sample data and clearing
   --------------------------------------------------------------------- */

// Fictional students for demonstration only.
const SAMPLE_STUDENTS = [
  ['10234501', 'Ama Mensah', [18, 26, 44]],
  ['10234502', 'Kwame Boateng', [15, 22, 38]],
  ['10234503', 'Efua Owusu', [19, 28, 47]],
  ['10234504', 'Yaw Asante', [12, 17, 30]],
  ['10234505', 'Abena Sarpong', [16, 24, 41]],
  ['10234506', 'Kofi Darko', [8, 12, 20]],
  ['10234507', 'Akosua Frimpong', [17, 21, 33]],
  ['10234508', 'Nana Addo Quaye', [14, 19, 27]]
];

function loadSamples() {
  let added = 0;
  for (let i = 0; i < SAMPLE_STUDENTS.length; i++) {
    const [id, name, marks] = SAMPLE_STUDENTS[i];
    if (findStudentIndex(id) === -1) {               // skip any that are already in the list
      const total = calculateTotal(marks);
      students.push({ id, name, marks, total, grade: calculateGrade(total) });
      added++;
    }
  }
  saveStudents();
  render();
  showToast(added === 0 ? 'Sample students are already in the list.' : `${added} sample students added.`);
}

function clearAll() {
  if (students.length === 0) { showToast('There is nothing to clear.'); return; }
  if (!window.confirm(`Remove all ${students.length} students? This cannot be undone.`)) return;
  students = [];                                      // an empty array starts the list again
  saveStudents();
  resetForm();
  render();
  showToast('All students removed.');
}

/* ---------------------------------------------------------------------
   Start
   --------------------------------------------------------------------- */

$('student-form').addEventListener('submit', handleSubmit);
$('cancel-btn').addEventListener('click', resetForm);
$('search').addEventListener('input', renderTable);
$('sort').addEventListener('change', renderTable);
$('sample-btn').addEventListener('click', loadSamples);
$('clear-btn').addEventListener('click', clearAll);
MARK_NAMES.forEach((name) => $('mark-' + name).addEventListener('input', updatePreview));

loadStudents();
render();
