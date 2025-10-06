import { ensureStringId } from '../utils/utils.js'

function buildProjectData(projectBlock, projectId) {
  const projectData = {
    nome: projectBlock.querySelector(".project-title").textContent.trim(),
    salas: [],
  }

  if (projectId !== null && projectId !== undefined) {
    projectData.id = ensureStringId(projectId)
  }

  const roomBlocks = projectBlock.querySelectorAll(".room-block")
  roomBlocks.forEach((roomBlock, index) => {
    const roomData = extractRoomData(roomBlock)
    roomData.id = ensureStringId(index + 1)
    projectData.salas.push(roomData)
  })

  return projectData
}

function extractRoomData(roomBlock) {
  const roomData = {
    nome: roomBlock.querySelector(".room-title").textContent.trim(),
    inputs: {},
  }

  const roomId = roomBlock.querySelector('[id^="room-content-"]')?.id.replace("room-content-", "")
  if (roomId) {
    const climaInputs = roomBlock.querySelectorAll(".clima-input")
    climaInputs.forEach((input) => {
      const field = input.dataset.field
      const value = input.value

      if (value === "" || value === null || value === undefined) {
        roomData.inputs[field] = input.type === "number" ? 0 : ""
        return
      }

      if (input.tagName === "SELECT" || input.type === "text") {
        roomData.inputs[field] = value
      } else if (input.type === "number") {
        roomData.inputs[field] = Number.parseFloat(value) || 0
      } else {
        roomData.inputs[field] = value
      }
    })

    const vazaoElement = document.getElementById(`vazao-ar-${roomId}`)
    if (vazaoElement) {
      const vazaoValue = vazaoElement.textContent.trim()
      roomData.inputs.vazaoArExterno = Number.parseInt(vazaoValue) || 0
    }

    const totalGanhosElement = document.getElementById(`total-ganhos-w-${roomId}`)
    const totalTRElement = document.getElementById(`total-tr-${roomId}`)

    const totalExternoElement = document.getElementById(`total-externo-${roomId}`)
    const totalDivisoesElement = document.getElementById(`total-divisoes-${roomId}`)
    const totalPisoElement = document.getElementById(`total-piso-${roomId}`)
    const totalIluminacaoElement = document.getElementById(`total-iluminacao-${roomId}`)
    const totalDissiElement = document.getElementById(`total-dissi-${roomId}`)
    const totalPessoasElement = document.getElementById(`total-pessoas-${roomId}`)

    const totalArSensivelElement = document.getElementById(`total-ar-sensivel-${roomId}`)
    const totalArLatenteElement = document.getElementById(`total-ar-latente-${roomId}`)
    const totalArExterno =
      (Number.parseInt(totalArSensivelElement?.textContent) || 0) +
      (Number.parseInt(totalArLatenteElement?.textContent) || 0)

    if (totalGanhosElement && totalTRElement) {
      roomData.ganhosTermicos = {
        totalW: Number.parseInt(totalGanhosElement.textContent) || 0,
        totalTR: Number.parseInt(totalTRElement.textContent) || 0,
        totalExterno: Number.parseInt(totalExternoElement?.textContent) || 0,
        totalDivisoes: Number.parseInt(totalDivisoesElement?.textContent) || 0,
        totalPiso: Number.parseInt(totalPisoElement?.textContent) || 0,
        totalIluminacao: Number.parseInt(totalIluminacaoElement?.textContent) || 0,
        totalEquipamentos: Number.parseInt(totalDissiElement?.textContent) || 0,
        totalPessoas: Number.parseInt(totalPessoasElement?.textContent) || 0,
        totalArExterno: totalArExterno,
      }
    }
  }

  return roomData
}

export {
  buildProjectData,
  extractRoomData
}