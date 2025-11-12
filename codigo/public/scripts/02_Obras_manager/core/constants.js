/**
 * core/constants.js
 * Constantes e configurações específicas da Página 2
 */

export const PAGE_MODE = 'manager';

export const MANAGER_EVENTS = {
    OBRAS_LOADED: 'manager:obras-loaded',
    OBRA_DELETED: 'manager:obra-deleted',
    FILTER_APPLIED: 'manager:filter-applied'
};

export const BACKUP_ENDPOINTS = {
    LOAD: '/api/backup-completo',
    REMOVE_OBRA: '/api/backup/obras/remove',
    UPDATE_BACKUP: '/api/backup.json'
};

export const MESSAGES = {
    LOADING: 'Carregando obras...',
    LOAD_SUCCESS: 'Obras carregadas com sucesso',
    LOAD_ERROR: 'Erro ao carregar obras',
    DELETE_SUCCESS: 'Obra removida do backup',
    DELETE_ERROR: 'Erro ao remover obra',
    NO_OBRAS: 'Nenhuma obra encontrada no backup'
};

export const SELECTORS = {
    CONTAINER: '#projects-container',
    OBRA_BLOCK: '.obra-block',
    BTN_SAVE: '.btn-save',
    BTN_ADD_PROJECT: '.btn-add-secondary'
};