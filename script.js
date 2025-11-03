

const loginPanel = document.getElementById('loginPanel');
const loginContainer = document.getElementById('loginContainer');
const mainContainer = document.getElementById('mainContainer');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeWrapper = document.getElementById('welcomeWrapper');
const playerNameSpan = document.getElementById('playerName');

function showLogin() {
 
  loginContainer.style.display = '';
  mainContainer.style.display = 'none';
  welcomeWrapper.style.display = 'none';
  logoutBtn.style.display = 'none';
  
  document.getElementById('emailInput').value = '';
  document.getElementById('usernameInput').value = '';
 
  document.getElementById('solutionToggle').style.display = 'none';
  document.getElementById('solutionPanel').classList.remove('active');
  document.getElementById('solutionPanel').style.display = 'none';
}

function showHomeAfterLogin(username) {
  loginContainer.style.display = 'none';
  mainContainer.style.display = '';
  welcomeWrapper.style.display = '';
  document.getElementById('gameSelection').style.display = 'grid';
  logoutBtn.style.display = 'block';
  playerNameSpan.textContent = username;
 
  document.getElementById('solutionToggle').style.display = 'none';
  document.getElementById('solutionPanel').classList.remove('active');
  document.getElementById('solutionPanel').style.display = 'none';
}


const savedUser = localStorage.getItem('arcadia_username');
if (savedUser) {
  showHomeAfterLogin(savedUser);
} else {
  showLogin();
}

loginBtn.addEventListener('click', () => {
  const email = (document.getElementById('emailInput').value || '').trim();
  const username = (document.getElementById('usernameInput').value || '').trim();
  if (!email || !username) {
    alert('Please enter an email and username.');
    return;
  }
  if (!email.includes('@')) {
    alert('Please enter a valid email.');
    return;
  }
  localStorage.setItem('arcadia_username', username);
  showHomeAfterLogin(username);
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('arcadia_username');
  
  if (sudokuGame && sudokuGame.timer) clearInterval(sudokuGame.timer);
  if (memoryState.timer) clearInterval(memoryState.timer);
  showLogin();
});


let currentGame = null;

function showGameSelection() {
  document.getElementById('sudokuGame').style.display = 'none';
  document.getElementById('memoryGame').style.display = 'none';
  document.getElementById('gameSelection').style.display = 'grid';
  document.getElementById('backBtn').style.display = 'none';
  currentGame = null;
  
  document.getElementById('solutionToggle').style.display = 'none';
  document.getElementById('solutionPanel').classList.remove('active');
  document.getElementById('solutionPanel').style.display = 'none';
  closeCompletionModal();
}

function showGame(gameType) {
  document.getElementById('gameSelection').style.display = 'none';
  document.getElementById('backBtn').style.display = 'block';
  currentGame = gameType;
  if (gameType === 'sudoku') {
    document.getElementById('sudokuGame').style.display = 'block';
    document.getElementById('memoryGame').style.display = 'none';
    if (!sudokuGame) sudokuGame = new SudokuGame();
    updateSolutionToggleVisibility();
  } else if (gameType === 'memory') {
    document.getElementById('sudokuGame').style.display = 'none';
    document.getElementById('memoryGame').style.display = 'block';
    initMemory();
    updateSolutionToggleVisibility();
  }
  closeCompletionModal();
}

function updateSolutionToggleVisibility() {
  const toggle = document.getElementById('solutionToggle');
  const panel = document.getElementById('solutionPanel');
  if (currentGame === 'sudoku') {
    toggle.style.display = 'block';
    panel.style.display = 'block';
    panel.classList.remove('active');
  } else {
    toggle.style.display = 'none';
    panel.classList.remove('active');
    panel.style.display = 'none';
  }
}


const overlay = document.getElementById('overlay');
const completionModal = document.getElementById('completionModal');
const completionTitle = document.getElementById('completionTitle');
const completionText = document.getElementById('completionText');
const completionPlayAgain = document.getElementById('completionPlayAgain');
const completionBackHome = document.getElementById('completionBackHome');

