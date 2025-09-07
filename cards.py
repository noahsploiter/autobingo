import json
import random
from pathlib import Path

# Output path
OUTPUT = Path(__file__).parent / "public" / "cards.json"

# Change if needed
USER_ID = "67a1cf0050f98d16a51c9551"
NUM_CARDS = 500

def generate_column(min_val: int, max_val: int, count: int) -> list[int]:
    return random.sample(range(min_val, max_val + 1), count)

def generate_one_card() -> dict:
    # Standard Bingo ranges
    B = generate_column(1, 15, 5)
    I = generate_column(16, 30, 5)
    # N has a FREE space in the middle (we'll set n3 = 0)
    N_vals = generate_column(31, 45, 4)
    G = generate_column(46, 60, 5)
    O = generate_column(61, 75, 5)

    # Shuffle inside columns for variety
    random.shuffle(B)
    random.shuffle(I)
    random.shuffle(N_vals)
    random.shuffle(G)
    random.shuffle(O)

    # Build flat structure with FREE at n3
    card = {
        "b1": B[0], "b2": B[1], "b3": B[2], "b4": B[3], "b5": B[4],
        "i1": I[0], "i2": I[1], "i3": I[2], "i4": I[3], "i5": I[4],
        # Place N_vals around the center free space: n1, n2, n3=0, n4, n5
        "n1": N_vals[0], "n2": N_vals[1], "n3": 0, "n4": N_vals[2], "n5": N_vals[3],
        "g1": G[0], "g2": G[1], "g3": G[2], "g4": G[3], "g5": G[4],
        "o1": O[0], "o2": O[1], "o3": O[2], "o4": O[3], "o5": O[4],
        "userId": USER_ID,
    }
    return card

def card_signature(card: dict) -> tuple:
    # Create a uniqueness signature ignoring the FREE cell (n3=0)
    nums = [
        card["b1"], card["b2"], card["b3"], card["b4"], card["b5"],
        card["i1"], card["i2"], card["i3"], card["i4"], card["i5"],
        card["n1"], card["n2"],             card["n4"], card["n5"],
        card["g1"], card["g2"], card["g3"], card["g4"], card["g5"],
        card["o1"], card["o2"], card["o3"], card["o4"], card["o5"],
    ]
    return tuple(sorted(nums))

def main() -> None:
    random.seed()  # system entropy
    cards = []
    seen = set()

    while len(cards) < NUM_CARDS:
        c = generate_one_card()
        sig = card_signature(c)
        if sig in seen:
            continue
        seen.add(sig)
        c["cardId"] = str(len(cards) + 1)
        cards.append(c)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump({"cards": cards}, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(cards)} cards to {OUTPUT}")

if __name__ == "__main__":
    main()


