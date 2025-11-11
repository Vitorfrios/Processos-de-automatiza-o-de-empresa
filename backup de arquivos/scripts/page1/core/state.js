// state.js
// gerencia o estado global (obras, projetos, salas)

class ApplicationState {
    constructor() {
        this.obras = [];
        this.projetos = [];
        this.salas = [];
        this.currentObra = null;
        this.currentProject = null;
        this.currentRoom = null;
    }
    
    setObras(obras) {
        this.obras = obras;
        eventBus.emit('state:obras-changed', obras);
    }
    
    setProjetos(projetos) {
        this.projetos = projetos;
        eventBus.emit('state:projetos-changed', projetos);
    }
    
    setSalas(salas) {
        this.salas = salas;
        eventBus.emit('state:salas-changed', salas);
    }
    
    setCurrentObra(obra) {
        this.currentObra = obra;
        eventBus.emit('state:current-obra-changed', obra);
    }
    
    setCurrentProject(project) {
        this.currentProject = project;
        eventBus.emit('state:current-project-changed', project);
    }
    
    setCurrentRoom(room) {
        this.currentRoom = room;
        eventBus.emit('state:current-room-changed', room);
    }
}

export const appState = new ApplicationState();

export function initializeState() {
    window.appState = appState;
    console.log('🏗️  State inicializado');
}
