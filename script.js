let selectedCell = null;
let solution = null;
let task = [];
let userGrid = [];

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('task')) {
        solution = JSON.parse(localStorage.getItem('sudokuSolution'));
        userGrid = JSON.parse(localStorage.getItem('userGrid')) ? JSON.parse(localStorage.getItem('userGrid')) : JSON.parse(localStorage.getItem('task'));
        task = JSON.parse(localStorage.getItem('task'));
        renderSudokuGrid(userGrid);
    } else {
        fetchSudokuData();
    }

    createContextMenu();
    document.getElementById('reset-button').addEventListener('click', resetGrid);

    // Hide context menu when clicking outside of it
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.context-menu') && !event.target.closest('#sudoku-grid div')) {
            document.getElementById('context-menu').style.display = 'none';
        }
    });
});

async function fetchSudokuData() {
    const response = await fetch('https://sudoku-api.vercel.app/api/dosuku');
    const data = await response.json();
    solution = data.newboard.grids[0].solution;

    task = data.newboard.grids[0].value.map(row => row.slice());
    userGrid = task;
    localStorage.setItem('sudokuSolution', JSON.stringify(solution));
    localStorage.setItem('userGrid', JSON.stringify(userGrid));
    localStorage.setItem('task', JSON.stringify(task));

    renderSudokuGrid(task);
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
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
}

function createContextMenu() {
    const menu = document.getElementById('context-menu');
    menu.innerHTML = '';  // Очищаем меню перед созданием

    for (let i = 1; i <= 9; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => fillCell(i));
        menu.appendChild(button);
    }

    menu.style.display = 'none';  // Скрываем меню после создания
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
    renderSudokuGrid(task);
    userGrid = task;
    localStorage.removeItem('userGrid');
}

function checkCompletion() {
    return userGrid.every(row => row.every(cell => cell !== 0));
}

function validateGrid() {
    let hasErrors = false;
    const container = document.getElementById('sudoku-grid');

    userGrid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = container.children[rowIndex * 9 + colIndex];
            if (cell !== solution[rowIndex][colIndex]) {
                cellDiv.classList.add('cell-error');
                hasErrors = true;
            }
        });
    });

    if (!hasErrors) {
        setTimeout(() => {
            if (confirm('Congratulations! You solved the puzzle. Start a new game?')) {
                localStorage.removeItem('sudokuSolution');
                localStorage.removeItem('userGrid');
                location.reload();
            }
        }, 100);
    }
}
