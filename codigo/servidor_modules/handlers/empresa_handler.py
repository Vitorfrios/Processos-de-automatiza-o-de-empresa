# servidor_modules/handlers/empresa_handler.py

"""
empresa_handler.py
Manipulacao de empresas no dados.json
"""

import os
from datetime import datetime, timedelta, timezone


class EmpresaHandler:
    def __init__(self, file_utils=None):
        self.file_utils = file_utils
        self.dados_path = os.path.join("json", "dados.json")

        if self.file_utils is None:
            from servidor_modules.utils.file_utils import FileUtils

            self.file_utils = FileUtils()

    def normalizar_empresa(self, empresa):
        """Compatibilidade temporaria entre formato legado e novo formato."""
        if not isinstance(empresa, dict):
            return None

        codigo = empresa.get("codigo")
        nome = empresa.get("nome")

        if codigo and nome:
            return {
                "codigo": codigo,
                "nome": nome,
                "credenciais": empresa.get("credenciais"),
            }

        chaves_empresa = [key for key in empresa.keys() if key != "credenciais"]
        if not chaves_empresa:
            return None

        codigo = chaves_empresa[0]
        nome = empresa.get(codigo)

        return {
            "codigo": codigo,
            "nome": nome,
            "credenciais": empresa.get("credenciais"),
        }

    def normalizar_empresas(self, empresas):
        if not isinstance(empresas, list):
            return []

        return [
            empresa_normalizada
            for empresa_normalizada in (self.normalizar_empresa(empresa) for empresa in empresas)
            if empresa_normalizada and empresa_normalizada.get("codigo")
        ]

    def serializar_empresa_publica(self, empresa):
        empresa_normalizada = self.normalizar_empresa(empresa)
        if not empresa_normalizada:
            return None

        return {
            "codigo": empresa_normalizada.get("codigo", ""),
            "nome": empresa_normalizada.get("nome", ""),
        }

    def _parse_datetime(self, value):
        if not value or not isinstance(value, str):
            return None

        normalized_value = value.strip()
        if normalized_value.endswith("Z"):
            normalized_value = normalized_value[:-1] + "+00:00"

        try:
            parsed_date = datetime.fromisoformat(normalized_value)
        except ValueError:
            return None

        if parsed_date.tzinfo is None:
            parsed_date = parsed_date.replace(tzinfo=timezone.utc)

        return parsed_date.astimezone(timezone.utc)

    def calcular_data_expiracao_credenciais(self, credenciais):
        if not isinstance(credenciais, dict):
            return None

        explicit_expiration = self._parse_datetime(
            credenciais.get("data_expiracao")
            or credenciais.get("expiracao")
            or credenciais.get("expiraEm")
            or credenciais.get("expiresAt")
            or credenciais.get("expiration")
        )
        if explicit_expiration:
            return explicit_expiration

        created_at = self._parse_datetime(
            credenciais.get("data_criacao") or credenciais.get("createdAt")
        )
        if not created_at:
            return None

        try:
            tempo_uso = int(
                credenciais.get("tempoUso")
                or credenciais.get("validadeDias")
                or credenciais.get("validade")
            )
        except (TypeError, ValueError):
            return None

        if tempo_uso < 0:
            return None

        return created_at + timedelta(days=tempo_uso)

    def credenciais_expiradas(self, credenciais, reference_time=None):
        if not isinstance(credenciais, dict):
            return False

        expiration_date = self.calcular_data_expiracao_credenciais(credenciais)
        if not expiration_date:
            return False

        now = reference_time or datetime.now(timezone.utc)
        return now >= expiration_date

    def limpar_credenciais_expiradas(self, dados, persist=False, dados_file=None):
        if not isinstance(dados, dict):
            return dados, False, []

        empresas = dados.get("empresas", [])
        if not isinstance(empresas, list):
            return dados, False, []

        changed = False
        empresas_expiradas = []
        empresas_atualizadas = []
        now = datetime.now(timezone.utc)

        for empresa in empresas:
            if not isinstance(empresa, dict):
                empresas_atualizadas.append(empresa)
                continue

            empresa_atualizada = dict(empresa)
            credenciais = empresa_atualizada.get("credenciais")

            if self.credenciais_expiradas(credenciais, reference_time=now):
                empresa_normalizada = self.normalizar_empresa(empresa_atualizada) or {}
                empresas_expiradas.append(empresa_normalizada.get("codigo", "SEM_CODIGO"))
                empresa_atualizada["credenciais"] = None
                changed = True

            empresas_atualizadas.append(empresa_atualizada)

        if not changed:
            return dados, False, []

        dados_atualizados = dict(dados)
        dados_atualizados["empresas"] = empresas_atualizadas

        if persist and dados_file is not None:
            self.file_utils.save_json_file(dados_file, dados_atualizados)

        if empresas_expiradas:
            print(
                f"Credenciais expiradas removidas automaticamente: {', '.join(empresas_expiradas)}"
            )

        return dados_atualizados, True, empresas_expiradas

    def carregar_dados_empresas_atualizados(self):
        dados_file = self.file_utils.find_json_file("dados.json")
        dados = self.file_utils.load_json_file(dados_file, {"empresas": []})
        dados_atualizados, _, _ = self.limpar_credenciais_expiradas(
            dados,
            persist=True,
            dados_file=dados_file,
        )
        return dados_file, dados_atualizados

    def obter_empresas(self):
        """Obtem lista de empresas do dados.json no formato estruturado."""
        try:
            _, dados = self.carregar_dados_empresas_atualizados()
            empresas = self.normalizar_empresas(dados.get("empresas", []))
            return empresas
        except Exception as e:
            print(f"Erro ao obter empresas: {e}")
            return []

    def obter_empresas_publicas(self):
        try:
            empresas = self.obter_empresas()
            return [
                empresa_publica
                for empresa_publica in (self.serializar_empresa_publica(empresa) for empresa in empresas)
                if empresa_publica and empresa_publica.get("codigo")
            ]
        except Exception as e:
            print(f"Erro ao obter empresas publicas: {e}")
            return []

    def adicionar_empresa(self, nova_empresa):
        """Adiciona nova empresa ao dados.json."""
        try:
            dados_file, dados = self.carregar_dados_empresas_atualizados()

            empresa_normalizada = self.normalizar_empresa(nova_empresa)
            if not empresa_normalizada:
                return False, "Estrutura de empresa invalida"

            sigla = empresa_normalizada["codigo"]
            empresas_existentes = self.normalizar_empresas(dados.get("empresas", []))

            for empresa in empresas_existentes:
                if empresa.get("codigo") == sigla:
                    return False, f"Empresa com sigla {sigla} ja existe"

            empresas_existentes.append(empresa_normalizada)
            dados["empresas"] = empresas_existentes

            sucesso = self.file_utils.save_json_file(dados_file, dados)
            if sucesso:
                return True, f"Empresa {sigla} adicionada com sucesso"

            return False, "Erro ao salvar dados"

        except Exception as e:
            print(f"Erro ao adicionar empresa: {e}")
            return False, f"Erro interno: {str(e)}"

    def buscar_empresa_por_termo(self, termo):
        """Busca empresas por sigla, primeiro nome ou substring."""
        try:
            empresas = self.obter_empresas()
            termo = termo.upper().strip()

            resultados = []

            for empresa in empresas:
                sigla = empresa.get("codigo", "")
                nome = empresa.get("nome", "")
                if not sigla:
                    continue

                nome_upper = nome.upper()
                primeiro_nome = nome.split(" ")[0].upper() if nome else ""

                if sigla == termo:
                    resultados.append(empresa)
                elif primeiro_nome.startswith(termo):
                    resultados.append(empresa)
                elif termo in nome_upper:
                    resultados.append(empresa)

            return resultados

        except Exception as e:
            print(f"Erro ao buscar empresas: {e}")
            return []

    def buscar_empresa_publica_por_termo(self, termo):
        try:
            resultados = self.buscar_empresa_por_termo(termo)
            return [
                empresa_publica
                for empresa_publica in (self.serializar_empresa_publica(empresa) for empresa in resultados)
                if empresa_publica and empresa_publica.get("codigo")
            ]
        except Exception as e:
            print(f"Erro ao buscar empresas publicas: {e}")
            return []

    def validar_login_empresa(self, usuario, token):
        normalized_user = str(usuario or "").strip().lower()
        normalized_token = str(token or "").strip()

        if not normalized_user or not normalized_token:
            return {
                "success": False,
                "reason": "missing_credentials",
                "message": "Usuario e token sao obrigatorios.",
            }

        try:
            _, dados = self.carregar_dados_empresas_atualizados()
            empresas = self.normalizar_empresas(dados.get("empresas", []))
        except Exception as e:
            print(f"Erro ao carregar empresas para login: {e}")
            return {
                "success": False,
                "reason": "load_error",
                "message": "Nao foi possivel carregar empresas para autenticacao.",
            }

        empresa_por_usuario = None

        for empresa in empresas:
            credenciais = empresa.get("credenciais")
            if not isinstance(credenciais, dict):
                continue

            empresa_usuario = str(credenciais.get("usuario", "")).strip()
            empresa_token = str(credenciais.get("token", "")).strip()

            if not empresa_usuario or not empresa_token:
                continue

            if empresa_usuario.lower() != normalized_user:
                continue

            empresa_por_usuario = empresa

            if empresa_token != normalized_token:
                break

            if self.credenciais_expiradas(credenciais):
                return {
                    "success": False,
                    "reason": "expired",
                    "message": "Token expirado. Solicite um novo acesso.",
                }

            expiration_date = self.calcular_data_expiracao_credenciais(credenciais)

            return {
                "success": True,
                "empresa": self.serializar_empresa_publica(empresa),
                "session": {
                    "empresaCodigo": empresa.get("codigo", ""),
                    "empresaNome": empresa.get("nome", ""),
                    "usuario": empresa_usuario,
                    "expiraEm": expiration_date.isoformat() if expiration_date else None,
                },
            }

        return {
            "success": False,
            "reason": "invalid_token" if empresa_por_usuario else "user_not_found",
            "message": "Token invalido." if empresa_por_usuario else "Usuario nao encontrado.",
        }

    def obter_proximo_numero_cliente(self, sigla):
        """Obtem proximo numero de cliente para uma sigla."""
        try:
            backup_file = self.file_utils.find_json_file("backup.json")
            backup_data = self.file_utils.load_json_file(backup_file, {"obras": []})

            if not backup_data or "obras" not in backup_data:
                return 1

            obras = backup_data["obras"]
            maior_numero = 0

            for obra in obras:
                if obra.get("empresaSigla") == sigla:
                    numero = obra.get("numeroClienteFinal", 0)
                    if numero > maior_numero:
                        maior_numero = numero

                id_gerado = obra.get("idGerado", "")
                if id_gerado.startswith(f"obra_{sigla}_"):
                    try:
                        numero_str = id_gerado.split("_")[-1]
                        numero = int(numero_str)
                        if numero > maior_numero:
                            maior_numero = numero
                    except (ValueError, IndexError):
                        continue

            return maior_numero + 1
        except Exception as e:
            print(f"Erro ao obter proximo numero do cliente: {e}")
            return 1

    def adicionar_empresa_automatica(self, sigla, nome_completo):
        """Adiciona nova empresa automaticamente ao dados.json no formato correto."""
        try:
            if not sigla or not nome_completo:
                return False, "Sigla e nome sao obrigatorios"

            import re

            if not re.match(r"^[A-Z]{2,6}$", sigla):
                return False, "Sigla deve conter 2-6 letras maiusculas"

            dados_file, dados = self.carregar_dados_empresas_atualizados()
            empresas_existentes = self.normalizar_empresas(dados.get("empresas", []))

            for empresa in empresas_existentes:
                if empresa.get("codigo") == sigla:
                    return True, f"Empresa com sigla {sigla} ja existe"

            nova_empresa = {
                "codigo": sigla,
                "nome": nome_completo,
                "credenciais": None,
            }
            empresas_existentes.append(nova_empresa)
            dados["empresas"] = empresas_existentes

            sucesso = self.file_utils.save_json_file(dados_file, dados)
            if sucesso:
                print(f"Empresa salva no formato correto: {sigla} - {nome_completo}")
                return True, f"Empresa {sigla} - {nome_completo} cadastrada com sucesso"

            return False, "Erro ao salvar dados"

        except Exception as e:
            print(f"Erro ao adicionar empresa automaticamente: {e}")
            return False, f"Erro interno: {str(e)}"

    def verificar_e_criar_empresa_automatica(self, obra_data):
        """Verifica se precisa criar empresa automaticamente a partir dos dados da obra."""
        try:
            empresa_sigla = obra_data.get("empresaSigla")
            empresa_nome = obra_data.get("empresaNome")

            if not empresa_sigla or not empresa_nome:
                print("Sem dados de empresa na obra")
                return obra_data

            print(f"Verificando empresa: {empresa_sigla} - {empresa_nome}")

            empresas_existentes = self.obter_empresas()
            empresa_ja_existe = False

            for empresa in empresas_existentes:
                if empresa.get("codigo") == empresa_sigla:
                    empresa_ja_existe = True
                    print(f"Empresa {empresa_sigla} ja existe no sistema")
                    break

            if not empresa_ja_existe:
                print(f"Criando nova empresa: {empresa_sigla} - {empresa_nome}")
                success, message = self.adicionar_empresa_automatica(
                    empresa_sigla, empresa_nome
                )

                if success:
                    print(f"Empresa criada com sucesso: {message}")
                    if hasattr(self, "empresas_cache"):
                        self.empresas_cache = None
                else:
                    print(f"Erro ao criar empresa: {message}")

            return obra_data
        except Exception as e:
            print(f"Erro ao verificar/criar empresa: {e}")
            return obra_data
