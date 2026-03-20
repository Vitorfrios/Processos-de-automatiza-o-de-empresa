/**
 * filter-autocomplete.js - Integração do autocomplete no filtro de empresa
 * REUTILIZA COMPLETAMENTE o sistema existente de autocomplete
 */

import { normalizeEmpresa } from "../../core/shared-utils.js";

const FilterAutocomplete = (function () {
  let empresaInput = null;
  let dropdown = null;
  let optionsContainer = null;
  let isInitialized = false;
  let empresasCache = null;

  /**
   * Inicializa autocomplete no filtro de empresa
   */
  async function initialize() {
    if (isInitialized) {
      console.log(" [FILTER-AUTOCOMPLETE] Já inicializado");
      return true;
    }

    console.log(" [FILTER-AUTOCOMPLETE] Inicializando...");

    // Buscar elementos
    empresaInput = document.getElementById("filter-empresa");
    if (!empresaInput) {
      console.error(" [FILTER-AUTOCOMPLETE] Input de empresa não encontrado");
      return false;
    }

    // Criar dropdown (reutilizando estrutura do sistema existente)
    createDropdown();

    // Carregar empresas com cache (reutiliza função existente)
    await loadEmpresas();

    // Configurar eventos
    setupEventListeners();

    isInitialized = true;
    console.log(" [FILTER-AUTOCOMPLETE] Inicializado com sucesso");
    return true;
  }

  /**
   * Cria dropdown similar ao existente
   */
  function createDropdown() {
    // Criar container do dropdown
    dropdown = document.createElement("div");
    dropdown.id = "filter-empresa-dropdown";
    dropdown.className = "empresa-dropdown filter-dropdown";
    dropdown.style.cssText = `
 position: absolute;
 background: white;
 border: 1px solid #ddd;
 border-radius: 4px;
 max-height: 200px;
 overflow-y: auto;
 display: none;
 z-index: 1000;
 box-shadow: 0 2px 10px rgba(0,0,0,0.1);
 width: ${empresaInput.offsetWidth}px;
 `;

    // Container para opções
    optionsContainer = document.createElement("div");
    optionsContainer.id = "filter-empresa-options";
    optionsContainer.className = "dropdown-options";

    dropdown.appendChild(optionsContainer);
    document.body.appendChild(dropdown);

    // Posicionar abaixo do input
    updateDropdownPosition();

    // Atualizar posição quando redimensionar
    window.addEventListener("resize", updateDropdownPosition);
  }

  /**
   * Atualiza posição do dropdown
   */
  function updateDropdownPosition() {
    if (!dropdown || !empresaInput) return;

    const rect = empresaInput.getBoundingClientRect();
    dropdown.style.top = rect.bottom + window.scrollY + "px";
    dropdown.style.left = rect.left + window.scrollX + "px";
    dropdown.style.width = rect.width + "px";
  }

  /**
   * Carrega empresas (reutiliza cache do sistema existente)
   */
  async function loadEmpresas() {
    console.log(" [FILTER-AUTOCOMPLETE] Carregando empresas...");

    try {
      // Tentar usar função existente primeiro
      if (typeof carregarEmpresasComCache === "function") {
        empresasCache = await carregarEmpresasComCache();
        console.log(
          ` [FILTER-AUTOCOMPLETE] ${empresasCache.length} empresas carregadas (via cache)`,
        );
      } else {
        // Fallback: buscar diretamente
        const response = await fetch("/api/dados/empresas");
        if (response.ok) {
          const data = await response.json();
          empresasCache = data.empresas || [];
          console.log(
            ` [FILTER-AUTOCOMPLETE] ${empresasCache.length} empresas carregadas (direto)`,
          );
        } else {
          empresasCache = [];
          console.warn(" [FILTER-AUTOCOMPLETE] Nenhuma empresa carregada");
        }
      }
    } catch (error) {
      console.error(" [FILTER-AUTOCOMPLETE] Erro ao carregar empresas:", error);
      empresasCache = [];
    }
  }

  /**
   * Configura event listeners (reutilizando lógica existente)
   */
  function setupEventListeners() {
    if (!empresaInput || !dropdown) return;

    console.log(" [FILTER-AUTOCOMPLETE] Configurando listeners");

    // Input event (com debounce)
    let inputTimeout;
    empresaInput.addEventListener("input", function (e) {
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(() => {
        handleInput(e.target.value);
      }, 18);
    });

    // Focus event
    empresaInput.addEventListener("focus", function () {
      if (this.value.trim() === "") {
        showAllEmpresas();
      } else {
        handleInput(this.value);
      }
    });

    // Keydown events (navegação)
    empresaInput.addEventListener("keydown", function (e) {
      if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();
        handleKeyDown(e.key);
      }
    });

    // Blur event (fechar dropdown com delay)
    empresaInput.addEventListener("blur", function () {
      setTimeout(() => {
        if (dropdown) dropdown.style.display = "none";
      }, 25);
    });

    // Click outside to close
    document.addEventListener("click", function (e) {
      if (!empresaInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }

  /**
   * Manipula input do usuário
   */
  function handleInput(termo) {
    const termoTrim = termo.trim();

    if (termoTrim.length === 0) {
      showAllEmpresas();
      return;
    }

    const sugestoes = filtrarEmpresas(termoTrim, empresasCache);
    exibirSugestoes(sugestoes, termoTrim);
  }

  /**
   * Filtra empresas (reutilizando lógica existente)
   */
  function filtrarEmpresas(termo, empresas) {
    if (!termo || termo.length < 1 || !empresas) return [];

    const termoNormalizado = termo
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return empresas.filter((empresaObj) => {
      const empresa = normalizeEmpresa(empresaObj);
      if (!empresa || !empresa.codigo) return false;
      const sigla = empresa.codigo;
      const nome = empresa.nome || "";
      const nomeNormalizado = nome
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      return (
        sigla === termoNormalizado ||
        sigla.includes(termoNormalizado) ||
        nomeNormalizado.includes(termoNormalizado)
      );
    });
  }

  /**
   * Exibe todas as empresas
   */
  function showAllEmpresas() {
    if (!empresasCache || empresasCache.length === 0) {
      showNoResults("Digite para buscar empresas");
      return;
    }

    const empresasLimitadas = empresasCache.slice(0, 50);
    renderOptions(empresasLimitadas);
  }

  /**
   * Exibe sugestões
   */
  function exibirSugestoes(sugestoes, termo) {
    if (!sugestoes || sugestoes.length === 0) {
      showNoResults(`Nenhuma empresa encontrada para "${termo}"`);
      return;
    }

    const sugestoesLimitadas = sugestoes.slice(0, 50);
    renderOptions(sugestoesLimitadas);
  }

  /**
   * Renderiza opções no dropdown
   */
  function renderOptions(empresas) {
    if (!optionsContainer) return;

    optionsContainer.innerHTML = empresas
      .map((empresaObj) => {
        const empresa = normalizeEmpresa(empresaObj);
        if (!empresa || !empresa.codigo) return "";
        const sigla = empresa.codigo;
        const nome = empresa.nome || "";
        return `
 <div class="dropdown-option" data-sigla="${sigla}" data-nome="${nome}">
 <strong>${sigla}</strong> 
 <span class="nome-empresa">- ${nome}</span>
 </div>
 `;
      })
      .join("");

    // Adicionar event listeners às opções
    optionsContainer.querySelectorAll(".dropdown-option").forEach((option) => {
      option.addEventListener("click", function () {
        selectEmpresa(this.dataset.sigla, this.dataset.nome);
      });
    });

    // Mostrar dropdown
    dropdown.style.display = "block";
    updateDropdownPosition();
  }

  /**
   * Mostra mensagem de "sem resultados"
   */
  function showNoResults(message) {
    if (!optionsContainer) return;

    optionsContainer.innerHTML = `
 <div class="dropdown-no-results">
 ${message}
 </div>
 `;

    dropdown.style.display = "block";
    updateDropdownPosition();
  }

  /**
   * Manipula teclas de navegação
   */
  function handleKeyDown(key) {
    const options = optionsContainer.querySelectorAll(".dropdown-option");
    if (options.length === 0) return;

    const activeOption = optionsContainer.querySelector(
      ".dropdown-option.active",
    );
    let nextIndex = 0;

    switch (key) {
      case "ArrowDown":
        if (activeOption) {
          const currentIndex = Array.from(options).indexOf(activeOption);
          nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        }
        break;

      case "ArrowUp":
        if (activeOption) {
          const currentIndex = Array.from(options).indexOf(activeOption);
          nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        } else {
          nextIndex = options.length - 1;
        }
        break;

      case "Enter":
        if (activeOption) {
          selectEmpresa(activeOption.dataset.sigla, activeOption.dataset.nome);
        }
        return;

      case "Escape":
        dropdown.style.display = "none";
        return;
    }

    // Atualizar opção ativa
    options.forEach((opt) => opt.classList.remove("active"));
    if (options[nextIndex]) {
      options[nextIndex].classList.add("active");
      options[nextIndex].scrollIntoView({ block: "nearest" });
    }
  }

  /**
   * Seleciona uma empresa
   */
  /**
   * Seleciona uma empresa
   */
  function selectEmpresa(sigla, nome) {
    console.log(
      ` [FILTER-AUTOCOMPLETE] Empresa selecionada: ${sigla} - ${nome}`,
    );

    // Preencher input com formato completo
    empresaInput.value = `${sigla} - ${nome}`;

    // Enviar apenas a SIGLA para o sistema de filtros
    if (window.FilterSystem) {
      window.FilterSystem.updateFilterValue("empresa", sigla); // Apenas sigla!
    }

    // Fechar dropdown
    dropdown.style.display = "none";

    // Disparar evento change (com delay para evitar duplicação)
    setTimeout(() => {
      empresaInput.dispatchEvent(new Event("change", { bubbles: true }));
    }, 10);
  }

  /**
   * Limpa o autocomplete
   */
  function clear() {
    if (empresaInput) {
      empresaInput.value = "";
      empresaInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (dropdown) {
      dropdown.style.display = "none";
    }
  }

  /**
   * Destrói instância
   */
  function destroy() {
    if (dropdown && dropdown.parentNode) {
      dropdown.parentNode.removeChild(dropdown);
    }

    window.removeEventListener("resize", updateDropdownPosition);
    isInitialized = false;

    console.log(" [FILTER-AUTOCOMPLETE] Destruído");
  }

  // API pública
  return {
    initialize,
    clear,
    destroy,
    isInitialized: () => isInitialized,
  };
})();

// Exportar para uso global
window.FilterAutocomplete = FilterAutocomplete;