function openCompletionModal(timeText, gameName) {
  const username = localStorage.getItem('arcadia_username') || 'Player';
  completionTitle.textContent = `🎉 Congratulations, ${username}!`;
  completionText.textContent = `You completed ${gameName} in ${timeText}`;
  overlay.style.display = 'block';
  completionModal.style.display = 'block';
  completionModal.setAttribute('aria-hidden', 'false');

 
  completionPlayAgain.onclick = () => {
    overlay.style.display = 'none';
    completionModal.style.display = 'none';
    if (gameName === 'Sudoku') {
      if (!sudokuGame) sudokuGame = new SudokuGame();
      sudokuGame.reset();
    } else if (gameName === 'Memory Pairs') {
      restartMemory();
    }
  };
  completionBackHome.onclick = () => {
    overlay.style.display = 'none';
    completionModal.style.display = 'none';
    showGameSelection();
  };
}

function closeCompletionModal() {
  overlay.style.display = 'none';
  completionModal.style.display = 'none';
  completionModal.setAttribute('aria-hidden', 'true');
}


class SudokuGame {
  constructor() {
    this.board = Array(9).fill().map(() => Array(9).fill(0));
    this.solution = Array(9).fill().map(() => Array(9).fill(0));
    this.originalBoard = Array(9).fill().map(() => Array(9).fill(0));
    this.startTime = null;
    this.timer = null;
    this.elapsedWhenStopped = 0;
    this.moves = 0;
    this.selectedCell = null;
    this.difficulty = 'medium';
    this.difficultySettings = {
      easy: { cellsToRemove: 30, name: 'Easy' },
      medium: { cellsToRemove: 45, name: 'Medium' },
      hard: { cellsToRemove: 55, name: 'Hard' }
    };
    this.hasStartedPlaying = false;
    this.init();
  }

  init() {
    this.createGrid();
    this.generatePuzzle();
    this.updateDisplay();
    this.hideValidationResult();
  }

  createGrid() {
    const grid = document.getElementById('sudokuGrid');
    grid.innerHTML = '';
    for (let i = 0; i < 81; i++) {
      const cell = document.createElement('input');
      cell.type = 'number';
      cell.min = '1';
      cell.max = '9';
      cell.className = 'sudoku-cell';
      cell.addEventListener('input', (e) => this.handleInput(e, i));
      cell.addEventListener('focus', (e) => this.handleCellFocus(e, i));
      cell.addEventListener('keydown', (e) => this.handleKeyDown(e, i));
      grid.appendChild(cell);
    }
  }

  generatePuzzle() {
    this.generateSolution();
    this.board = this.solution.map(row => [...row]);
    const cellsToRemove = this.difficultySettings[this.difficulty].cellsToRemove;
    this.removeNumbers(cellsToRemove);
    this.originalBoard = this.board.map(row => [...row]);
    this.updateSolutionDisplay();
  }

  generateSolution() {
    const numbers = [1,2,3,4,5,6,7,8,9];
    this.solution = Array(9).fill().map(() => Array(9).fill(0));

   
    for (let box = 0; box < 9; box += 3) {
      const shuffled = [...numbers];
      this.shuffleArray(shuffled);
      let idx = 0;
      for (let i = box; i < box + 3; i++) {
        for (let j = box; j < box + 3; j++) {
          this.solution[i][j] = shuffled[idx++];
        }
      }
    }

    const boardCopy = this.solution.map(row => [...row]);
    this.solveSudoku(boardCopy);
    this.solution = boardCopy;
  }

