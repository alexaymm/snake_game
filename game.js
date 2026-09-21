(() => {
  const CELL_SIZE = 20;
  const GRID_COLS = 30;
  const GRID_ROWS = 30;
  const INITIAL_HALF_SIZE = 5; // starting playable area is (2*5+1) = 11 cells wide/tall
  const EXPAND_STEP = 2; // cells added on each side per expansion
  const FOODS_PER_EXPANSION = 3;
  const SPEEDS_MS = {
    beginner: 200,
    normal: 150,
    expert: 120,
  };

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = GRID_COLS * CELL_SIZE;
  canvas.height = GRID_ROWS * CELL_SIZE;

  const scoreEl = document.getElementById("score");
  const untilExpandEl = document.getElementById("until-expand");
  const bestScoreEl = document.getElementById("best-score");
  const overlayEl = document.getElementById("overlay");
  const overlayTitleEl = document.getElementById("overlay-title");
  const overlayMessageEl = document.getElementById("overlay-message");
  const restartBtn = document.getElementById("restart-btn");
  const difficultySelect = document.getElementById("difficulty");

  const DIFFICULTY_KEY = "snake-difficulty";
  const savedDifficulty = localStorage.getItem(DIFFICULTY_KEY);
  if (savedDifficulty && SPEEDS_MS[savedDifficulty]) {
    difficultySelect.value = savedDifficulty;
  }

  const BEST_SCORE_KEY = "snake-best-score";
  let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
  bestScoreEl.textContent = bestScore;

  const DIRS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
  };

  let snake, direction, nextDirection, food, boundary, score, foodsEaten;
  let running, loopHandle;

  function centerBoundary(halfSize) {
    const cx = Math.floor(GRID_COLS / 2);
    const cy = Math.floor(GRID_ROWS / 2);
    return clampBoundary({
      minX: cx - halfSize,
      maxX: cx + halfSize,
      minY: cy - halfSize,
      maxY: cy + halfSize,
    });
  }

  function clampBoundary(b) {
    return {
      minX: Math.max(0, b.minX),
      maxX: Math.min(GRID_COLS - 1, b.maxX),
      minY: Math.max(0, b.minY),
      maxY: Math.min(GRID_ROWS - 1, b.maxY),
    };
  }

  function isFullyExpanded(b) {
    return (
      b.minX === 0 &&
      b.minY === 0 &&
      b.maxX === GRID_COLS - 1 &&
      b.maxY === GRID_ROWS - 1
    );
  }

  function expandBoundary(b) {
    return clampBoundary({
      minX: b.minX - EXPAND_STEP,
      maxX: b.maxX + EXPAND_STEP,
      minY: b.minY - EXPAND_STEP,
      maxY: b.maxY + EXPAND_STEP,
    });
  }

  function resetGame() {
    boundary = centerBoundary(INITIAL_HALF_SIZE);
    const startX = Math.floor((boundary.minX + boundary.maxX) / 2);
    const startY = Math.floor((boundary.minY + boundary.maxY) / 2);
    snake = [
      { x: startX - 1, y: startY },
      { x: startX, y: startY },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = direction;
    score = 0;
    foodsEaten = 0;
    running = true;
    placeFood();
    updateHud();
    overlayEl.classList.add("hidden");
    if (loopHandle) clearInterval(loopHandle);
    const tickMs = SPEEDS_MS[difficultySelect.value] || SPEEDS_MS.normal;
    loopHandle = setInterval(tick, tickMs);
  }

  function placeFood() {
    const freeCells = [];
    for (let x = boundary.minX; x <= boundary.maxX; x++) {
      for (let y = boundary.minY; y <= boundary.maxY; y++) {
        if (!snake.some((seg) => seg.x === x && seg.y === y)) {
          freeCells.push({ x, y });
        }
      }
    }
    if (freeCells.length === 0) {
      endGame(true);
      return;
    }
    food = freeCells[Math.floor(Math.random() * freeCells.length)];
  }

  function updateHud() {
    scoreEl.textContent = score;
    const remaining = FOODS_PER_EXPANSION - (foodsEaten % FOODS_PER_EXPANSION);
    untilExpandEl.textContent = isFullyExpanded(boundary)
      ? "Máximo"
      : remaining;
  }

  function tick() {
    if (!running) return;
    direction = nextDirection;
    const head = snake[snake.length - 1];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    if (
      newHead.x < boundary.minX ||
      newHead.x > boundary.maxX ||
      newHead.y < boundary.minY ||
      newHead.y > boundary.maxY
    ) {
      endGame(false, "¡Chocaste contra el borde!");
      return;
    }

    if (snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      endGame(false, "¡Te mordiste a ti mismo!");
      return;
    }

    snake.push(newHead);

    if (newHead.x === food.x && newHead.y === food.y) {
      score += 10;
      foodsEaten += 1;
      if (foodsEaten % FOODS_PER_EXPANSION === 0 && !isFullyExpanded(boundary)) {
        boundary = expandBoundary(boundary);
      }
      placeFood();
    } else {
      snake.shift();
    }

    updateHud();
    render();
  }

  function endGame(won, message) {
    running = false;
    clearInterval(loopHandle);
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
      bestScoreEl.textContent = bestScore;
    }
    overlayTitleEl.textContent = won ? "¡Ganaste!" : "¡Juego terminado!";
    overlayMessageEl.textContent =
      message ||
      (won
        ? "Llenaste todo el tablero."
        : "Inténtalo de nuevo.");
    overlayMessageEl.textContent += ` Puntaje final: ${score}.`;
    overlayEl.classList.remove("hidden");
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dim area outside the current playable boundary
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Playable area
    const bx = boundary.minX * CELL_SIZE;
    const by = boundary.minY * CELL_SIZE;
    const bw = (boundary.maxX - boundary.minX + 1) * CELL_SIZE;
    const bh = (boundary.maxY - boundary.minY + 1) * CELL_SIZE;
    ctx.fillStyle = "#11111b";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#45475a";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // Food
    ctx.fillStyle = "#f38ba8";
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Snake
    snake.forEach((seg, i) => {
      const isHead = i === snake.length - 1;
      ctx.fillStyle = isHead ? "#a6e3a1" : "#74c7ec";
      ctx.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });
  }

  window.addEventListener("keydown", (e) => {
    const dir = DIRS[e.key];
    if (!dir) return;
    e.preventDefault();
    // Prevent reversing directly into itself
    if (dir.x === -direction.x && dir.y === -direction.y) return;
    nextDirection = dir;
  });

  restartBtn.addEventListener("click", resetGame);

  difficultySelect.addEventListener("change", () => {
    localStorage.setItem(DIFFICULTY_KEY, difficultySelect.value);
    resetGame();
  });

  resetGame();
  render();
})();
