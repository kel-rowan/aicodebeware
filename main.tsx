"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "/components/ui/button";

// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 150;
const BULLET_SPEED = 3;
const ENEMY_SHOOT_INTERVAL = 1000;

// Types
type Position = { x: number; y: number };
type Direction = { x: number; y: number };
type Bullet = Position & { id: number; direction: Direction };
type Enemy = Position & { id: number };

export default function SnakeBulletHell() {
  // Game state
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Refs for consistent state in callbacks
  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const bulletsRef = useRef(bullets);
  const enemiesRef = useRef(enemies);
  const gameOverRef = useRef(gameOver);
  
  // Update refs when state changes
  useEffect(() => {
    directionRef.current = direction;
    snakeRef.current = snake;
    bulletsRef.current = bullets;
    enemiesRef.current = enemies;
    gameOverRef.current = gameOver;
  }, [direction, snake, bullets, enemies, gameOver]);

  // Generate random position
  const getRandomPosition = useCallback((): Position => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(getRandomPosition());
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setGameOver(false);
    setLevel(1);
    setGameStarted(true);
    
    // Create initial enemies
    const initialEnemies: Enemy[] = [];
    for (let i = 0; i < level; i++) {
      initialEnemies.push({
        ...getRandomPosition(),
        id: Date.now() + i
      });
    }
    setEnemies(initialEnemies);
  }, [getRandomPosition, level]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      
      switch (e.key) {
        case "ArrowUp":
          if (directionRef.current.y === 0) {
            setDirection({ x: 0, y: -1 });
          }
          break;
        case "ArrowDown":
          if (directionRef.current.y === 0) {
            setDirection({ x: 0, y: 1 });
          }
          break;
        case "ArrowLeft":
          if (directionRef.current.x === 0) {
            setDirection({ x: -1, y: 0 });
          }
          break;
        case "ArrowRight":
          if (directionRef.current.x === 0) {
            setDirection({ x: 1, y: 0 });
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted]);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameOverRef.current || !gameStarted) return;
    
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y
      };

      // Check wall collision
      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];
      
      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setFood(getRandomPosition());
        setScore(prev => prev + 10);
        
        // Level up every 50 points
        if ((score + 10) % 50 === 0) {
          setLevel(prev => prev + 1);
        }
        
        return newSnake;
      }
      
      // Remove tail if no food eaten
      return newSnake.slice(0, -1);
    });
  }, [food, getRandomPosition, score, gameStarted]);

  // Move bullets
  const moveBullets = useCallback(() => {
    if (gameOverRef.current || !gameStarted) return;
    
    setBullets(prevBullets => {
      return prevBullets
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.direction.x * BULLET_SPEED,
          y: bullet.y + bullet.direction.y * BULLET_SPEED
        }))
        .filter(bullet => 
          bullet.x >= 0 && 
          bullet.x < GRID_SIZE && 
          bullet.y >= 0 && 
          bullet.y < GRID_SIZE
        );
    });
  }, [gameStarted]);

  // Check bullet-snake collision
  const checkBulletCollision = useCallback(() => {
    if (gameOverRef.current || !gameStarted) return;
    
    const head = snakeRef.current[0];
    
    const hit = bulletsRef.current.some(bullet => 
      Math.abs(bullet.x - head.x) < 1 && 
      Math.abs(bullet.y - head.y) < 1
    );
    
    if (hit) {
      setGameOver(true);
    }
  }, [gameStarted]);

  // Enemy shooting
  const enemyShoot = useCallback(() => {
    if (gameOverRef.current || !gameStarted) return;
    
    const head = snakeRef.current[0];
    
    setBullets(prevBullets => {
      const newBullets = [...prevBullets];
      let id = Date.now();
      
      enemiesRef.current.forEach(enemy => {
        // Calculate direction to snake head
        const dx = head.x - enemy.x;
        const dy = head.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          newBullets.push({
            id: id++,
            x: enemy.x,
            y: enemy.y,
            direction: {
              x: dx / distance,
              y: dy / distance
            }
          });
        }
      });
      
      return newBullets;
    });
  }, [gameStarted]);

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;
    
    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    const bulletInterval = setInterval(moveBullets, 100);
    const collisionInterval = setInterval(checkBulletCollision, 50);
    const shootInterval = setInterval(enemyShoot, ENEMY_SHOOT_INTERVAL / level);
    
    return () => {
      clearInterval(gameInterval);
      clearInterval(bulletInterval);
      clearInterval(collisionInterval);
      clearInterval(shootInterval);
    };
  }, [moveSnake, moveBullets, checkBulletCollision, enemyShoot, gameStarted, level]);

  // Add new enemies when level increases
  useEffect(() => {
    if (!gameStarted || level === 1) return;
    
    setEnemies(prev => [
      ...prev,
      {
        ...getRandomPosition(),
        id: Date.now()
      }
    ]);
  }, [level, gameStarted, getRandomPosition]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-green-400">Snake Bullet Hell</h1>
          <div className="flex gap-4">
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-gray-400">Score: </span>
              <span className="font-bold text-yellow-400">{score}</span>
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-gray-400">Level: </span>
              <span className="font-bold text-blue-400">{level}</span>
            </div>
          </div>
        </div>
        
        {!gameStarted ? (
          <div className="flex flex-col items-center justify-center h-96 bg-gray-800/50 rounded-xl border-2 border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-4">Snake Bullet Hell</h2>
            <p className="text-gray-300 text-center mb-6 max-w-md">
              Control the snake with arrow keys. Avoid bullets from enemies and don't hit walls!
              Eat food to grow and earn points. Every 50 points advances you to the next level.
            </p>
            <Button 
              onClick={initGame}
              className="px-8 py-3 text-lg bg-green-600 hover:bg-green-700"
            >
              Start Game
            </Button>
          </div>
        ) : (
          <>
            {gameOver ? (
              <div className="flex flex-col items-center justify-center h-96 bg-gray-800/50 rounded-xl border-2 border-red-500 p-8">
                <h2 className="text-3xl font-bold text-red-500 mb-4">Game Over!</h2>
                <p className="text-xl mb-2">Final Score: <span className="font-bold text-yellow-400">{score}</span></p>
                <p className="text-lg mb-6">Level Reached: <span className="font-bold text-blue-400">{level}</span></p>
                <Button 
                  onClick={initGame}
                  className="px-8 py-3 text-lg bg-green-600 hover:bg-green-700"
                >
                  Play Again
                </Button>
              </div>
            ) : (
              <div className="relative bg-gray-800 rounded-xl border-2 border-gray-700 overflow-hidden">
                <div 
                  className="grid gap-0"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                    width: GRID_SIZE * CELL_SIZE,
                    height: GRID_SIZE * CELL_SIZE
                  }}
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                    const x = index % GRID_SIZE;
                    const y = Math.floor(index / GRID_SIZE);
                    const isSnake = snake.some(segment => segment.x === x && segment.y === y);
                    const isHead = snake[0].x === x && snake[0].y === y;
                    const isFood = food.x === x && food.y === y;
                    
                    return (
                      <div
                        key={index}
                        className={`border border-gray-700 ${
                          isSnake 
                            ? isHead 
                              ? "bg-green-500" 
                              : "bg-green-400"
                            : isFood 
                              ? "bg-red-500" 
                              : "bg-gray-900"
                        }`}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      />
                    );
                  })}
                </div>
                
                {/* Render bullets */}
                {bullets.map(bullet => (
                  <div
                    key={bullet.id}
                    className="absolute rounded-full bg-yellow-400"
                    style={{
                      left: bullet.x * CELL_SIZE,
                      top: bullet.y * CELL_SIZE,
                      width: CELL_SIZE / 2,
                      height: CELL_SIZE / 2,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                ))}
                
                {/* Render enemies */}
                {enemies.map(enemy => (
                  <div
                    key={enemy.id}
                    className="absolute rounded-full bg-red-600 border-2 border-red-400"
                    style={{
                      left: enemy.x * CELL_SIZE,
                      top: enemy.y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        <div className="mt-6 text-gray-400 text-sm">
          <p className="text-center">
            Use <span className="font-bold">Arrow Keys</span> to move the snake. 
            Avoid <span className="text-yellow-400">bullets</span> from <span className="text-red-500">enemies</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