  solveSudoku(board) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(board, i, j, num)) {
              board[i][j] = num;
              if (this.solveSudoku(board)) return true;
              board[i][j] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  isValidMove(board, row, col, num) {
    for (let j = 0; j < 9; j++) if (board[row][j] === num) return false;
    for (let i = 0; i < 9; i++) if (board[i][col] === num) return false;
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if (board[i][j] === num) return false;
      }
    }
    return true;
  }

  removeNumbers(count) {
    const positions = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) positions.push([i,j]);
    this.shuffleArray(positions);
    for (let k = 0; k < count && k < positions.length; k++) {
      const [r,c] = positions[k];
      this.board[r][c] = 0;
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  updateDisplay() {
    const cells = document.querySelectorAll('.sudoku-cell');
    cells.forEach((cell, index) => {
      const row = Math.floor(index / 9);
      const col = index % 9;
      const value = this.board[row][col];
      cell.value = value || '';
      cell.classList.remove('given','error','highlight','correct','incorrect');
      if (this.originalBoard[row][col] !== 0) {
        cell.classList.add('given');
        cell.readOnly = true;
      } else {
        cell.readOnly = false;
      }
    });
    document.getElementById('moves').textContent = this.moves;
    document.getElementById('difficulty').textContent = this.difficultySettings[this.difficulty].name;
  }

  handleInput(event, cellIndex) {
    if (!this.hasStartedPlaying) {
      this.hasStartedPlaying = true;
      this.startTimer();
    }
    const row = Math.floor(cellIndex / 9);
    const col = cellIndex % 9;
    const raw = event.target.value;
    const value = parseInt(raw) || 0;
    if (this.originalBoard[row][col] !== 0) return;
    if (value < 0 || value > 9) return;
    this.board[row][col] = value;
    this.moves++;
    this.updateDisplay();
    if (this.isBoardComplete()) {
      setTimeout(() => {
        if (this.isBoardValid()) this.onComplete();
      }, 200);
    }
  }

  handleCellFocus(event, cellIndex) {
    this.selectedCell = cellIndex;
    this.highlightRelated(cellIndex);
  }

  handleKeyDown(event, cellIndex) {
    const row = Math.floor(cellIndex / 9);
    const col = cellIndex % 9;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.originalBoard[row][col] === 0) {
        this.board[row][col] = 0;
        event.target.value = '';
        this.moves++;
        this.updateDisplay();
      }
    }
  }

  highlightRelated(cellIndex) {
    const cells = document.querySelectorAll('.sudoku-cell');
    const row = Math.floor(cellIndex / 9);
    const col = cellIndex % 9;
    cells.forEach((cell, index) => {
      cell.classList.remove('highlight');
      const r = Math.floor(index / 9);
      const c = index % 9;
      if (r === row || c === col || (Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3))) {
        cell.classList.add('highlight');
      }
    });
  }

  isBoardComplete() {
    return this.board.every(row => row.every(cell => cell !== 0));
  }

  isBoardValid() {
    for (let i=0;i<9;i++){
      for (let j=0;j<9;j++){
        const num = this.board[i][j];
        if (num !== 0) {
          this.board[i][j] = 0;
          if (!this.isValidMove(this.board, i, j, num)) {
            this.board[i][j] = num;
            return false;
          }
          this.board[i][j] = num;
        }
      }
    }
    return true;
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.startTime = Date.now() - (this.elapsedWhenStopped * 1000);
    this.timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2,'0');
      const seconds = (elapsed % 60).toString().padStart(2,'0');
      document.getElementById('timer').textContent = `${minutes}:${seconds}`;
      this.elapsedWhenStopped = elapsed;
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.elapsedWhenStopped = elapsed;
    }
  }

  resetTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.startTime = null;
    this.elapsedWhenStopped = 0;
    this.hasStartedPlaying = false;
    document.getElementById('timer').textContent = '00:00';
  }

  showSuccessModal(timeText) {
    openCompletionModal(timeText, 'Sudoku');
  }

  onComplete() {
    this.stopTimer();
    const elapsed = Math.floor(this.elapsedWhenStopped);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2,'0');
    const seconds = (elapsed % 60).toString().padStart(2,'0');
    const timeText = `${minutes}:${seconds}`;
    openCompletionModal(timeText, 'Sudoku');
  }

  reset() {
    if (this.timer) clearInterval(this.timer);
    this.moves = 0;
    this.elapsedWhenStopped = 0;
    this.startTime = null;
    this.timer = null;
    this.hasStartedPlaying = false;
    this.generatePuzzle();
    this.updateDisplay();
    this.hideValidationResult();
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('moves').textContent = '0';
  }

  clear() {
    for (let i=0;i<9;i++) for (let j=0;j<9;j++) if (this.originalBoard[i][j] === 0) this.board[i][j]=0;
    this.updateDisplay();
    this.hideValidationResult();
  }

  setDifficulty(newDifficulty) {
    if (!this.difficultySettings[newDifficulty]) return;
    this.difficulty = newDifficulty;
    document.querySelectorAll('.difficulty-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('.difficulty-btn.'+newDifficulty)?.classList.add('active');
    this.reset();
  }

  updateSolutionDisplay() {
    const solutionGrid = document.getElementById('solutionGrid');
    solutionGrid.innerHTML = '';
    for (let idx=0; idx<81; idx++){
      const r = Math.floor(idx / 9);
      const c = idx % 9;
      const cell = document.createElement('div');
      cell.className = 'solution-cell';
      cell.textContent = this.solution[r][c];
      if (this.originalBoard[r][c] !== 0) cell.classList.add('highlight');
      solutionGrid.appendChild(cell);
    }
  }

  validateAndShow() {
    const validationResult = document.getElementById('validationResult');
    const cells = document.querySelectorAll('.sudoku-cell');
    cells.forEach(cell => cell.classList.remove('correct','incorrect'));

    let correctCells = 0;
    let totalFilledCells = 0;
    let hasErrors = false;

    for (let i=0;i<9;i++){
      for (let j=0;j<9;j++){
        const idx = i*9 + j;
        const userVal = this.board[i][j];
        const correctVal = this.solution[i][j];
        const cell = cells[idx];
        if (userVal !== 0) {
          totalFilledCells++;
          if (userVal === correctVal) {
            cell.classList.add('correct');
            correctCells++;
          } else {
            cell.classList.add('incorrect');
            hasErrors = true;
          }
        }
      }
    }

    validationResult.className = 'validation-result';
    if (correctCells === 81) {
      validationResult.classList.add('success');
      validationResult.textContent = '🎉 Perfect! Puzzle completed successfully!';
      setTimeout(()=>this.onComplete(), 500);
    } else if (hasErrors) {
      validationResult.classList.add('error');
      validationResult.textContent = `❌ ${totalFilledCells - correctCells} incorrect entries found.`;
    } else {
      validationResult.classList.add('partial');
      validationResult.textContent = `✨ ${correctCells} correct entries so far. ${81 - totalFilledCells} cells remaining.`;
    }

    setTimeout(()=> {
      validationResult.className = 'validation-result';
      cells.forEach(cell => cell.classList.remove('correct','incorrect'));
    }, 3500);
  }

  hideValidationResult() {
    const validationResult = document.getElementById('validationResult');
    validationResult.className = 'validation-result';
  }
}

