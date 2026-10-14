# Academic Performance & Grade Management System

A web page for recording student marks, working out grades and seeing how a class is doing. Built with HTML, CSS and JavaScript only. No installation is needed.

## How to run

Open `index.html` in a browser.

## What it does

- Add a student with an ID, a name and three marks: assignment (/20), mid-semester (/30) and exam (/50).
- The total and grade are worked out automatically (A 80+, B 70-79, C 60-69, D 50-59, F below 50).
- Edit or delete any student.
- Search by ID or name, and sort by name, ID or total.
- Summary cards show the number of students, the class average, and the highest and lowest marks.
- A grade distribution chart shows how many students got each grade.
- Data is saved in the browser, so it is still there after a refresh.
- "Load sample students" fills the list with fictional demo data. "Clear all" empties it.

## Where the arrays are used (all in `script.js`)

| Task | How it is done |
|---|---|
| Store all students | `students` array, one object per student |
| Store one student's marks | `marks` array with 3 items: assignment, mid-semester, exam |
| Add a student | `push` adds to the end of the array |
| Find a student by ID | `findStudentIndex`: linear search with a `for` loop |
| Edit a student | find the index, then replace that item |
| Delete a student | `splice` removes the item and closes the gap |
| Search box | `searchStudents`: loop and keep matches in a new array |
| Sort | `sortStudents`: sort a copy so the original order is kept |
| Total of the marks | `calculateTotal`: loop through the marks array |
| Average, highest, lowest | `getStatistics`: one loop through the array |
| Grade distribution | `getGradeCounts`: an array of 5 counters (A, B, C, D, F) |

## Notes

The sample students are fictional. Marks are checked before saving: each must be a number between 0 and its maximum, and a student ID cannot be used twice.
