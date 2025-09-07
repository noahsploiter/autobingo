"use client";

import { useState, useEffect, Suspense } from "react";
import { Button, Input, Slider, Modal, message } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleFilled, ArrowLeftOutlined } from "@ant-design/icons";
import { calculateGameAmounts } from "../lib/calculations";
import { useAuth } from "../context/AuthContext";

const fetchGameStats = async () => {
  try {
    const response = await fetch("/api/stats");
    if (!response.ok) throw new Error("Failed to fetch stats");
    return await response.json();
  } catch (error) {
    console.error("Error fetching game stats:", error);
    return null;
  }
};

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Game State
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [selectedCardCount, setSelectedCardCount] = useState(0);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(2); // seconds
  const [winners, setWinners] = useState([]);
  const [cardsData, setCardsData] = useState([]); // selected cards with numbers
  const [winnerCard, setWinnerCard] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [shopName, setShopName] = useState("");
  const [betAmount, setBetAmount] = useState(0);
  const [houseCut, setHouseCut] = useState(0);
  const [gamePattern, setGamePattern] = useState("singleLine");
  const [currentGameSessionId, setCurrentGameSessionId] = useState(null);
  const [gameNumber, setGameNumber] = useState(0);

  const calculateWinAmount = () => {
    // Prefer card count if available; fallback to numbers length for legacy flow
    const units =
      selectedCardCount > 0 ? selectedCardCount : selectedNumbers.length;
    const totalBet = betAmount * units;
    return Math.floor(totalBet * (1 - houseCut / 100));
  };

  // Fetch shop data
  useEffect(() => {
    const fetchShopData = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/shops/${user.id}`);
          if (response.ok) {
            const { data } = await response.json();
            setShopName(data.name);
          }
        } catch (error) {
          console.error("Error fetching shop data:", error);
        }
      }
    };
    fetchShopData();
  }, [user?.id]);

  // Initialize game with localStorage parameters
  useEffect(() => {
    try {
      const numbersRaw = localStorage.getItem("gameNumbers");
      const selectedCardsRaw = localStorage.getItem("selectedCards");
      const betRaw = localStorage.getItem("gameBet");
      const cutRaw = localStorage.getItem("gameHouseCut");

      let parsedNumbers = [];
      if (numbersRaw) {
        try {
          parsedNumbers = JSON.parse(numbersRaw) || [];
        } catch {}
      }

      let parsedSelectedCards = [];
      if (selectedCardsRaw) {
        try {
          parsedSelectedCards = JSON.parse(selectedCardsRaw) || [];
        } catch {}
      }

      const hasSelection =
        (parsedNumbers && parsedNumbers.length > 0) ||
        (parsedSelectedCards && parsedSelectedCards.length > 0);
      const betVal = Number(betRaw) || 10;
      const cutVal = Number(cutRaw) || 15;
      const patternVal = localStorage.getItem("gamePattern") || "singleLine";
      const gameSessionId = localStorage.getItem("currentGameSessionId");

      if (hasSelection) {
        setSelectedNumbers(parsedNumbers); // keep numbers if provided; otherwise empty
        setBetAmount(betVal);
        setHouseCut(cutVal);
        setSelectedCardCount(
          Array.isArray(parsedSelectedCards) ? parsedSelectedCards.length : 0
        );
        setGamePattern(patternVal);
        setCurrentGameSessionId(gameSessionId);

        // Fetch and set game number
        fetchGameNumber();

        // Load selected cards' data from static JSON for winner detection
        fetch("/cards.json", { cache: "no-store" })
          .then((res) => res.json())
          .then((json) => {
            if (!json || !Array.isArray(json.cards)) return;
            const byId = new Map();
            json.cards.forEach((c) => {
              const id = c.cardId ? Number(c.cardId) : null;
              if (id) byId.set(id, c);
            });
            const cards = parsedSelectedCards
              .map((id) => byId.get(Number(id)))
              .filter(Boolean)
              .map((c) => ({
                id: Number(c.cardId),
                B: [c.b1, c.b2, c.b3, c.b4, c.b5],
                I: [c.i1, c.i2, c.i3, c.i4, c.i5],
                N: [c.n1, c.n2, 0, c.n4, c.n5],
                G: [c.g1, c.g2, c.g3, c.g4, c.g5],
                O: [c.o1, c.o2, c.o3, c.o4, c.o5],
              }));
            setCardsData(cards);
          })
          .catch(() => {});
      } else {
        // Don't redirect; start with defaults and wait for user to start
        setSelectedNumbers([]);
        setBetAmount(betVal);
        setHouseCut(cutVal);
        setSelectedCardCount(0);
        setGamePattern(patternVal);
        setCurrentGameSessionId(gameSessionId);
      }
    } catch {
      message.error("Failed to initialize game");
      router.push("/cashier");
    }
  }, []);

  // Game loop
  useEffect(() => {
    let timer;
    if (isGameStarted && !isGamePaused) {
      timer = setInterval(() => {
        // Generate a random number that hasn't been drawn yet
        const availableNumbers = Array.from(
          { length: 50 },
          (_, i) => i + 1
        ).filter((num) => !drawnNumbers.includes(num));

        if (availableNumbers.length === 0) {
          setIsGameStarted(false);
          message.info("Game Over - All numbers have been drawn!");
          return;
        }

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const newNumber = availableNumbers[randomIndex];
        setCurrentNumber(newNumber);
        setDrawnNumbers((prev) => [...prev, newNumber]);

        // Check for winners
        checkWinners(newNumber);
      }, gameSpeed * 1000);
    }
    return () => clearInterval(timer);
  }, [isGameStarted, isGamePaused, gameSpeed, drawnNumbers]);

  const checkWinners = (newNumber) => {
    if (!cardsData || cardsData.length === 0) return;
    const called = new Set([...drawnNumbers, newNumber]);
    const isMarked = (n) => n === 0 || called.has(n);

    const gridFor = (card) => [card.B, card.I, card.N, card.G, card.O];

    const getCompletedLines = (g) => {
      const lines = [];
      for (let r = 0; r < 5; r++) {
        let ok = true;
        for (let c = 0; c < 5; c++)
          if (!isMarked(g[c][r])) {
            ok = false;
            break;
          }
        if (ok) lines.push({ type: "row", index: r });
      }
      for (let c = 0; c < 5; c++)
        if (g[c].every(isMarked)) lines.push({ type: "col", index: c });
      if ([0, 1, 2, 3, 4].every((i) => isMarked(g[i][i])))
        lines.push({ type: "diag", index: 0 });
      if ([0, 1, 2, 3, 4].every((i) => isMarked(g[4 - i][i])))
        lines.push({ type: "diag", index: 1 });
      return lines;
    };

    const checkSingleLine = (g) => {
      const lines = getCompletedLines(g);
      return lines.length >= 1
        ? { type: lines[0].type, index: lines[0].index, lines }
        : null;
    };

    const checkDoubleLine = (g) => {
      const lines = getCompletedLines(g);
      return lines.length >= 2 ? { type: "doubleLine", count: 2, lines } : null;
    };

    const checkTripleLine = (g) => {
      const lines = getCompletedLines(g);
      return lines.length >= 3 ? { type: "tripleLine", count: 3, lines } : null;
    };

    const checkFourCorners = (g) => {
      if (
        isMarked(g[0][0]) &&
        isMarked(g[4][0]) &&
        isMarked(g[0][4]) &&
        isMarked(g[4][4])
      )
        return { type: "fourCorners", index: 0 };
      return null;
    };

    const checkFullHouse = (g) => {
      for (let c = 0; c < 5; c++) if (!g[c].every(isMarked)) return null;
      return { type: "fullHouse", index: 0 };
    };

    const checkCard = (card) => {
      const g = gridFor(card);
      switch (gamePattern) {
        case "fourCorners":
          return checkFourCorners(g);
        case "fullHouse":
          return checkFullHouse(g);
        case "doubleLine":
          return checkDoubleLine(g);
        case "tripleLine":
          return checkTripleLine(g);
        case "all":
          return (
            checkSingleLine(g) ||
            checkDoubleLine(g) ||
            checkTripleLine(g) ||
            checkFourCorners(g) ||
            checkFullHouse(g)
          );
        default:
          return checkSingleLine(g);
      }
    };

    for (const card of cardsData) {
      const win = checkCard(card);
      if (win) {
        setIsGameStarted(false);
        setWinnerCard({ card, pattern: win });
        setShowWinnerModal(true);
        message.success(`BINGO! Card ${card.id} wins!`);

        // Update game session as completed
        updateGameSession("completed", card.id, win.type);
        break;
      }
    }
  };

  const updateGameSession = async (
    status,
    winnerCardId = null,
    winningPattern = null
  ) => {
    if (!currentGameSessionId) return;

    try {
      const response = await fetch(`/api/reports/${currentGameSessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          winnerCardId,
          winningPattern,
          completedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error("Failed to update game session");
      }
    } catch (error) {
      console.error("Error updating game session:", error);
    }
  };

  const fetchGameNumber = async () => {
    try {
      const shopId = user?.id;
      const url = shopId
        ? `/api/reports/game-count?shopId=${shopId}`
        : "/api/reports/game-count";

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGameNumber(data.gameCount + 1); // Next game number
        }
      }
    } catch (error) {
      console.error("Error fetching game number:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f2c] p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full">
        {/* Shop Name and Game Number */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#FFD700]">
            {shopName || "Loading..."} Bingo
          </h1>
          {gameNumber > 0 && (
            <div className="text-xl text-[#FFD700] mt-2">
              Game #{gameNumber}
            </div>
          )}
        </div>

        <div className="flex gap-12 items-center justify-center">
          {/* Bingo Board */}
          <div className="grid grid-cols-16 gap-2">
            {/* Headers */}
            <div className="bg-[#FFD700] w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg">
              B
            </div>
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className={`w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg ${
                  drawnNumbers.includes(i + 1)
                    ? "bg-gray-700 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {i + 1}
              </div>
            ))}

            <div className="bg-[#FFD700] w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg">
              I
            </div>
            {[...Array(15)].map((_, i) => (
              <div
                key={i + 16}
                className={`w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg ${
                  drawnNumbers.includes(i + 16)
                    ? "bg-gray-700 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {i + 16}
              </div>
            ))}

            <div className="bg-[#FFD700] w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg">
              N
            </div>
            {[...Array(15)].map((_, i) => (
              <div
                key={i + 31}
                className={`w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg ${
                  drawnNumbers.includes(i + 31)
                    ? "bg-gray-700 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {i + 31}
              </div>
            ))}

            <div className="bg-[#FFD700] w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg">
              G
            </div>
            {[...Array(15)].map((_, i) => (
              <div
                key={i + 46}
                className={`w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg ${
                  drawnNumbers.includes(i + 46)
                    ? "bg-gray-700 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {i + 46}
              </div>
            ))}

            <div className="bg-[#FFD700] w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg">
              O
            </div>
            {[...Array(15)].map((_, i) => (
              <div
                key={i + 61}
                className={`w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg ${
                  drawnNumbers.includes(i + 61)
                    ? "bg-gray-700 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {i + 61}
              </div>
            ))}
          </div>

          {/* Current Number Display */}
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 rounded-full border-4 border-[#FFD700] flex flex-col items-center justify-center bg-[#FFD700]">
              {currentNumber ? (
                <>
                  <div className="text-[#0a0f2c] text-4xl font-bold mb-1">
                    {
                      ["B", "I", "N", "G", "O"][
                        Math.floor((currentNumber - 1) / 15)
                      ]
                    }
                  </div>
                  <div className="text-[#0a0f2c] text-7xl font-bold">
                    {currentNumber}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[#0a0f2c] text-2xl font-bold mb-1">
                    NEXT
                  </div>
                  <div className="text-[#0a0f2c] text-5xl font-bold opacity-50">
                    ?
                  </div>
                </>
              )}
            </div>

            {/* Last Two Numbers */}
            {drawnNumbers.length > 0 && (
              <div className="flex gap-4 mt-4">
                {drawnNumbers
                  .slice(-2)
                  .reverse()
                  .map((number, index) => (
                    <div
                      key={index}
                      className="w-20 h-20 bg-[#FFD700] rounded-lg flex flex-col items-center justify-center"
                    >
                      <div className="text-[#0a0f2c] text-xl font-bold">
                        {
                          ["B", "I", "N", "G", "O"][
                            Math.floor((number - 1) / 15)
                          ]
                        }
                      </div>
                      <div className="text-[#0a0f2c] text-2xl font-bold">
                        {number}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Win Amount Display */}
        <div className="text-center mt-6 mb-4">
          <div className="text-[#FFD700] text-xl mb-1">ደራሽ</div>
          <div className="text-[#FFD700] text-4xl font-bold">
            {calculateWinAmount().toLocaleString()}ETB
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-6 mt-8">
          {!isGameStarted ? (
            <Button
              type="primary"
              size="large"
              onClick={() => setIsGameStarted(true)}
              className="h-16 px-12 text-xl"
            >
              Start Game
            </Button>
          ) : (
            <Button
              size="large"
              onClick={() => setIsGamePaused(!isGamePaused)}
              className="h-16 px-12 text-xl"
            >
              {isGamePaused ? "Resume Game" : "Pause Game"}
            </Button>
          )}
          {isGameStarted && (
            <Button
              danger
              size="large"
              onClick={() => {
                setIsGameStarted(false);
                updateGameSession("completed");
                message.success("Game finished successfully!");
                router.push("/cashier");
              }}
              className="h-16 px-12 text-xl"
            >
              Finish Game
            </Button>
          )}
        </div>

        {/* Game Speed Control */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-center mb-4">
              <h3 className="text-[#FFD700] text-lg font-semibold mb-2">
                Game Speed Control
              </h3>
              <div className="text-[#FFD700] text-2xl font-bold">
                {gameSpeed} {gameSpeed === 1 ? "Second" : "Seconds"}
              </div>
            </div>
            <div className="px-4">
              <Slider
                min={1}
                max={15}
                value={gameSpeed}
                onChange={setGameSpeed}
                trackStyle={{ backgroundColor: "#FFD700" }}
                handleStyle={{
                  borderColor: "#FFD700",
                  backgroundColor: "#FFD700",
                }}
                railStyle={{ backgroundColor: "#4a5568" }}
                tooltip={{
                  formatter: (value) =>
                    `${value} ${value === 1 ? "Second" : "Seconds"}`,
                }}
                disabled={isGameStarted && !isGamePaused}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>1s</span>
                <span>15s</span>
              </div>
            </div>
            {isGameStarted && !isGamePaused && (
              <div className="text-center mt-3">
                <span className="text-yellow-400 text-sm">
                  ⚠️ Pause game to adjust speed
                </span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showWinnerModal && winnerCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            >
              <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border-4 border-[#FFD700]">
                <h3 className="text-3xl font-extrabold mb-6 text-center text-[#0a0f2c]">
                  አሸናፊ: Card {winnerCard.card.id}
                </h3>
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {["B", "I", "N", "G", "O"].map((h) => (
                    <div
                      key={h}
                      className="text-center font-extrabold text-blue-600 text-lg"
                    >
                      {h}
                    </div>
                  ))}
                  {[0, 1, 2, 3, 4].map((r) =>
                    [0, 1, 2, 3, 4].map((c) => {
                      const g = [
                        winnerCard.card.B,
                        winnerCard.card.I,
                        winnerCard.card.N,
                        winnerCard.card.G,
                        winnerCard.card.O,
                      ];
                      const val = g[c][r];
                      const isFree = val === 0;
                      const called = drawnNumbers.includes(val);
                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`h-12 flex items-center justify-center rounded-md font-bold ${
                            called || isFree
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {isFree ? "FREE" : val}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="text-center mb-6">
                  <div className="font-semibold mb-2">
                    Pattern: {winnerCard.pattern.type}{" "}
                    {winnerCard.pattern.type !== "diag"
                      ? winnerCard.pattern.index + 1
                      : ""}
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ደራሽ: ETB {calculateWinAmount().toLocaleString()}
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      // Clear game session data
                      localStorage.removeItem("currentGameSessionId");
                      localStorage.removeItem("selectedCards");
                      router.push("/cashier");
                    }}
                  >
                    Back to Cashier
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function GamePageLoading() {
  return (
    <div className="min-h-screen bg-[#0a0f2c] p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="text-[#FFD700] text-2xl font-bold mb-4">
          Loading Game...
        </div>
        <div className="text-white">Please wait while we prepare your game</div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function GamePage() {
  return (
    <Suspense fallback={<GamePageLoading />}>
      <GamePageContent />
    </Suspense>
  );
}
