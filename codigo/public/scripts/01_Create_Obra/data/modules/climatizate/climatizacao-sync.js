import { triggerCalculation } from "../../../core/shared-utils.js";

let handleWallInputSync = function () {};
let syncTitleToAmbiente;
let syncAmbienteToTitle;
let setupCompleteRoomSync;

if (typeof window !== "undefined") {
  window.handleWallInputSync = handleWallInputSync;

  window.syncTitleToAmbiente = function (roomId, newTitle) {
    const ambienteInput = document.querySelector(
      `input[data-field="ambiente"][data-room-id="${roomId}"]`,
    );
    if (ambienteInput && ambienteInput.value !== newTitle) {
      ambienteInput.value = newTitle;
      triggerCalculation(roomId);
    }
  };

  window.syncAmbienteToTitle = function (roomId, newAmbiente) {
    const roomTitle = document.querySelector(
      `[data-room-id="${roomId}"] .room-title`,
    );
    if (roomTitle && roomTitle.textContent !== newAmbiente) {
      roomTitle.textContent = newAmbiente;
      const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
      if (roomBlock) {
        roomBlock.dataset.roomName = newAmbiente;
      }
    }
  };

  window.setupCompleteRoomSync = function (roomId) {
    const roomTitle = document.querySelector(
      `[data-room-id="${roomId}"] .room-title`,
    );
    const ambienteInput = document.querySelector(
      `input[data-field="ambiente"][data-room-id="${roomId}"]`,
    );

    if (!roomTitle || !ambienteInput || ambienteInput.dataset.syncReady === "true") {
      return;
    }

    ambienteInput.dataset.syncReady = "true";
    ambienteInput.addEventListener("input", function () {
      window.syncAmbienteToTitle(roomId, this.value);
      triggerCalculation(roomId);
    });

    if (!ambienteInput.value || ambienteInput.value.trim() === "") {
      ambienteInput.value = roomTitle.textContent;
    }
  };

  syncTitleToAmbiente = window.syncTitleToAmbiente;
  syncAmbienteToTitle = window.syncAmbienteToTitle;
  setupCompleteRoomSync = window.setupCompleteRoomSync;
}

export {
  handleWallInputSync,
  syncTitleToAmbiente,
  syncAmbienteToTitle,
  setupCompleteRoomSync,
};
