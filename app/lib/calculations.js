/**
 * Calculates the win amount based on number of cartelas and price per cartela
 * @param {number} cartelaCount - Number of cartelas
 * @param {number} pricePerCartela - Price per cartela in ETB
 * @param {number} houseCutPercentage - House cut percentage
 * @returns {{ winAmount: number, houseCut: number, totalRevenue: number }}
 */
export const calculateGameAmounts = (
  cartelaCount,
  pricePerCartela = 50,
  houseCutPercentage = 10
) => {
  // Calculate total revenue (price * number of cartelas)
  const totalRevenue = cartelaCount * pricePerCartela;

  // Calculate house cut
  const houseCut = Math.floor((totalRevenue * houseCutPercentage) / 100);

  // Calculate win amount (100% - houseCutPercentage of total revenue)
  const winAmount = Math.floor(
    (totalRevenue * (100 - houseCutPercentage)) / 100
  );

  return {
    winAmount,
    houseCut,
    totalRevenue,
  };
};