let sudokuGame = null;


function startSudokuTimer(){ if (!sudokuGame) return; if (!sudokuGame.timer) sudokuGame.startTimer(); }
function stopSudokuTimer(){ if (!sudokuGame) return; sudokuGame.stopTimer(); }
function resetSudokuTimer(){ if (!sudokuGame) return; sudokuGame.resetTimer(); }
function newGame(){ if (!sudokuGame) sudokuGame = new SudokuGame(); else sudokuGame.reset(); }
function clearBoard(){ if (sudokuGame) sudokuGame.clear(); }
function setDifficulty(d){ if (!sudokuGame) sudokuGame = new SudokuGame(); sudokuGame.setDifficulty(d); }
function validateSolution(){ if (sudokuGame) sudokuGame.validateAndShow(); }

function toggleSolution() {
  if (currentGame !== 'sudoku') return;
  const panel = document.getElementById('solutionPanel');
  const toggle = document.getElementById('solutionToggle');
  if (panel.classList.contains('active')) {
    panel.classList.remove('active');
    toggle.textContent = 'SOLUTION';
    panel.setAttribute('aria-hidden','true');
  } else {
    panel.classList.add('active');
    toggle.textContent = 'CLOSE';
    panel.setAttribute('aria-hidden','false');
  }
}


