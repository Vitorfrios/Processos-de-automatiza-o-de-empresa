function buildMachinesSection(projectName, roomName) {
  const roomId = `${projectName}-${roomName}`
  return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}-maquinas')">+</button>
        <h4 class="section-title">Máquinas</h4>
        <button class="btn btn-add-small" onclick="addMachine('${roomId}')">+ Adicionar Máquina</button>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}-maquinas">
        <div class="machines-container" id="machines-${roomId}">
          <p class="empty-message">Nenhuma máquina adicionada ainda.</p>
        </div>
      </div>
    </div>
  `
}

function addMachine(roomId) {
  const machinesContainer = document.getElementById(`machines-${roomId}`)
  const machineCount = machinesContainer.querySelectorAll(".machine-item").length + 1

  removeEmptyMachinesMessage(machinesContainer)

  const machineHTML = buildMachineHTML(machineCount)
  machinesContainer.insertAdjacentHTML("beforeend", machineHTML)

  console.log(`[v0] Máquina ${machineCount} adicionada`)
}

function removeEmptyMachinesMessage(container) {
  const emptyMessage = container.querySelector(".empty-message")
  if (emptyMessage) {
    emptyMessage.remove()
  }
}

function buildMachineHTML(machineCount) {
  return `
    <div class="machine-item">
      <div class="machine-header">
        <span class="machine-title">Máquina ${machineCount}</span>
        <button class="btn btn-delete-small" onclick="deleteMachine(this)">×</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nome:</label>
          <input type="text" class="form-input" data-field="maquina_nome" placeholder="Ex: Servidor Principal">
        </div>
        <div class="form-group">
          <label>Modelo:</label>
          <input type="text" class="form-input" data-field="maquina_modelo" placeholder="Ex: Dell PowerEdge">
        </div>
        <div class="form-group">
          <label>Potência (W):</label>
          <input type="number" class="form-input" data-field="maquina_potencia" placeholder="Ex: 500">
        </div>
        <div class="form-group">
          <label>Status:</label>
          <select class="form-input" data-field="maquina_status">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>
      </div>
    </div>
  `
}

function deleteMachine(button) {
  if (!confirm("Deseja remover esta máquina?")) return

  const machineItem = button.closest(".machine-item")
  const machinesContainer = machineItem.closest(".machines-container")

  machineItem.remove()
  showEmptyMachinesMessageIfNeeded(machinesContainer)

  console.log("[v0] Máquina removida")
}

function showEmptyMachinesMessageIfNeeded(container) {
  if (container.querySelectorAll(".machine-item").length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhuma máquina adicionada ainda.</p>'
  }
}

export {
  buildMachinesSection,
  addMachine,
  removeEmptyMachinesMessage,
  buildMachineHTML,
  deleteMachine,
  showEmptyMachinesMessageIfNeeded
}