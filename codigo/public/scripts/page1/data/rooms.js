import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../ui/interface.js'
// Importações dos módulos
import { 
  createEmptyRoom, 
  insertRoomIntoProject, 
  addNewRoom, 
  deleteRoom 
} from './modules/projeto.js'

import { 
  buildRoomHTML, 
  buildRoomHeader, 
  buildRoomActions 
} from './modules/salas.js'

import { 
  buildClimatizationSection,
  buildClimatizationTable,
  buildClimaRow,
  buildClimaCell,
  buildSelectInput,
  buildTextInput,
  buildResultRow,
  buildThermalGainsSection
} from './modules/climatizacao.js'

import { 
  buildMachinesSection,
  addMachine,
  removeEmptyMachinesMessage,
  buildMachineHTML,
  deleteMachine,
  showEmptyMachinesMessageIfNeeded
} from './modules/maquinas.js'

import { 
  buildConfigurationSection 
} from './modules/configuracao.js'

// Exportar tudo para manter compatibilidade
export {
  // Projeto
  createEmptyRoom,
  insertRoomIntoProject,
  addNewRoom,
  deleteRoom,
  
  // Salas
  buildRoomHTML,
  buildRoomHeader,
  buildRoomActions,
  
  // Climatização
  buildClimatizationSection,
  buildClimatizationTable,
  buildClimaRow,
  buildClimaCell,
  buildSelectInput,
  buildTextInput,
  buildResultRow,
  buildThermalGainsSection,
  
  // Máquinas
  buildMachinesSection,
  addMachine,
  removeEmptyMachinesMessage,
  buildMachineHTML,
  deleteMachine,
  showEmptyMachinesMessageIfNeeded,
  
  // Configuração
  buildConfigurationSection
}