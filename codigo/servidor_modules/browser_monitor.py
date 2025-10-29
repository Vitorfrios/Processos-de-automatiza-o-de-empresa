"""
browser_monitor.py
Monitoramento do navegador - Versão SIMPLIFICADA
Apenas para compatibilidade, sem verificações de atividade
"""

import time
from servidor_modules import config

def monitorar_navegador(port, httpd):
    """
    Monitoramento SIMPLIFICADO - sem verificações de porta
    Mantido apenas para compatibilidade com o código existente
    """
    print("🔍 MONITOR: Sistema de monitoramento INICIADO")
    print("   • Encerramento automático DESATIVADO")
    print("   • Servidor permanecerá aberto até encerramento manual")
    print("   • Use o botão 'Encerrar Servidor' na interface web")
    print("   • Ou pressione Ctrl+C neste terminal\n")
    
    # Loop simples que apenas mantém a thread ativa
    while config.servidor_rodando:
        try:
            time.sleep(10)  # Verificação a cada 10 segundos (apenas para manter a thread)
        except KeyboardInterrupt:
            print("\nMONITOR: Interrupção recebida")
            config.servidor_rodando = False
            break
        except Exception as e:
            print(f"MONITOR: Erro inesperado: {e}")
            time.sleep(10)
    
    print("MONITOR: Thread finalizada")

# =====================
# ENDPOINT PARA REMOVER OBRA DA SESSÃO
# =====================

def setup_session_routes(app):
    """
    Configura as rotas de sessão para o Flask app
    """
    
    @app.route('/api/sessions/remove-obra/<obra_id>', methods=['DELETE'])
    def remove_obra_from_session(obra_id):
        try:
            from flask import session, jsonify
            
            # Remove o ID da obra da sessão
            if 'session_active' in session and 'obras' in session['session_active']:
                if obra_id in session['session_active']['obras']:
                    session['session_active']['obras'].remove(obra_id)
                    session.modified = True
                    print(f"🗑️ Obra {obra_id} removida da sessão")
                    
                    # Força atualização da sessão
                    return jsonify({
                        'success': True, 
                        'message': 'Obra removida da sessão',
                        'reload_required': True  # Flag para frontend recarregar
                    }), 200
                else:
                    return jsonify({'success': False, 'error': 'Obra não encontrada na sessão'}), 404
            else:
                return jsonify({'success': False, 'error': 'Sessão não encontrada'}), 404
                
        except Exception as e:
            print(f"❌ Erro ao remover obra {obra_id} da sessão: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/sessions/check-obra/<obra_id>', methods=['GET'])
    def check_obra_in_session(obra_id):
        """
        Verifica se uma obra está na sessão
        """
        try:
            from flask import session, jsonify
            
            if 'session_active' in session and 'obras' in session['session_active']:
                exists = obra_id in session['session_active']['obras']
                return jsonify({
                    'exists': exists,
                    'obra_id': obra_id
                }), 200
            else:
                return jsonify({'exists': False, 'error': 'Sessão não encontrada'}), 404
                
        except Exception as e:
            print(f"❌ Erro ao verificar obra {obra_id} na sessão: {e}")
            return jsonify({'exists': False, 'error': str(e)}), 500

    print("✅ Rotas de sessão configuradas com sucesso")