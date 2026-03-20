// data/modules/climatizacao/climatizacao-sync.js
// Exportações do módulo

import { calculateVazaoArAndThermalGains } from "../../../features/calculations/air-flow.js";
import { triggerCalculation } from "../../../core/shared-utils.js";

// REMOVER a função local
// function triggerCalculation(roomId) { ... }
// =============================================================================
// SINCRONIZAÇÃO GLOBAL - FUNÇÕES COMPLETAS
// =============================================================================

// Exportações corretas
let handleWallInputSync;
let syncTitleToAmbiente;
let syncAmbienteToTitle;
let setupCompleteRoomSync;

if (typeof window !== "undefined") {
  // ============================================
  // SINCRONIZAÇÃO APENAS NA PRIMEIRA INTERAÇÃO PAREDES
  // ============================================
  // SINCRONIZAÇÃO DE PAREDES
  window.handleWallInputSyncFirstInteraction = function (roomId, field, value) {
    console.log(
      ` [PRIMEIRA-INTERAÇÃO] Sincronização de parede: ${field} = ${value}`,
    );

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    // Buscar referências dos inputs
    const paredeOeste = document.querySelector(
      `input[data-field="paredeOeste"][data-room-id="${roomId}"]`,
    );
    const paredeLeste = document.querySelector(
      `input[data-field="paredeLeste"][data-room-id="${roomId}"]`,
    );
    const paredeNorte = document.querySelector(
      `input[data-field="paredeNorte"][data-room-id="${roomId}"]`,
    );
    const paredeSul = document.querySelector(
      `input[data-field="paredeSul"][data-room-id="${roomId}"]`,
    );

    // Verificar se estamos em primeira interação (com base nos atributos data)
    const isFirstInteraction = () => {
      const input = document.querySelector(
        `input[data-field="${field}"][data-room-id="${roomId}"]`,
      );
      return input && input.getAttribute("data-first-interaction") === "true";
    };

    // Sincronizar paredes leste/oeste apenas na primeira interação
    if (field === "paredeOeste" || field === "paredeLeste") {
      const otherField =
        field === "paredeOeste" ? "paredeLeste" : "paredeOeste";
      const otherInput = field === "paredeOeste" ? paredeLeste : paredeOeste;

      if (otherInput && isFirstInteraction()) {
        const isPlaceholder =
          otherInput.value === "" ||
          otherInput.value === "Ex: 5.5" ||
          otherInput.value === "Ex: 8.0";
        const isCurrentlyEditing =
          document.activeElement ===
          document.querySelector(
            `input[data-field="${field}"][data-room-id="${roomId}"]`,
          );

        if (isPlaceholder || isCurrentlyEditing) {
          otherInput.value = numValue;
          console.log(
            ` [PRIMEIRA-INTERAÇÃO] ${field} → ${otherField}: ${numValue} (durante edição)`,
          );
          triggerCalculation(roomId);
        }
      }
    }

    // Sincronizar paredes norte/sul apenas na primeira interação
    if (field === "paredeNorte" || field === "paredeSul") {
      const otherField = field === "paredeNorte" ? "paredeSul" : "paredeNorte";
      const otherInput = field === "paredeNorte" ? paredeSul : paredeNorte;

      if (otherInput && isFirstInteraction()) {
        const isPlaceholder =
          otherInput.value === "" ||
          otherInput.value === "Ex: 8.0" ||
          otherInput.value === "Ex: 5.5";
        const isCurrentlyEditing =
          document.activeElement ===
          document.querySelector(
            `input[data-field="${field}"][data-room-id="${roomId}"]`,
          );

        if (isPlaceholder || isCurrentlyEditing) {
          otherInput.value = numValue;
          console.log(
            ` [PRIMEIRA-INTERAÇÃO] ${field} → ${otherField}: ${numValue} (durante edição)`,
          );
          triggerCalculation(roomId);
        }
      }
    }
  };

  // Usar sincronização apenas na primeira interação
  window.handleWallInputSync = window.handleWallInputSyncFirstInteraction;
  console.log(" LÓGICA ATIVA: Sincronização APENAS NA PRIMEIRA INTERAÇÃO");

  // ============================================
  // SINCRONIZAÇÃO TÍTULO AMBIENTE
  // ============================================

  // Função de sincronização título→ambiente
  window.syncTitleToAmbiente = function (roomId, newTitle) {
    console.log(` Título → Ambiente: "${newTitle}" para sala ${roomId}`);
    const ambienteInput = document.querySelector(
      `input[data-field="ambiente"][data-room-id="${roomId}"]`,
    );
    if (ambienteInput && ambienteInput.value !== newTitle) {
      ambienteInput.value = newTitle;
      console.log(` Título → Ambiente: "${newTitle}"`);
      triggerCalculation(roomId);
    }
  };

  // Função de sincronização ambiente→título
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
      console.log(` Ambiente → Título: "${newAmbiente}"`);
    }
  };

  // Função setupCompleteRoomSync adicionada de volta
  window.setupCompleteRoomSync = function (roomId) {
    console.log(` CONFIGURANDO SINCRONIZAÇÃO COMPLETA PARA SALA: ${roomId}`);

    // Configurar paredes
    setupWallEventListenersDirect(roomId);

    // Configurar títuloambiente
    setupTitleAmbienteSyncDirect(roomId);

    console.log(` SINCRONIZAÇÃO COMPLETA CONFIGURADA PARA: ${roomId}`);
  };

  // FUNÇÃO AUXILIAR PARA CONFIGURAR PAREDES
  function setupWallEventListenersDirect(roomId) {
    console.log(
      ` CONFIGURANDO EVENT LISTENERS PARA PAREDES COM PRIMEIRA INTERAÇÃO: ${roomId}`,
    );

    const setupWallInput = (field, placeholder) => {
      const input = document.querySelector(
        `input[data-field="${field}"][data-room-id="${roomId}"]`,
      );
      if (input) {
        // Marcar como primeira interação não concluída
        input.setAttribute("data-first-interaction", "true");

        input.addEventListener("focus", function () {
          this.setAttribute("data-editing", "true");
          console.log(` Foco em ${field} - primeira interação ativa`);
        });

        input.addEventListener("input", function () {
          const isEditing = this.getAttribute("data-editing") === "true";
          const isFirstInteraction =
            this.getAttribute("data-first-interaction") === "true";

          if (
            this.value &&
            this.value !== placeholder &&
            isEditing &&
            isFirstInteraction
          ) {
            window.handleWallInputSync(roomId, field, this.value);
          }
        });

        input.addEventListener("blur", function () {
          this.removeAttribute("data-editing");
          this.setAttribute("data-first-interaction", "false");
          console.log(
            ` ${field} - primeira interação concluída, agora independente`,
          );
        });

        return true;
      }
      return false;
    };

    const walls = [
      { field: "paredeOeste", placeholder: "Ex: 5.5" },
      { field: "paredeLeste", placeholder: "Ex: 5.5" },
      { field: "paredeNorte", placeholder: "Ex: 8.0" },
      { field: "paredeSul", placeholder: "Ex: 8.0" },
    ];

    walls.forEach((wall) => {
      if (setupWallInput(wall.field, wall.placeholder)) {
        console.log(
          ` Listener configurado para ${wall.field} (primeira interação)`,
        );
      }
    });
  }

  // FUNÇÃO AUXILIAR PARA CONFIGURAR TÍTULOAMBIENTE
  function setupTitleAmbienteSyncDirect(roomId) {
    const roomTitle = document.querySelector(
      `[data-room-id="${roomId}"] .room-title`,
    );
    const ambienteInput = document.querySelector(
      `input[data-field="ambiente"][data-room-id="${roomId}"]`,
    );

    if (roomTitle && ambienteInput) {
      // Sincronização Ambiente → Título
      ambienteInput.addEventListener("input", function () {
        if (
          this.value &&
          this.value.trim() !== "" &&
          this.value !== roomTitle.textContent
        ) {
          roomTitle.textContent = this.value;
          const roomBlock = document.querySelector(
            `[data-room-id="${roomId}"]`,
          );
          if (roomBlock) {
            roomBlock.dataset.roomName = this.value;
          }
          console.log(` Ambiente → Título: "${this.value}"`);
          triggerCalculation(roomId);
        }
      });

      // Sincronização inicial
      if (!ambienteInput.value || ambienteInput.value.trim() === "") {
        ambienteInput.value = roomTitle.textContent;
        console.log(
          ` Sincronização inicial: Título → Ambiente: "${roomTitle.textContent}"`,
        );
      }
    }
  }

  // Atribuir às variáveis de exportação
  handleWallInputSync = window.handleWallInputSync;
  syncTitleToAmbiente = window.syncTitleToAmbiente;
  syncAmbienteToTitle = window.syncAmbienteToTitle;
  setupCompleteRoomSync = window.setupCompleteRoomSync;
}

// =============================================================================
// EXPORTAÇÕES COMPLETAS
// =============================================================================

export {
  handleWallInputSync,
  syncTitleToAmbiente,
  syncAmbienteToTitle,
  setupCompleteRoomSync,
};
