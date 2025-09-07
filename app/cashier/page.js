"use client";

import { Button, message, Select, Dropdown, Modal, InputNumber } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  BarChartOutlined,
  SettingOutlined,
  CheckOutlined,
  PrinterOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CashierPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [betAmount, setBetAmount] = useState(() => {
    try {
      return Number(localStorage.getItem("betAmount")) || 10;
    } catch {
      return 10;
    }
  });
  const [houseCut, setHouseCut] = useState(() => {
    try {
      return Number(localStorage.getItem("houseCut")) || 15;
    } catch {
      return 15;
    }
  });
  const [gamePattern, setGamePattern] = useState(() => {
    try {
      return localStorage.getItem("gamePattern") || "singleLine";
    } catch {
      return "singleLine";
    }
  });
  const [generatedCards, setGeneratedCards] = useState([]);
  const [staticCards, setStaticCards] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [numberOfCards, setNumberOfCards] = useState(1);
  const [totalStaticCards, setTotalStaticCards] = useState(0);
  const [visibleCardLimit, setVisibleCardLimit] = useState(100);
  const [shopBalance, setShopBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(false);
  const [insufficientBalanceModal, setInsufficientBalanceModal] =
    useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);

  // Fetch count from static cards.json so we can cap the limit
  useEffect(() => {
    const loadCount = async () => {
      try {
        const res = await fetch("/cards.json", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.cards)) {
          const max = Math.min(500, json.cards.length);
          setTotalStaticCards(max);
          setVisibleCardLimit((prev) => Math.min(prev, max));
          const shaped = json.cards
            .map((c, idx) => ({
              id: c.cardId ? Number(c.cardId) : idx + 1,
              numbers: [
                c.b1,
                c.b2,
                c.b3,
                c.b4,
                c.b5,
                c.i1,
                c.i2,
                c.i3,
                c.i4,
                c.i5,
                c.n1,
                c.n2,
                c.n4,
                c.n5,
                c.g1,
                c.g2,
                c.g3,
                c.g4,
                c.g5,
                c.o1,
                c.o2,
                c.o3,
                c.o4,
                c.o5,
              ],
            }))
            .sort((a, b) => a.id - b.id);
          setStaticCards(shaped);
        }
      } catch {}
    };
    loadCount();
  }, []);

  // Fetch shop balance
  useEffect(() => {
    const fetchShopBalance = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/shops/${user.id}`);
          if (response.ok) {
            const { data } = await response.json();
            setShopBalance(data.balance || 0);
          }
        } catch (error) {
          console.error("Error fetching shop balance:", error);
        }
      }
    };
    fetchShopBalance();
  }, [user?.id]);

  // Persist bet/houseCut/pattern immediately so the game reads correct values
  useEffect(() => {
    try {
      localStorage.setItem("betAmount", betAmount.toString());
      localStorage.setItem("gameBet", betAmount.toString());
    } catch {}
  }, [betAmount]);

  useEffect(() => {
    try {
      localStorage.setItem("houseCut", houseCut.toString());
      localStorage.setItem("gameHouseCut", houseCut.toString());
    } catch {}
  }, [houseCut]);

  useEffect(() => {
    try {
      localStorage.setItem("gamePattern", gamePattern);
    } catch {}
  }, [gamePattern]);

  // Generate bet amount options from 10 to 100 in increments of 5
  const betOptions = Array.from({ length: 19 }, (_, i) => ({
    value: 10 + i * 5,
    label: `${10 + i * 5} ETB`,
  }));

  // Generate house cut options from 5 to 50 in increments of 5
  const houseCutOptions = Array.from({ length: 10 }, (_, i) => ({
    value: 5 + i * 5,
    label: `${5 + i * 5}%`,
  }));

  const showGenerateModal = () => {
    setNumberOfCards(1);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const generateCardNumbers = async () => {
    if (numberOfCards < 1 || numberOfCards > 300) {
      message.error("Please enter a number between 1 and 300");
      return;
    }

    const cards = [];
    const seen = new Set();

    const generateColumn = (min, max, count) => {
      const set = new Set();
      while (set.size < count) {
        set.add(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      return Array.from(set).sort((a, b) => a - b);
    };

    for (let i = 0; i < numberOfCards; i++) {
      let attempt = 0;
      let card;
      let key;
      do {
        const B = generateColumn(1, 15, 5);
        const I = generateColumn(16, 30, 5);
        const N = generateColumn(31, 45, 4);
        const G = generateColumn(46, 60, 5);
        const O = generateColumn(61, 75, 5);
        card = { B, I, N, G, O };
        key = [...B, ...I, ...N, ...G, ...O].join("-");
        attempt++;
        if (attempt > 1000) {
          message.error(
            "Could not generate enough unique cards. Please try a smaller number."
          );
          return;
        }
      } while (seen.has(key));
      seen.add(key);
      cards.push(card);
    }

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cards,
          betAmount,
          houseCut,
          gamePattern,
          shopId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save a local copy as well so cards are visible even if API fetch fails
        try {
          localStorage.setItem("localCards", JSON.stringify(cards));
        } catch {}
        setGeneratedCards(cards);
        setIsModalVisible(false);
        message.success(
          `Generated and saved ${numberOfCards} unique bingo cards successfully!`
        );
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error saving cards:", error);
      // Fallback to local storage
      try {
        localStorage.setItem("localCards", JSON.stringify(cards));
        setGeneratedCards(cards);
        setIsModalVisible(false);
        message.success(
          `Generated ${numberOfCards} unique cards locally (not saved to DB).`
        );
      } catch (e) {
        message.error(
          error.message || "Failed to save generated cards. Please try again."
        );
        setGeneratedCards([]);
      }
    }
  };

  const handleStartGame = async () => {
    if (selectedCardIds.length < 3) {
      message.warning("Please select at least 3 cards to start the game");
      return;
    }

    // Check if shop has sufficient balance
    const totalBetAmount = betAmount * selectedCardIds.length;
    if (shopBalance < totalBetAmount) {
      setRequiredAmount(totalBetAmount);
      setInsufficientBalanceModal(true);
      return;
    }

    try {
      // Create game session in database
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          betAmount,
          houseCut,
          cardCount: selectedCardIds.length,
          gamePattern,
          shopId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store game session ID for later updates
        localStorage.setItem("currentGameSessionId", data.gameSessionId);

        // Persist selection and game settings (IDs for selected cards)
        localStorage.setItem("selectedCards", JSON.stringify(selectedCardIds));
        localStorage.setItem("gameBet", betAmount.toString());
        localStorage.setItem("gameHouseCut", houseCut.toString());
        localStorage.setItem("gamePattern", gamePattern);

        // Update local balance if returned from API
        if (data.newBalance !== undefined) {
          setShopBalance(data.newBalance);
        }

        // Navigate to game page
        router.push("/game");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error creating game session:", error);
      message.error("Failed to start game. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Cashier Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              {/* Shop Balance Display */}
              <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <span className="text-green-700 font-medium mr-2">
                  Balance:
                </span>
                <span className="text-green-800 font-bold text-lg">
                  {showBalance
                    ? `ETB ${shopBalance.toLocaleString()}`
                    : "ETB " +
                      "****".repeat(
                        Math.ceil(shopBalance.toString().length / 4)
                      )}
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={
                    showBalance ? <EyeInvisibleOutlined /> : <EyeOutlined />
                  }
                  onClick={() => setShowBalance(!showBalance)}
                  className="ml-2 text-green-600 hover:text-green-700"
                />
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-gray-700">Bet Amount:</span>
                <Select
                  value={betAmount}
                  onChange={setBetAmount}
                  options={betOptions}
                  style={{ width: 120 }}
                  className="text-right"
                />
              </div>
              <Dropdown
                menu={{
                  items: houseCutOptions.map((option) => ({
                    key: option.value,
                    label: (
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {option.value === houseCut && (
                          <CheckOutlined className="text-blue-500" />
                        )}
                      </div>
                    ),
                    onClick: () => setHouseCut(option.value),
                  })),
                }}
                trigger={["click"]}
              >
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full"
                />
              </Dropdown>
              <Select
                value={gamePattern}
                onChange={(val) => {
                  setGamePattern(val);
                  try {
                    localStorage.setItem("gamePattern", val);
                  } catch {}
                }}
                options={[
                  { value: "singleLine", label: "Single Line" },
                  { value: "doubleLine", label: "Double Line" },
                  { value: "tripleLine", label: "Triple Line" },
                  { value: "tPattern", label: "T Pattern" },
                  { value: "fourCorners", label: "Four Corners" },
                  { value: "square", label: "Square Pattern" },
                  { value: "fullHouse", label: "Full House" },
                  { value: "diamond", label: "Diamond" },
                  { value: "insideDiamond", label: "Inside Diamond" },
                  { value: "singleOrDiamond", label: "SingleLine or Diamond" },
                  { value: "all", label: "All Patterns" },
                ]}
                style={{ width: 200 }}
              />
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() => router.push("/cashier/reports")}
              >
                Reports
              </Button>
              <div className="flex items-center text-gray-600">
                <UserOutlined className="mr-2" />
                <span>{user?.username || "Loading..."}</span>
              </div>
              <Button
                type="text"
                danger
                icon={<LogoutOutlined />}
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Game Controls */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Bingo Card Generator
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-3">
                <Button
                  type="primary"
                  size="large"
                  className="h-12"
                  onClick={() =>
                    router.push(`/cashier/cards?limit=${visibleCardLimit}`)
                  }
                >
                  View Cards ({visibleCardLimit})
                </Button>
                <Button
                  size="large"
                  onClick={() =>
                    setVisibleCardLimit((prev) =>
                      Math.min(
                        500,
                        Math.min(totalStaticCards || 500, prev + 50)
                      )
                    )
                  }
                  disabled={
                    visibleCardLimit >= Math.min(500, totalStaticCards || 500)
                  }
                >
                  Add 50 more
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-gray-600 mt-4">
            Default shows 100 cards. Use "Add 50 more" to increase up to 500 (or
            available).
          </div>
          {/* Inline cards selection */}
          <div className="mt-6">
            {staticCards.length > 0 ? (
              <>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                  {staticCards.slice(0, visibleCardLimit).map((c) => {
                    const isSelected = selectedCardIds.includes(c.id);
                    return (
                      <Button
                        key={c.id}
                        type={isSelected ? "primary" : "default"}
                        className="h-12 text-lg font-medium"
                        onClick={() => {
                          setSelectedCardIds((prev) =>
                            prev.includes(c.id)
                              ? prev.filter((x) => x !== c.id)
                              : [...prev, c.id]
                          );
                        }}
                      >
                        {c.id}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-6">
                  <div className="flex items-center gap-4">
                    <div className="text-gray-700">
                      Selected:{" "}
                      <span className="font-semibold">
                        {selectedCardIds.length}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        onClick={() => {
                          const allIds = staticCards
                            .slice(0, visibleCardLimit)
                            .map((c) => c.id);
                          setSelectedCardIds(allIds);
                        }}
                        disabled={selectedCardIds.length === visibleCardLimit}
                      >
                        Select All
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setSelectedCardIds([])}
                        disabled={selectedCardIds.length === 0}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleStartGame}
                    disabled={selectedCardIds.length < 3}
                  >
                    Start Game with {selectedCardIds.length} card(s)
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-gray-500">Loading cards...</div>
            )}
          </div>
        </div>
      </main>

      {/* Insufficient Balance Modal */}
      <Modal
        title={null}
        open={insufficientBalanceModal}
        onCancel={() => setInsufficientBalanceModal(false)}
        footer={null}
        centered
        width={500}
        className="insufficient-balance-modal"
      >
        <div className="text-center py-6">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Insufficient Balance
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            You don't have enough balance to start this game.
          </p>

          {/* Balance Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <div className="text-gray-500 mb-1">Required Amount:</div>
                <div className="font-bold text-red-600 text-lg">
                  ETB {requiredAmount.toLocaleString()}
                </div>
              </div>
              <div className="text-left">
                <div className="text-gray-500 mb-1">Current Balance:</div>
                <div className="font-bold text-gray-900 text-lg">
                  ETB {shopBalance.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-gray-500 mb-1">Shortfall:</div>
                <div className="font-bold text-red-600 text-xl">
                  ETB {(requiredAmount - shopBalance).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              type="default"
              size="large"
              onClick={() => setInsufficientBalanceModal(false)}
              className="px-8"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                setInsufficientBalanceModal(false);
                // You could add a contact admin function here
                message.info(
                  "Please contact your administrator to top up your balance."
                );
              }}
              className="px-8 bg-blue-600 hover:bg-blue-700"
            >
              Contact Admin
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-400 mt-4">
            Contact your system administrator to add funds to your account
          </p>
        </div>
      </Modal>
    </div>
  );
}