let memoryState = {
  symbols: [],
  flipped: [],
  matched: [],
  firstIndex: null,
  secondIndex: null,
  moves: 0,
  matches: 0,
  timer: null,
  startTime: null,
  elapsedWhenStopped: 0,
  running: false,
  preventClick: false
};

function initMemory() {
  const boardElem = document.getElementById('memoryBoard');
  if (!boardElem.hasChildNodes() || memoryState.symbols.length === 0) startNewMemory();
  document.getElementById('overlay').style.display = 'none';
}

function startNewMemory() {
  memoryState = {
    symbols: [],
    flipped: Array(24).fill(false),
    matched: Array(24).fill(false),
    firstIndex: null,
    secondIndex: null,
    moves: 0,
    matches: 0,
    timer: null,
    startTime: null,
    elapsedWhenStopped: 0,
    running: false,
    preventClick: false
  };
  document.getElementById('memoryMoves').textContent = '0';
  document.getElementById('memoryMatches').textContent = '0';
  document.getElementById('memoryTimer').textContent = '00:00';
  const pairSymbols = ['🍎','🍌','🍇','🍓','🍒','🍊','🍉','🍍','🥝','🍑','🥭','🍐'];
  let deck = [];
  pairSymbols.forEach(s => { deck.push(s); deck.push(s); });
  shuffle(deck);
  memoryState.symbols = deck;
  renderMemoryBoard();
}

function shuffle(arr){
  for (let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
}

function renderMemoryBoard(){
  const board = document.getElementById('memoryBoard');
  board.innerHTML = '';
  memoryState.symbols.forEach((sym, idx) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.index = idx;
    card.innerHTML = `
      <div class="inner">
        <div class="face front"></div>
        <div class="face back">${sym}</div>
      </div>
    `;
    card.addEventListener('click', () => handleMemoryClick(idx));
    board.appendChild(card);
  });
}

function handleMemoryClick(index){
  if (memoryState.preventClick) return;
  if (memoryState.matched[index]) return;
  if (memoryState.flipped[index]) return;

  if (!memoryState.running) {
    memoryState.running = true;
    startMemoryTimer();
    memoryState.startTime = memoryState.startTime || Date.now() - (memoryState.elapsedWhenStopped * 1000);
  }

  const cardElem = document.querySelector(`.memory-card[data-index="${index}"]`);
  if (!cardElem) return;

  cardElem.classList.add('flipped');
  memoryState.flipped[index] = true;

  if (memoryState.firstIndex === null) {
    memoryState.firstIndex = index;
  } else if (memoryState.secondIndex === null) {
    memoryState.secondIndex = index;
    memoryState.moves++;
    document.getElementById('memoryMoves').textContent = memoryState.moves;
    evaluateMemoryPair(memoryState.firstIndex, memoryState.secondIndex);
  }
}

function evaluateMemoryPair(i1, i2) {
  memoryState.preventClick = true;
  const sym1 = memoryState.symbols[i1];
  const sym2 = memoryState.symbols[i2];
  const isEqual = sym1 === sym2;
  if (isEqual) {
    memoryState.matched[i1] = true;
    memoryState.matched[i2] = true;
    memoryState.matches++;
    document.getElementById('memoryMatches').textContent = memoryState.matches;
    setTimeout(() => {
      const c1 = document.querySelector(`.memory-card[data-index="${i1}"]`);
      const c2 = document.querySelector(`.memory-card[data-index="${i2}"]`);
      if (c1) c1.style.visibility = 'hidden';
      if (c2) c2.style.visibility = 'hidden';
      memoryState.firstIndex = null;
      memoryState.secondIndex = null;
      memoryState.preventClick = false;
      if (memoryState.matches >= 12) finishMemory();
    }, 450);
  } else {
    setTimeout(() => {
      const c1 = document.querySelector(`.memory-card[data-index="${i1}"]`);
      const c2 = document.querySelector(`.memory-card[data-index="${i2}"]`);
      if (c1) c1.classList.remove('flipped');
      if (c2) c2.classList.remove('flipped');
      memoryState.flipped[i1] = false;
      memoryState.flipped[i2] = false;
      memoryState.firstIndex = null;
      memoryState.secondIndex = null;
      memoryState.preventClick = false;
    }, 900);
  }
}

