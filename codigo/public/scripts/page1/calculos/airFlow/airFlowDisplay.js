/**
 * airFlowDisplay.js
 * Atualiza exibição do resultado de vazão na interface
 */
export function updateFlowRateDisplay(roomId, flowRate) {
  const resultElement = document.getElementById(`vazao-ar-${roomId}`);
  if (resultElement) {
    resultElement.textContent = flowRate;
  }
}