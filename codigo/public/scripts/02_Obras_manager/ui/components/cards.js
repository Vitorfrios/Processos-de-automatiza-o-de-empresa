import { UI_CONSTANTS } from '../../core/constants.js';

export class CardsComponent {
    constructor() {
        this.cardTemplates = new Map();
        this.initializeTemplates();
    }

    initializeTemplates() {
        // Template para card de obra
        this.cardTemplates.set('obra', this.createObraCardTemplate());
        this.cardTemplates.set('project', this.createProjectCardTemplate());
        this.cardTemplates.set('room', this.createRoomCardTemplate());
    }

    createObraCard(obra) {
        const template = this.cardTemplates.get('obra');
        return this.renderTemplate(template, {
            id: obra.id,
            name: obra.nome,
            projectCount: obra.projetos ? obra.projetos.length : 0,
            roomCount: this.calculateTotalRooms(obra),
            lastModified: new Date(obra.timestamp).toLocaleDateString('pt-BR'),
            timestamp: obra.timestamp
        });
    }

    createProjectCard(project, obraId) {
        const template = this.cardTemplates.get('project');
        return this.renderTemplate(template, {
            id: project.id,
            name: project.nome,
            roomCount: project.salas ? project.salas.length : 0,
            lastModified: new Date(project.timestamp).toLocaleDateString('pt-BR'),
            obraId: obraId,
            timestamp: project.timestamp
        });
    }

    createRoomCard(room, projectId) {
        const template = this.cardTemplates.get('room');
        return this.renderTemplate(template, {
            id: room.id,
            name: room.nome,
            machineCount: room.maquinas ? room.maquinas.length : 0,
            totalPower: this.calculateRoomPower(room.maquinas),
            area: room.inputs?.area || 'N/A',
            projectId: projectId,
            climatizationType: room.inputs?.ambiente || 'N/A'
        });
    }

    createObraCardTemplate() {
        return `
            <div class="card obra-card" data-obra-id="{{id}}">
                <div class="card-header">
                    <h3 class="card-title">{{name}}</h3>
                    <span class="card-id">ID: {{id}}</span>
                </div>
                
                <div class="card-body">
                    <div class="card-stats">
                        <div class="stat-item">
                            <span class="stat-number">{{projectCount}}</span>
                            <span class="stat-label">Projetos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">{{roomCount}}</span>
                            <span class="stat-label">Salas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-date">{{lastModified}}</span>
                            <span class="stat-label">Modificado</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-primary btn-view" data-action="view" data-obra-id="{{id}}">
                        <span class="btn-icon">👁️</span>
                        Ver Detalhes
                    </button>
                    <button class="btn btn-secondary btn-edit" data-action="edit" data-obra-id="{{id}}">
                        <span class="btn-icon">✏️</span>
                        Editar
                    </button>
                    <button class="btn btn-danger btn-delete" data-action="delete" data-obra-id="{{id}}">
                        <span class="btn-icon">🗑️</span>
                        Excluir
                    </button>
                </div>
                
                <div class="card-footer">
                    <small>Criado em: {{timestamp}}</small>
                </div>
            </div>
        `;
    }

    createProjectCardTemplate() {
        return `
            <div class="card project-card" data-project-id="{{id}}" data-obra-id="{{obraId}}">
                <div class="card-header">
                    <h4 class="card-title">{{name}}</h4>
                    <span class="card-id">ID: {{id}}</span>
                </div>
                
                <div class="card-body">
                    <div class="card-stats">
                        <div class="stat-item">
                            <span class="stat-number">{{roomCount}}</span>
                            <span class="stat-label">Salas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-date">{{lastModified}}</span>
                            <span class="stat-label">Modificado</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-sm btn-primary" data-action="view-project" data-project-id="{{id}}">
                        Ver Salas
                    </button>
                </div>
            </div>
        `;
    }

    createRoomCardTemplate() {
        return `
            <div class="card room-card" data-room-id="{{id}}" data-project-id="{{projectId}}">
                <div class="card-header">
                    <h5 class="card-title">{{name}}</h5>
                    <span class="card-id">ID: {{id}}</span>
                </div>
                
                <div class="card-body">
                    <div class="room-info">
                        <div class="info-row">
                            <span class="info-label">Área:</span>
                            <span class="info-value">{{area}} m²</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Tipo:</span>
                            <span class="info-value">{{climatizationType}}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Máquinas:</span>
                            <span class="info-value">{{machineCount}}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Potência:</span>
                            <span class="info-value">{{totalPower}}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-sm btn-outline" data-action="view-room" data-room-id="{{id}}">
                        Detalhes
                    </button>
                </div>
            </div>
        `;
    }

    renderTemplate(template, data) {
        let rendered = template;
        
        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(placeholder, this.escapeHtml(value));
        }
        
        return rendered;
    }

    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    calculateTotalRooms(obra) {
        if (!obra.projetos) return 0;
        return obra.projetos.reduce((total, projeto) => {
            return total + (projeto.salas ? projeto.salas.length : 0);
        }, 0);
    }

    calculateRoomPower(maquinas) {
        if (!maquinas || maquinas.length === 0) return '0 BTU/h';
        
        const total = maquinas.reduce((sum, maquina) => {
            const powerMatch = (maquina.potenciaSelecionada || maquina.potencia || '0').match(/(\d+)/);
            return sum + (powerMatch ? parseInt(powerMatch[1]) : 0);
        }, 0);
        
        return `${total} BTU/h`;
    }

    createEmptyState(message, action = null) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>${message}</h3>
                ${action ? `
                    <div class="empty-action">
                        ${action}
                    </div>
                ` : ''}
            </div>
        `;
    }

    createLoadingState() {
        return `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Carregando...</p>
            </div>
        `;
    }

    createErrorState(message, retryAction = null) {
        return `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro</h3>
                <p>${message}</p>
                ${retryAction ? `
                    <div class="error-action">
                        ${retryAction}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

export const cardsComponent = new CardsComponent();