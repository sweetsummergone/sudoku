const validateBtn = document.getElementById('validate-button');
const resetBtn = document.getElementById('reset-button');

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
        generateSudokuData();
    }

    createContextMenu();
    resetBtn.addEventListener('click', resetGrid);
    validateBtn.addEventListener('click', validateGrid);

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.context-menu') && !event.target.closest('#sudoku-grid div')) {
            document.getElementById('context-menu').style.display = 'none';
        }
    });
});

function generateSudoku() {
    const grid = Array(81).fill('.');
    function fillSudoku(pos) {
        if (pos === 81) return true;
        const nums = [...Array(9).keys()].map(i => i + 1).sort(() => Math.random() - 0.5);
        for (let num of nums) {
            if (isValid(grid, pos, num)) {
                grid[pos] = num;
                if (fillSudoku(pos + 1)) return true;
                grid[pos] = '.';
            }
        }
        return false;
    }
    function isValid(grid, pos, num) {
        const [row, col] = [Math.floor(pos / 9), pos % 9];
        for (let i = 0; i < 9; i++) {
            if (grid[row * 9 + i] == num || grid[i * 9 + col] == num || 
                grid[Math.floor(row / 3) * 27 + Math.floor(col / 3) * 3 + (i % 3) + 9 * Math.floor(i / 3)] == num) 
                return false;
        }
        return true;
    }
    fillSudoku(0);
    return grid.join('');
}

function splitSudokuString(sudokuString) {
    let grid = [];
    for (let i = 0; i < 9; i++) {
        grid.push(sudokuString.slice(i * 9, (i + 1) * 9).split(''));
    }
    return grid;
}

function generateSudokuData() {
    setBtnDisabled(true);
    const sudokuString = generateSudoku();
    solution = splitSudokuString(sudokuString);
    task = createTaskWithClues(solution, 10);
    userGrid = [...task];

    localStorage.setItem('sudokuSolution', JSON.stringify(solution));
    localStorage.setItem('userGrid', JSON.stringify(userGrid));
    localStorage.setItem('task', JSON.stringify(task));
    renderSudokuGrid(task);
    setBtnDisabled(false);
}

function createTaskWithClues(solvedGrid, numClues) {
    let taskGrid = solvedGrid.map(row => row.slice()); // Копируем решенное судоку
    let positions = [...Array(81).keys()]; // Массив с позициями от 0 до 80

    // Перемешиваем массив позиций
    positions.sort(() => Math.random() - 0.5);

    // Оставляем только `numClues` заполненных клеток
    for (let i = 0; i < 81 - numClues; i++) {
        let pos = positions[i];
        taskGrid[Math.floor(pos / 9)][pos % 9] = '.'; // Очищаем клетку
    }

    return taskGrid;
}


function renderSudokuGrid(grid) {
    const container = document.getElementById('sudoku-grid');
    container.innerHTML = '';

    grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement('div');
            cellDiv.dataset.row = rowIndex;
            cellDiv.dataset.col = colIndex;
            cellDiv.classList.add('cell');

            if (task[rowIndex][colIndex] !== '.') {
                cellDiv.textContent = task[rowIndex][colIndex];
                cellDiv.classList.add('fixed');
            } else {
                cellDiv.textContent = cell !== '.' ? cell : '';
                cellDiv.addEventListener('click', (event) => showContextMenu(event, cellDiv));
            }

            container.appendChild(cellDiv);
        });
    });
}

function setBtnDisabled(condition) {
    validateBtn.disabled = condition;
    resetBtn.disabled = condition;
}

function createContextMenu() {
    const menu = document.getElementById('context-menu');
    menu.innerHTML = '';

    for (let i = 1; i <= 9; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => fillCell(i));
        menu.appendChild(button);
    }

    menu.style.display = 'none';
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
    userGrid = JSON.parse(localStorage.getItem('task')).map(row => row.slice());
    renderSudokuGrid(userGrid);
    localStorage.setItem('userGrid', JSON.stringify(userGrid));
    setBtnDisabled(true);
    setTimeout(() => {
        setBtnDisabled(false);
    }, 5000);
}

function checkCompletion() {
    return userGrid.flat().every(cell => cell !== '.');
}

function validateGrid() {
    let hasErrors = false;
    const container = document.getElementById('sudoku-grid');

    setBtnDisabled(true);
    userGrid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = container.children[rowIndex * 9 + colIndex];
            const cellKey = `${rowIndex}-${colIndex}`;

            if (errorTimers[cellKey]) {
                clearTimeout(errorTimers[cellKey]);
                delete errorTimers[cellKey];
            }

            cellDiv.classList.remove('cell-error');

            if (cell !== +solution[rowIndex][colIndex]) {
                void cellDiv.offsetWidth;
                cellDiv.classList.add('cell-error');
                hasErrors = true;

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
                localStorage.setItem('task', JSON.stringify(task));
            }
        });
    });

    setTimeout(() => {
        setBtnDisabled(false);
    }, 5000);

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