function updateMemoryTimerDisplay(){
  const elapsed = Math.floor(memoryState.elapsedWhenStopped);
  const minutes = Math.floor(elapsed/60).toString().padStart(2,'0');
  const seconds = (elapsed%60).toString().padStart(2,'0');
  document.getElementById('memoryTimer').textContent = `${minutes}:${seconds}`;
}

function startMemoryTimer(){
  if (memoryState.timer) return;
  memoryState.startTime = Date.now() - (memoryState.elapsedWhenStopped * 1000);
  memoryState.timer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - memoryState.startTime) / 1000);
    memoryState.elapsedWhenStopped = elapsed;
    const minutes = Math.floor(elapsed/60).toString().padStart(2,'0');
    const seconds = (elapsed%60).toString().padStart(2,'0');
    document.getElementById('memoryTimer').textContent = `${minutes}:${seconds}`;
  }, 1000);
  memoryState.running = true;
}

function stopMemoryTimer(){
  if (!memoryState.timer) return;
  clearInterval(memoryState.timer);
  memoryState.timer = null;
  const elapsed = Math.floor((Date.now() - memoryState.startTime) / 1000);
  memoryState.elapsedWhenStopped = elapsed;
  memoryState.running = false;
}

function resetMemoryTimer(){
  if (memoryState.timer) clearInterval(memoryState.timer);
  memoryState.timer = null;
  memoryState.startTime = null;
  memoryState.elapsedWhenStopped = 0;
  memoryState.running = false;
  document.getElementById('memoryTimer').textContent = '00:00';
}

function finishMemory(){
  if (memoryState.timer) clearInterval(memoryState.timer);
  memoryState.timer = null;
  memoryState.running = false;
  const elapsed = Math.floor(memoryState.elapsedWhenStopped);
  const minutes = Math.floor(elapsed/60).toString().padStart(2,'0');
  const seconds = (elapsed%60).toString().padStart(2,'0');
  const timeText = `${minutes}:${seconds}`;
  openCompletionModal(timeText, 'Memory Pairs');
}

function restartMemory(){
  resetMemoryTimer();
  startNewMemory();
  document.getElementById('overlay').style.display = 'none';
}

function shuffleMemory(){
  restartMemory();
}

function showMemorySolution(){
  const cards = Array.from(document.querySelectorAll('.memory-card'));
  cards.forEach((c, idx) => { if (!memoryState.matched[idx]) c.classList.add('flipped'); });
  setTimeout(() => { cards.forEach((c, idx) => { if (!memoryState.matched[idx]) c.classList.remove('flipped'); }); }, 1800);
}


window.addEventListener('beforeunload', () => {
  if (sudokuGame && sudokuGame.timer) clearInterval(sudokuGame.timer);
  if (memoryState.timer) clearInterval(memoryState.timer);
});


document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('arcadia_username');
  if (user) {
  
    loginContainer.style.display = 'none';
    mainContainer.style.display = '';
    welcomeWrapper.style.display = '';
    document.getElementById('gameSelection').style.display = 'grid';
    playerNameSpan.textContent = user;
    logoutBtn.style.display = 'block';
  } else {
   
    loginContainer.style.display = '';
    mainContainer.style.display = 'none';
  }

 
  document.getElementById('solutionToggle').style.display = 'none';
});