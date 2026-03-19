import { APP_CONFIG } from '../core/config.js';
import { createSmartLogger } from '../core/logger.js';
import {
    clearClientSession,
    loginAdmin,
    loginClient,
    redirectToAdminApp,
    redirectToClientApp
} from '../core/auth.js';

function setFeedback(message, type = 'info') {
    const feedback = document.getElementById('loginFeedback');
    if (!feedback) return;

    feedback.textContent = message;
    feedback.dataset.type = type;
    feedback.style.color = type === 'error' ? '#c62828' : '#0d5d24';
}

function setLoadingState(isLoading) {
    const loginButton = document.getElementById('loginBtn');
    if (!loginButton) return;

    loginButton.disabled = isLoading;
    loginButton.classList.toggle('loading', isLoading);

    const buttonText = loginButton.querySelector('.btn-text');
    if (buttonText) {
        buttonText.textContent = isLoading ? 'Validando...' : 'Entrar';
    }
}

function bindPasswordToggle() {
    const toggleButton = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (!toggleButton || !passwordInput) {
        return;
    }

    toggleButton.addEventListener('click', () => {
        const showPassword = passwordInput.type === 'password';
        passwordInput.type = showPassword ? 'text' : 'password';

        const icon = toggleButton.querySelector('i');
        if (icon) {
            icon.className = showPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
    });
}

function bindLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (!loginForm || !usernameInput || !passwordInput) {
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFeedback('');
        setLoadingState(true);

        try {
            const adminResult = usernameInput.value.trim() === 'ADM'
                ? await loginAdmin({
                    usuario: usernameInput.value,
                    token: passwordInput.value
                })
                : null;

            if (adminResult?.success) {
                redirectToAdminApp(adminResult.redirectTo);
                return;
            }

            const result = await loginClient({
                usuario: usernameInput.value,
                token: passwordInput.value
            });

            if (!result.success) {
                setFeedback(result.message || 'Falha ao autenticar.', 'error');
                return;
            }

            redirectToClientApp();
        } catch (error) {
            console.error('[CLIENT-LOGIN] Erro no login:', error);
            setFeedback('Nao foi possivel validar o acesso.', 'error');
        } finally {
            setLoadingState(false);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (APP_CONFIG.mode !== 'client') {
        return;
    }

    if (!window.logger) {
        Object.defineProperty(window, 'logger', {
            value: createSmartLogger(APP_CONFIG),
            configurable: true,
            writable: true,
            enumerable: false
        });
    }

    // A tela de login sempre inicia sem reaproveitar sessao anterior.
    // Isso evita redirecionamento automatico e permite autenticar outra empresa.
    clearClientSession();

    bindPasswordToggle();
    bindLoginForm();
});
