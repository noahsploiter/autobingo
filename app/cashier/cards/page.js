"use client";

import { useState, useEffect } from "react";
import { Button, Modal, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

export default function CardsPage() {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch cards from JSON/API/localStorage (in that priority)
  useEffect(() => {
    const fetchCards = async () => {
      const params = new URLSearchParams(window.location.search);
      const limitParam = parseInt(params.get("limit") || "0", 10);
      try {
        // 1) Try static JSON first
        const resStatic = await fetch("/cards.json", { cache: "no-store" });
        if (resStatic.ok) {
          const json = await resStatic.json();
          if (Array.isArray(json.cards) && json.cards.length > 0) {
            // Shape flat format into display-friendly structure
            const shaped = json.cards.map((c, idx) => ({
              _id: c.cardId ? `static-${c.cardId}` : `static-${idx + 1}`,
              cardNumber: c.cardId ? Number(c.cardId) : idx + 1,
              numbers: {
                B: [c.b1, c.b2, c.b3, c.b4, c.b5],
                I: [c.i1, c.i2, c.i3, c.i4, c.i5],
                N: [c.n1, c.n2, c.n4, c.n5], // FREE handled in UI
                G: [c.g1, c.g2, c.g3, c.g4, c.g5],
                O: [c.o1, c.o2, c.o3, c.o4, c.o5],
              },
            }));
            const sorted = shaped.sort((a, b) => a.cardNumber - b.cardNumber);
            setCards(limitParam ? sorted.slice(0, limitParam) : sorted);
            return;
          }
        }

        // 2) Try API
        const response = await fetch("/api/cards");
        const data = await response.json();
        if (
          data.success &&
          Array.isArray(data.cards) &&
          data.cards.length > 0
        ) {
          const sorted = data.cards.sort((a, b) => a.cardNumber - b.cardNumber);
          setCards(limitParam ? sorted.slice(0, limitParam) : sorted);
          return;
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
        // 3) Fall back to localStorage if present
        try {
          const local = localStorage.getItem("localCards");
          if (local) {
            const localCards = JSON.parse(local);
            const shaped = localCards.map((c, idx) => ({
              _id: `local-${idx}`,
              cardNumber: idx + 1,
              numbers: c, // this is {B,I,N,G,O}
            }));
            const sorted = shaped.sort((a, b) => a.cardNumber - b.cardNumber);
            setCards(limitParam ? sorted.slice(0, limitParam) : sorted);
            return;
          }
        } catch (e) {
          // ignore parse errors
        }
        message.error("Failed to load cards");
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  const handleCardClick = (card) => {
    const nums = card?.numbers;
    // Back-compat: handle old shape (array of 15)
    let bingoCard;
    if (Array.isArray(nums)) {
      bingoCard = {
        B: [nums[0], nums[5], nums[10]],
        I: [nums[1], nums[6], nums[11]],
        N: [nums[2], nums[7], "FREE", nums[12]],
        G: [nums[3], nums[8], nums[13]],
        O: [nums[4], nums[9], nums[14]],
      };
    } else if (nums && nums.B && nums.I && nums.N && nums.G && nums.O) {
      bingoCard = {
        B: nums.B,
        I: nums.I,
        N: [nums.N[0], nums.N[1], "FREE", nums.N[2], nums.N[3]],
        G: nums.G,
        O: nums.O,
      };
    } else {
      message.error("This card has an unexpected format.");
      return;
    }
    setSelectedCard({ index: card.cardNumber, numbers: bingoCard });
    setIsModalVisible(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/cashier")}
                className="mr-4"
              />
              <h1 className="text-2xl font-semibold text-gray-900">
                Cartela List
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          {loading ? (
            <div className="text-center py-8">Loading cards...</div>
          ) : cards.length === 0 ? (
            <div className="text-center py-8">No cards generated yet.</div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
              {cards.map((card) => (
                <Button
                  key={card._id}
                  onClick={() => handleCardClick(card)}
                  className="h-12 text-lg font-medium"
                >
                  {card.cardNumber}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Card View Modal */}
        <Modal
          title={`Cartela ${selectedCard?.index}`}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={400}
        >
          {selectedCard && (
            <div className="p-4">
              <div className="grid grid-cols-5 gap-4 text-center">
                {/* BINGO Header */}
                {["B", "I", "N", "G", "O"].map((letter) => (
                  <div key={letter} className="text-xl font-bold text-blue-600">
                    {letter}
                  </div>
                ))}

                {/* Numbers */}
                {[0, 1, 2, 3, 4].map((row) => (
                  <>
                    <div className="h-12 flex items-center justify-center bg-blue-50 rounded">
                      {selectedCard.numbers.B[row]}
                    </div>
                    <div className="h-12 flex items-center justify-center bg-blue-50 rounded">
                      {selectedCard.numbers.I[row]}
                    </div>
                    <div className="h-12 flex items-center justify-center bg-blue-50 rounded">
                      {selectedCard.numbers.N[row] || "FREE"}
                    </div>
                    <div className="h-12 flex items-center justify-center bg-blue-50 rounded">
                      {selectedCard.numbers.G[row]}
                    </div>
                    <div className="h-12 flex items-center justify-center bg-blue-50 rounded">
                      {selectedCard.numbers.O[row]}
                    </div>
                  </>
                ))}
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
