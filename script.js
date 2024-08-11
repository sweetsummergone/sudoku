let selectedCell = null;
let solution = null;
let task = [];
let userGrid = [];
let errorTimers = {};

document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');

    if (localStorage.getItem('task')) {
        solution = JSON.parse(localStorage.getItem('sudokuSolution'));
        userGrid = JSON.parse(localStorage.getItem('userGrid')) || JSON.parse(localStorage.getItem('task'));
        task = JSON.parse(localStorage.getItem('task'));
        renderSudokuGrid(userGrid);
        spinner.style.display = 'none';
    } else {
        fetchSudokuData();
    }

    createContextMenu();
    document.getElementById('reset-button').addEventListener('click', resetGrid);
    document.getElementById('validate-button').addEventListener('click', validateGrid);

    // Hide context menu when clicking outside of it
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.context-menu') && !event.target.closest('#sudoku-grid div')) {
            document.getElementById('context-menu').style.display = 'none';
        }
    });
});

async function fetchSudokuData() {
    const spinner = document.getElementById('spinner');
    const validateBtn = document.getElementById('validate-button');
    const resetBtn = document.getElementById('reset-button');

    spinner.style.display = 'flex'; // Show spinner while loading data
    validateBtn.disabled = true;
    resetBtn.disabled = true;

    try {
        const response = await fetch('https://sudoku-api.vercel.app/api/dosuku');
        const data = await response.json();
        solution = data.newboard.grids[0].solution;

        task = data.newboard.grids[0].value.map(row => row.slice());
        userGrid = [...task];
        localStorage.setItem('sudokuSolution', JSON.stringify(solution));
        localStorage.setItem('userGrid', JSON.stringify(userGrid));
        localStorage.setItem('task', JSON.stringify(task));

        renderSudokuGrid(task);
    } catch (error) {
        console.error('Error fetching Sudoku data:', error);
    } finally {
        spinner.style.display = 'none';
        validateBtn.disabled = false;
        resetBtn.disabled = false;
    }
}

function renderSudokuGrid(grid) {
    const container = document.getElementById('sudoku-grid');
    container.innerHTML = '';

    grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement('div');
            cellDiv.dataset.row = rowIndex;
            cellDiv.dataset.col = colIndex;

            if (task[rowIndex][colIndex] !== 0) {
                cellDiv.textContent = task[rowIndex][colIndex];
                cellDiv.classList.add('fixed');
            } else {
                cellDiv.textContent = cell !== 0 ? cell : '';
                cellDiv.addEventListener('click', (event) => showContextMenu(event, cellDiv));
            }

            container.appendChild(cellDiv);
        });
    });
}

function showContextMenu(event, cell) {
    event.preventDefault();
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }
    selectedCell = cell;
    cell.classList.add('selected');

    const menu = document.getElementById('context-menu');
    menu.style.display = 'flex';
    let menuWidth = menu.offsetWidth;
    let menuHeight = menu.offsetHeight;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    let x = event.clientX;
    let y = event.clientY;

    // Adjust position horizontally
    if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth - 10; // Leave 10px margin from the edge
    }

    // Adjust position vertically
    if (y + menuHeight > viewportHeight) {
        y = viewportHeight - menuHeight - 10; // Leave 10px margin from the edge
    }

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
}

function createContextMenu() {
    const menu = document.getElementById('context-menu');
    menu.innerHTML = ''; // Clear menu before creation

    for (let i = 1; i <= 9; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => fillCell(i));
        menu.appendChild(button);
    }

    menu.style.display = 'none'; // Hide menu after creation
}

function fillCell(number) {
    if (selectedCell) {
        const row = selectedCell.dataset.row;
        const col = selectedCell.dataset.col;
        userGrid[row][col] = number;

        selectedCell.textContent = number;
        document.getElementById('context-menu').style.display = 'none';

        if (checkCompletion()) {
            validateGrid();
        }

        localStorage.setItem('userGrid', JSON.stringify(userGrid));
    }
}

function resetGrid() {
    userGrid = JSON.parse(localStorage.getItem('task')).map(row => row.slice()); // Reset to initial state
    renderSudokuGrid(userGrid);
    localStorage.setItem('userGrid', JSON.stringify(userGrid));
}

function checkCompletion() {
    return userGrid.flat().every(cell => cell !== 0);
}

function validateGrid() {
    let hasErrors = false;
    const container = document.getElementById('sudoku-grid');

    userGrid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = container.children[rowIndex * 9 + colIndex];
            const cellKey = `${rowIndex}-${colIndex}`;
            
            // Clear old timer if it exists
            if (errorTimers[cellKey]) {
                clearTimeout(errorTimers[cellKey]);
                delete errorTimers[cellKey];
            }

            // Remove and add class to reset animation
            cellDiv.classList.remove('cell-error');

            if (cell !== solution[rowIndex][colIndex]) {
                void cellDiv.offsetWidth; // Important to restart animation
                cellDiv.classList.add('cell-error');
                hasErrors = true;

                // Reset animation and restart after 10.5 seconds
                errorTimers[cellKey] = setTimeout(() => {
                    if (cellDiv.classList.contains('cell-error')) {
                        cellDiv.style.animation = 'none';
                        requestAnimationFrame(() => {
                            cellDiv.style.animation = '';
                        });
                    }
                }, 10500);
            } else {
                task[rowIndex][colIndex] = cell;
                localStorage.setItem('task', JSON.stringify(task)); // Save correct answer in task
            }
        });
    });

    if (!hasErrors) {
        setTimeout(() => {
            if (confirm('Congratulations! You solved the puzzle. Start a new game?')) {
                localStorage.removeItem('sudokuSolution');
                localStorage.removeItem('userGrid');
                localStorage.removeItem('task');
                location.reload();
            }
        }, 100);
    }
}
