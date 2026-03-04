"""
wordPC_generator.py - Gerador de Proposta Comercial (PC)
"""

import json
import os
import hashlib
import shutil
import tempfile
import traceback
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict

import pytz
from docxtpl import DocxTemplate


class WordPCGenerator:
    """Gerador específico para Proposta Comercial - VERSÃO OTIMIZADA"""
    
    def __init__(self, project_root: Path, file_utils):
        self.project_root = project_root
        self.file_utils = file_utils


    # ----------------------------------------------------------------------
    # Métodos de leitura de dados
    # ----------------------------------------------------------------------
    def _load_json(self, filename: str) -> Dict:
        """Carrega um arquivo JSON do diretório 'json'."""
        path = self.project_root / "json" / filename
        if not path.exists():
            return {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Erro ao carregar {filename}: {e}")
            return {}

    def get_dados_data(self) -> Dict:
        """Obtém dados do sistema (machines, constants, etc.)"""
        return self._load_json("dados.json")

    def get_backup_data(self) -> Dict:
        """Obtém dados de backup"""
        return self._load_json("backup.json")

    def _find_obra_by_id(self, backup_data: Dict, obra_id: str) -> Optional[Dict]:
        """Busca obra específica na estrutura de backup já carregada."""
        obras = backup_data.get("obras", [])
        for obra in obras:
            if str(obra.get("id")) == obra_id:
                return obra
        return None

    # ----------------------------------------------------------------------
    # Métodos auxiliares de formatação
    # ----------------------------------------------------------------------
    @staticmethod
    def format_currency(value: float) -> str:
        """Formata valor monetário no padrão brasileiro."""
        if not value:
            return "R$ 0,00"
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    # ----------------------------------------------------------------------
    # Agrupamento otimizado de máquinas
    # ----------------------------------------------------------------------
    def group_maquinas_by_type_and_impostos(self, maquinas: List[Dict]) -> List[Tuple[List[Dict], Dict]]:
        """
        Agrupa máquinas por tipo e impostos usando dicionário (O(n)).
        Retorna lista de (lista_de_maquinas, impostos_do_grupo).
        """
        grupos = defaultdict(lambda: {"maquinas": [], "impostos": None})
        
        for maq in maquinas:
            chave = (
                maq.get("tipo", ""),
                maq.get("fornecedor", ""),
                maq.get("frete", ""),
                maq.get("icms", ""),
                maq.get("ipi", "")
            )
            grupo = grupos[chave]
            grupo["maquinas"].append(maq)
            # Define os impostos apenas uma vez (baseado na primeira máquina)
            if grupo["impostos"] is None:
                grupo["impostos"] = {
                    "tipo_maquina": maq.get("tipo", ""),
                    "fornecedor": maq.get("fornecedor", ""),
                    "frete": maq.get("frete", ""),
                    "icms": maq.get("icms", ""),
                    "ipi": maq.get("ipi", ""),
                    "pis_cofins": maq.get("pis_cofins", ""),
                    "prazo": maq.get("prazo", "")
                }
        
        # Converter para o formato de saída esperado
        return [(g["maquinas"], g["impostos"]) for g in grupos.values()]

    def organize_maquinas_for_template(self, maquinas: List[Dict]) -> List[Dict]:
        """
        Organiza máquinas para o template: lista de grupos com máquinas e impostos.
        """
        grupos_tipo_impostos = self.group_maquinas_by_type_and_impostos(maquinas)
        resultado = []
        for grupo_maquinas, impostos in grupos_tipo_impostos:
            resultado.append({
                "maquinas": grupo_maquinas,
                "tem_multiplas_maquinas": len(grupo_maquinas) > 1,
                "impostos": impostos,
                "tem_impostos": any([
                    impostos.get("fornecedor"),
                    impostos.get("frete"),
                    impostos.get("icms"),
                    impostos.get("ipi")
                ])
            })
        return resultado

    # ----------------------------------------------------------------------
    # Extração de itens por projeto/aplicação (com dados de máquinas)
    # ----------------------------------------------------------------------
    def extract_items_by_aplicacao_and_projeto(self, projetos: List[Dict], dados_data: Dict) -> List[Dict]:
        """
        Extrai máquinas, dutos e acessórios agrupados por projeto e aplicação.
        Recebe dados_data (já carregado) para evitar leituras repetidas.
        """
        projetos_resultado = []
        machines_data = dados_data.get("machines", [])  # lista de máquinas do BD

        for projeto_index, projeto in enumerate(projetos):
            if not isinstance(projeto, dict):
                continue

            projeto_nome = projeto.get("nome", f"Projeto {projeto_index + 1}")
            # Valor total do projeto já está no campo original (será usado depois)
            # Não recalculamos aqui

            # Definição das aplicações na ordem correta
            aplicacoes = [
                {"tipo": "climatizacao", "nome": "Climatização", "maquinas": [], "dutos": [], "acessorios": []},
                {"tipo": "pressurizacao", "nome": "Pressurização/Ventilação", "maquinas": [], "dutos": [], "acessorios": []},
                {"tipo": "exaustao_bateria", "nome": "Exaustão Sala de Bateria", "maquinas": [], "dutos": [], "acessorios": []},
                {"tipo": "exaustao_baia_trafo", "nome": "Exaustão Baia de Trafo", "maquinas": [], "dutos": [], "acessorios": []}
            ]
            aplicacoes_dict = {app["tipo"]: app for app in aplicacoes}

            salas = projeto.get("salas", [])
            for sala in salas:
                if not isinstance(sala, dict):
                    continue

                ambiente_nome = sala.get("nome", "Ambiente")

                # ----- Máquinas -----
                maquinas = sala.get("maquinas", [])
                for maquina in maquinas:
                    if not isinstance(maquina, dict):
                        continue

                    aplicacao_tipo = maquina.get("aplicacao_machines", "").lower()
                    if aplicacao_tipo not in aplicacoes_dict:
                        continue

                    # Buscar dados da máquina no BD (machines_data)
                    machine_data = next(
                        (m for m in machines_data if m.get("type") == maquina.get("tipo", "")),
                        {}
                    )

                    # Obter impostos (das opções selecionadas ou padrão)
                    impostos = {}
                    opcoes_selecionadas = maquina.get("opcoesSelecionadas", [])
                    # Se opcoesSelecionadas for lista de strings ou dicionários?
                    # No exemplo, é lista de dicionários com "name". Adaptar conforme necessário.
                    if opcoes_selecionadas and isinstance(opcoes_selecionadas[0], dict):
                        for opcao in opcoes_selecionadas:
                            opcao_nome = opcao.get("name")
                            # encontrar a opção no machine_data
                            opt_data = next(
                                (opt for opt in machine_data.get("options", []) if opt.get("name") == opcao_nome),
                                {}
                            )
                            if opt_data.get("impostos"):
                                impostos.update(opt_data["impostos"])
                    elif isinstance(opcoes_selecionadas, list) and all(isinstance(x, str) for x in opcoes_selecionadas):
                        # Caso sejam apenas nomes (strings)
                        for opcao_nome in opcoes_selecionadas:
                            opt_data = next(
                                (opt for opt in machine_data.get("options", []) if opt.get("name") == opcao_nome),
                                {}
                            )
                            if opt_data.get("impostos"):
                                impostos.update(opt_data["impostos"])

                    # Se não encontrou nas opções, usar impostos padrão da máquina
                    if not impostos and machine_data.get("impostos"):
                        impostos.update(machine_data["impostos"])

                    # Fornecedor
                    fornecedor = "Não especificado"
                    for key in ["FORNECEDOR", "FABRICANTE", "MARCA"]:
                        if key in impostos:
                            fornecedor = impostos[key]
                            break

                    maquina_template = {
                        "tipo": maquina.get("tipo", ""),
                        "nome": maquina.get("nome", ""),
                        "potencia": maquina.get("potencia", ""),
                        "quantidade": maquina.get("quantidade", 1),
                        "preco_total": maquina.get("precoTotal", 0),
                        "preco_total_formatado": self.format_currency(maquina.get("precoTotal", 0)),
                        "ambiente": ambiente_nome,
                        "opcoes": maquina.get("opcoesSelecionadas", []),
                        "configuracoes": maquina.get("configuracoesSelecionadas", []),
                        "fornecedor": fornecedor,
                        "frete": impostos.get("FRETE", ""),
                        "icms": impostos.get("ICMS", ""),
                        "ipi": impostos.get("IPI", ""),
                        "pis_cofins": impostos.get("PIS_COFINS", ""),
                        "prazo": impostos.get("PRAZO", ""),
                        "impostos": impostos,
                        "dados_completos": maquina,
                        "descricao_completa": f"{maquina.get('tipo', '')} de {maquina.get('potencia', '')}"
                    }
                    aplicacoes_dict[aplicacao_tipo]["maquinas"].append(maquina_template)

                # ----- Dutos (sem dimensão) -----
                dutos = sala.get("dutos", [])
                for duto in dutos:
                    if not isinstance(duto, dict):
                        continue
                    aplicacao_tipo = duto.get("aplicacao_Dutos", "").lower()
                    if aplicacao_tipo not in aplicacoes_dict:
                        continue

                    tipo_duto = duto.get("tipo_descricao", duto.get("tipo", "Duto"))
                    duto_template = {
                        "tipo": tipo_duto,
                        "tipo_descricao": tipo_duto,
                        "dimensao": duto.get("dimensao", ""),  # compatibilidade, não usado
                        "quantidade": duto.get("quantidade", 1),
                        "preco_total": duto.get("valor_total", 0),
                        "preco_total_formatado": self.format_currency(duto.get("valor_total", 0)),
                        "ambiente": ambiente_nome,
                        "material": duto.get("tipo", ""),
                        "valor_unitario": duto.get("valor_unitario", 0),
                        "valor_unitario_formatado": self.format_currency(duto.get("valor_unitario", 0)),
                        "descricao": duto.get("descricao", "")
                    }
                    aplicacoes_dict[aplicacao_tipo]["dutos"].append(duto_template)

                # ----- Acessórios (com dimensão) -----
                acessorios = sala.get("acessorios", [])
                for acessorio in acessorios:
                    if not isinstance(acessorio, dict):
                        continue
                    aplicacao_tipo = acessorio.get("aplicacao_Acessorio", "").lower()
                    if aplicacao_tipo not in aplicacoes_dict:
                        continue

                    acessorio_template = {
                        "tipo": acessorio.get("tipo", "Acessório"),
                        "dimensao": acessorio.get("dimensao", ""),
                        "quantidade": acessorio.get("quantidade", 1),
                        "descricao": acessorio.get("descricao", ""),
                        "preco_total": acessorio.get("valor_total", 0),
                        "preco_total_formatado": self.format_currency(acessorio.get("valor_total", 0)),
                        "ambiente": ambiente_nome,
                        "valor_unitario": acessorio.get("valor_unitario", 0),
                        "valor_unitario_formatado": self.format_currency(acessorio.get("valor_unitario", 0)),
                        "tem_dimensao": bool(acessorio.get("dimensao", "").strip())
                    }
                    aplicacoes_dict[aplicacao_tipo]["acessorios"].append(acessorio_template)

            # Construir lista final de aplicações (somente as não vazias)
            aplicacoes_com_totais = []
            for app in aplicacoes:
                # Totais por categoria (somente para exibição)
                total_maquinas = sum(m.get("preco_total", 0) for m in app["maquinas"])
                total_dutos = sum(d.get("preco_total", 0) for d in app["dutos"])
                total_acessorios = sum(a.get("preco_total", 0) for a in app["acessorios"])
                total_aplicacao = total_maquinas + total_dutos + total_acessorios

                if not (app["maquinas"] or app["dutos"] or app["acessorios"]):
                    continue

                # Organizar máquinas para template (agrupamento)
                maquinas_organizadas = self.organize_maquinas_for_template(app["maquinas"])

                app.update({
                    "maquinas_organizadas": maquinas_organizadas,
                    "tem_maquinas": len(maquinas_organizadas) > 0,
                    "total_maquinas": total_maquinas,
                    "total_maquinas_formatado": self.format_currency(total_maquinas),
                    "total_dutos": total_dutos,
                    "total_dutos_formatado": self.format_currency(total_dutos),
                    "total_acessorios": total_acessorios,
                    "total_acessorios_formatado": self.format_currency(total_acessorios),
                    "total_aplicacao": total_aplicacao,
                    "total_aplicacao_formatado": self.format_currency(total_aplicacao),
                    "quantidade_maquinas": len(app["maquinas"]),
                    "quantidade_dutos": len(app["dutos"]),
                    "quantidade_acessorios": len(app["acessorios"])
                })
                aplicacoes_com_totais.append(app)

            # Extrair serviços do projeto
            servicos = self._extract_servicos_from_projeto(projeto)

            # Adicionar projeto ao resultado (usando valor original)
            projetos_resultado.append({
                "nome": projeto_nome,
                "valor_total_projeto": projeto.get("valorTotalProjeto", 0),   # ← valor original
                "valor_total_projeto_formatado": self.format_currency(projeto.get("valorTotalProjeto", 0)),
                "aplicacoes_groups": aplicacoes_com_totais,
                "servicos": servicos,
                "tem_servicos": servicos["tem_engenharia"] or servicos["tem_adicionais"]
            })

        return projetos_resultado

    def _extract_servicos_from_projeto(self, projeto: Dict) -> Dict:
        """Extrai informações de serviços de um projeto específico."""
        servicos_info = {
            "engenharia": {
                "valor": 0,
                "descricao": "",
                "valor_formatado": "R$ 0,00",
                "tem_engenharia": False
            },
            "adicionais": [],
            "tem_adicionais": False,
            "tem_engenharia": False
        }
        if not isinstance(projeto, dict):
            return servicos_info

        servicos = projeto.get("servicos", {})
        if not isinstance(servicos, dict):
            return servicos_info

        # Engenharia
        engenharia = servicos.get("engenharia", {})
        if isinstance(engenharia, dict) and engenharia.get("valor", 0) > 0:
            servicos_info["engenharia"]["valor"] = engenharia.get("valor", 0)
            servicos_info["engenharia"]["descricao"] = engenharia.get("descricao", "")
            servicos_info["engenharia"]["valor_formatado"] = self.format_currency(engenharia.get("valor", 0))
            servicos_info["engenharia"]["tem_engenharia"] = True
            servicos_info["tem_engenharia"] = True

        # Adicionais
        adicionais = servicos.get("adicionais", [])
        if isinstance(adicionais, list) and adicionais:
            servicos_info["tem_adicionais"] = True
            for adicional in adicionais:
                if isinstance(adicional, dict):
                    servicos_info["adicionais"].append({
                        "descricao": adicional.get("descricao", ""),
                        "valor": adicional.get("valor", 0),
                        "valor_formatado": self.format_currency(adicional.get("valor", 0))
                    })

        return servicos_info

    # ----------------------------------------------------------------------
    # Geração do contexto para o template
    # ----------------------------------------------------------------------
    def generate_context_for_pc(self, obra_id: str) -> Dict:
        """
        Gera contexto completo para Proposta Comercial.
        Carrega dados de apoio uma única vez.
        """
        try:
            # Carrega dados uma única vez
            dados_data = self.get_dados_data()
            backup_data = self.get_backup_data()

            # Busca a obra
            obra_data = self._find_obra_by_id(backup_data, obra_id)
            if not obra_data:
                print(f"⚠️ Obra {obra_id} não encontrada - gerando documento com valores padrão")
                # Fallback com dados mínimos
                tz = pytz.timezone('America/Sao_Paulo') if pytz else None
                data_atual = datetime.now(tz) if tz else datetime.now()
                return {
                    "data_emissao": data_atual.strftime("%d/%m/%Y"),
                    "data_emissao_completa": data_atual.strftime("%d de %B de %Y"),
                    "empresa_nome": "EMPRESA NÃO ESPECIFICADA",
                    "obra_nome": "OBRA NÃO ESPECIFICADA",
                    "cliente_final": "CLIENTE NÃO ESPECIFICADO",
                    "projetos": [],
                    "quantidade_projetos": 0,
                    "total_global": self.format_currency(0),
                    "valor_total_projeto": self.format_currency(0),
                    "format_currency": self.format_currency
                }

            # Dados básicos
            empresa_nome = obra_data.get("empresaNome", "EMPRESA NÃO ESPECIFICADA")
            obra_nome = obra_data.get("nome", "OBRA NÃO ESPECIFICADA")
            cliente_final = obra_data.get("clienteFinal", "CLIENTE NÃO ESPECIFICADO")

            # Projetos
            projetos = obra_data.get("projetos", [])

            # Extrair itens por projeto (passando dados_data já carregado)
            projetos_com_dados = self.extract_items_by_aplicacao_and_projeto(projetos, dados_data)

            # Data atual
            try:
                tz = pytz.timezone('America/Sao_Paulo')
                data_atual = datetime.now(tz)
            except:
                data_atual = datetime.now()

            # Total global da obra (usar o valor salvo)
            total_global = obra_data.get("valorTotalObra", 0)

            # Preparar projetos para o template (sem recálculo)
            projetos_para_template = []
            for proj in projetos_com_dados:
                projetos_para_template.append({
                    "nome": proj["nome"],
                    "aplicacoes_groups": proj["aplicacoes_groups"],
                    "valor_total_projeto": proj["valor_total_projeto"],
                    "valor_total_projeto_formatado": proj["valor_total_projeto_formatado"],
                    "servicos": proj["servicos"],
                    "tem_servicos": proj["tem_servicos"]
                })

            # Se não houver projetos na estrutura extraída, criar lista vazia
            if not projetos_para_template and projetos:
                for proj in projetos:
                    if isinstance(proj, dict):
                        projetos_para_template.append({
                            "nome": proj.get("nome", "Projeto não especificado"),
                            "aplicacoes_groups": [],
                            "valor_total_projeto": proj.get("valorTotalProjeto", 0),
                            "valor_total_projeto_formatado": self.format_currency(proj.get("valorTotalProjeto", 0)),
                            "servicos": {
                                "engenharia": {"valor": 0, "descricao": "", "valor_formatado": "R$ 0,00", "tem_engenharia": False},
                                "adicionais": [],
                                "tem_adicionais": False,
                                "tem_engenharia": False
                            },
                            "tem_servicos": False
                        })

            context = {
                "data_emissao": data_atual.strftime("%d/%m/%Y"),
                "data_emissao_completa": data_atual.strftime("%d de %B de %Y"),
                "empresa_nome": empresa_nome.upper(),
                "obra_nome": obra_nome,
                "cliente_final": cliente_final,
                "projetos": projetos_para_template,
                "quantidade_projetos": len(projetos_para_template),
                "total_global": self.format_currency(total_global),
                "valor_total_projeto": self.format_currency(total_global),  # compatibilidade
                "format_currency": self.format_currency
            }

            print(f"📋 Contexto gerado para PC: {obra_nome} - Total: {context['total_global']}")
            return context

        except Exception as e:
            print(f"❌ Erro ao gerar contexto PC: {e}")
            traceback.print_exc()
            # Fallback mínimo
            data_atual = datetime.now()
            return {
                "data_emissao": data_atual.strftime("%d/%m/%Y"),
                "data_emissao_completa": data_atual.strftime("%d de %B de %Y"),
                "empresa_nome": "EMPRESA NÃO ESPECIFICADA",
                "obra_nome": "OBRA NÃO ESPECIFICADA",
                "cliente_final": "CLIENTE NÃO ESPECIFICADO",
                "projetos": [],
                "quantidade_projetos": 0,
                "total_global": self.format_currency(0),
                "valor_total_projeto": self.format_currency(0),
                "format_currency": self.format_currency
            }


    # ----------------------------------------------------------------------
    # Geração do documento
    # ----------------------------------------------------------------------
    def generate_proposta_comercial(self, obra_id: str, template_path: Path) -> Optional[str]:
        """
        Gera documento de Proposta Comercial.
        """
        try:

            # Verificar template
            if not template_path.exists():
                print(f"❌ Template não encontrado: {template_path}")
                return None

            # Gerar contexto
            context = self.generate_context_for_pc(obra_id)
            if not context:
                raise ValueError("Não foi possível gerar contexto para a PC")

            # Carregar e renderizar template (uma única vez)
            doc = DocxTemplate(str(template_path))
            doc.render(context)

            # Salvar em arquivo temporário
            with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as tmp:
                output_path = tmp.name
                doc.save(output_path)


            print(f"✅ Proposta Comercial gerada: {output_path}")
            return output_path

        except Exception as e:
            print(f"❌ Erro ao gerar Proposta Comercial: {e}")
            traceback.print_exc()
            return None

    # ----------------------------------------------------------------------
    # Geração de nome de arquivo
    # ----------------------------------------------------------------------
    def generate_filename(self, obra_data: Dict, template_type: str) -> str:
        """Gera nome do arquivo no formato PC_Obra_empresaSigla_numeroClienteFinal_DD-MM-AAAA"""
        try:
            empresa_nome = obra_data.get("empresaNome", "")
            sigla = obra_data.get("empresaSigla", "")

            if not sigla and empresa_nome:
                match = re.search(r'\(([^)]+)\)', empresa_nome)
                if match:
                    sigla = match.group(1)
                else:
                    palavras = empresa_nome.split()
                    if palavras:
                        sigla = ''.join([p[0].upper() for p in palavras if p])

            if not sigla:
                sigla = "EMP/P"

            cliente_numero = obra_data.get("clienteNumero", "")
            if not cliente_numero:
                cliente_final = obra_data.get("clienteFinal", "")
                if cliente_final:
                    numeros = re.findall(r'\d+', cliente_final)
                    if numeros:
                        cliente_numero = numeros[0]
                    else:
                        cliente_numero = "001"
                else:
                    cliente_numero = "001"

            sigla_limpa = re.sub(r'[^a-zA-Z0-9]', '', sigla)
            numero_limpo = re.sub(r'[^a-zA-Z0-9]', '', str(cliente_numero))

            prefixo = "PC_Obra" if template_type.lower() in ["comercial", "pc"] else template_type.upper()

            try:
                tz = pytz.timezone('America/Sao_Paulo')
                data_atual = datetime.now(tz)
            except:
                data_atual = datetime.now()
            data_formatada = data_atual.strftime("%d-%m-%Y")

            return f"{prefixo}_{sigla_limpa}_{numero_limpo}_{data_formatada}.docx"

        except Exception as e:
            print(f"❌ Erro ao gerar nome do arquivo: {e}")
            return f"PC_Obra_{datetime.now().strftime('%d-%m-%Y')}.docx"