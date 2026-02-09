# servidor_modules/generators/wordPC_generator.py
"""
wordPC_generator.py - Gerador de Proposta Comercial (PC) - VERSÃO CORRIGIDA FINAL
"""

import json
import os
from datetime import datetime
from pathlib import Path
from docxtpl import DocxTemplate
import traceback
from typing import Dict, List, Any, Optional, Tuple
import re

class WordPCGenerator:
    """Gerador específico para Proposta Comercial - VERSÃO CORRIGIDA FINAL"""
    
    def __init__(self, project_root: Path, file_utils):
        self.project_root = project_root
        self.file_utils = file_utils
        
    def get_dados_data(self) -> Dict:
        """Obtém dados do sistema (machines, constants, etc.)"""
        try:
            dados_file = self.project_root / "json" / "dados.json"
            if not dados_file.exists():
                return {}
            
            with open(dados_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Erro ao carregar dados.json: {e}")
            return {}
    
    def get_backup_data(self) -> Dict:
        """Obtém dados de backup"""
        try:
            backup_file = self.project_root / "json" / "backup.json"
            if not backup_file.exists():
                return {}
            
            with open(backup_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Erro ao carregar backup.json: {e}")
            return {}
    
    def get_obra_by_id(self, obra_id: str) -> Optional[Dict]:
        """Busca obra específica no backup"""
        backup_data = self.get_backup_data()
        obras = backup_data.get("obras", [])
        
        for obra in obras:
            if str(obra.get("id")) == obra_id:
                return obra
        
        return None
    
    def get_machine_data_by_type(self, machine_type: str) -> Optional[Dict]:
        """Busca dados de máquina específica"""
        dados_data = self.get_dados_data()
        machines = dados_data.get("machines", [])
        
        for machine in machines:
            if machine.get("type") == machine_type:
                return machine
        
        return None
    
    def format_currency(self, value: float) -> str:
        """Formata valor monetário"""
        if not value:
            return "R$ 0,00"
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    
    def group_maquinas_by_type_and_impostos(self, maquinas: List[Dict]) -> List[Tuple[List[Dict], Dict]]:
        """Agrupa máquinas por tipo e depois mostra impostos após todas as máquinas do mesmo tipo"""
        grupos = []
        maquinas_processadas = []
        
        for maquina in maquinas:
            # Verificar se esta máquina já foi processada
            if maquina in maquinas_processadas:
                continue
            
            # Criar chave única para tipo e impostos
            tipo_maquina = maquina.get("tipo", "")
            chave_grupo = (
                tipo_maquina,
                maquina.get("fornecedor", ""),
                maquina.get("frete", ""),
                maquina.get("icms", ""),
                maquina.get("ipi", "")
            )
            
            # Encontrar todas as máquinas do mesmo tipo com os mesmos impostos
            grupo_maquinas = []
            for outra_maquina in maquinas:
                if outra_maquina in maquinas_processadas:
                    continue
                    
                outra_chave = (
                    outra_maquina.get("tipo", ""),
                    outra_maquina.get("fornecedor", ""),
                    outra_maquina.get("frete", ""),
                    outra_maquina.get("icms", ""),
                    outra_maquina.get("ipi", "")
                )
                
                if chave_grupo == outra_chave:
                    grupo_maquinas.append(outra_maquina)
                    maquinas_processadas.append(outra_maquina)
            
            if grupo_maquinas:
                # Criar resumo de impostos para o grupo
                impostos_grupo = {
                    "tipo_maquina": tipo_maquina,
                    "fornecedor": maquina.get("fornecedor", ""),
                    "frete": maquina.get("frete", ""),
                    "icms": maquina.get("icms", ""),
                    "ipi": maquina.get("ipi", ""),
                    "pis_cofins": maquina.get("pis_cofins", ""),
                    "prazo": maquina.get("prazo", "")
                }
                
                grupos.append((grupo_maquinas, impostos_grupo))
        
        return grupos
    
    def organize_maquinas_for_template(self, maquinas: List[Dict]) -> List[Dict]:
        """
        Organiza máquinas para o template no formato desejado:
        - Lista de grupos, onde cada grupo tem:
          - Lista de máquinas do mesmo tipo
          - Informações de impostos (após todas as máquinas do grupo)
        """
        # Primeiro, agrupar todas as máquinas por tipo e impostos
        grupos_tipo_impostos = self.group_maquinas_by_type_and_impostos(maquinas)
        
        # Agora vamos processar cada grupo para o formato final
        resultado = []
        
        for grupo_maquinas, impostos in grupos_tipo_impostos:
            # Para cada grupo, adicionar as máquinas e depois os impostos
            grupo_para_template = {
                "maquinas": grupo_maquinas,
                "tem_multiplas_maquinas": len(grupo_maquinas) > 1,
                "impostos": impostos,
                "tem_impostos": any([
                    impostos.get("fornecedor"),
                    impostos.get("frete"),
                    impostos.get("icms"),
                    impostos.get("ipi")
                ])
            }
            resultado.append(grupo_para_template)
        
        return resultado
    
    def extract_items_by_aplicacao_and_projeto(self, projetos: List[Dict]) -> List[Dict]:
        """
        Extrai máquinas, dutos e acessórios agrupados por projeto e aplicação
        ESTRUTURA: Lista de projetos -> cada projeto tem suas aplicações
        """
        projetos_resultado = []
        
        for projeto_index, projeto in enumerate(projetos):
            if not isinstance(projeto, dict):
                continue
                
            projeto_nome = projeto.get("nome", f"Projeto {projeto_index + 1}")
            projeto_valor = projeto.get("valorTotalProjeto", 0)
            
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
                
                # Processar máquinas
                maquinas = sala.get("maquinas", [])
                for maquina in maquinas:
                    if not isinstance(maquina, dict):
                        continue
                    
                    # Obter aplicação da máquina
                    aplicacao_tipo = maquina.get("aplicacao_machines", "").lower()
                    if aplicacao_tipo in aplicacoes_dict:
                        # Buscar dados da máquina no BD
                        machine_data = self.get_machine_data_by_type(maquina.get("tipo", ""))
                        
                        # Obter impostos específicos desta máquina
                        impostos = {}
                        if machine_data:
                            # Obter impostos das opções selecionadas ou do padrão
                            opcoes_selecionadas = maquina.get("opcoesSelecionadas", [])
                            configuracoes_selecionadas = maquina.get("configuracoesSelecionadas", [])
                            
                            # Verificar se há impostos nas opções selecionadas
                            for opcao_nome in opcoes_selecionadas:
                                opcao_data = next((opt for opt in machine_data.get("options", []) 
                                                  if opt.get("name") == opcao_nome), {})
                                if opcao_data.get("impostos"):
                                    impostos.update(opcao_data["impostos"])
                            
                            # Se não encontrou nas opções, usar impostos padrão da máquina
                            if not impostos and machine_data.get("impostos"):
                                impostos.update(machine_data["impostos"])
                        
                        # Buscar fornecedor
                        fornecedor = "Não especificado"
                        fornecedor_keys = ["FORNECEDOR", "FABRICANTE", "MARCA"]
                        for key in fornecedor_keys:
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
                
                # Processar dutos - SEM dimensão
                dutos = sala.get("dutos", [])
                for duto in dutos:
                    if not isinstance(duto, dict):
                        continue
                    
                    aplicacao_tipo = duto.get("aplicacao_Dutos", "").lower()
                    if aplicacao_tipo in aplicacoes_dict:
                        tipo_duto = duto.get("tipo_descricao", duto.get("tipo", "Duto"))
                        
                        duto_template = {
                            "tipo": tipo_duto,
                            "tipo_descricao": tipo_duto,
                            "dimensao": duto.get("dimensao", ""),  # Mantido para compatibilidade, mas não será usado no template
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
                
                # Processar acessórios - COM dimensão
                acessorios = sala.get("acessorios", [])
                for acessorio in acessorios:
                    if not isinstance(acessorio, dict):
                        continue
                    
                    aplicacao_tipo = acessorio.get("aplicacao_Acessorio", "").lower()
                    if aplicacao_tipo in aplicacoes_dict:
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
            
            # Calcular totais por aplicação e remover aplicações vazias
            aplicacoes_com_totais = []
            for app in aplicacoes:
                # Calcular totais
                total_maquinas = sum(m.get("preco_total", 0) for m in app["maquinas"])
                total_dutos = sum(d.get("preco_total", 0) for d in app["dutos"])
                total_acessorios = sum(a.get("preco_total", 0) for a in app["acessorios"])
                total_aplicacao = total_maquinas + total_dutos + total_acessorios
                
                # Adicionar apenas se tiver itens
                if app["maquinas"] or app["dutos"] or app["acessorios"]:
                    # Organizar máquinas para template
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
            
            # Extrair serviços deste projeto
            servicos = self.extract_servicos_from_projeto(projeto)
            
            # Adicionar projeto ao resultado
            projetos_resultado.append({
                "nome": projeto_nome,
                "valor_total_projeto": projeto_valor,
                "valor_total_projeto_formatado": self.format_currency(projeto_valor),
                "aplicacoes_groups": aplicacoes_com_totais,
                "servicos": servicos,
                "tem_servicos": servicos["tem_engenharia"] or servicos["tem_adicionais"]
            })
        
        return projetos_resultado
    
    def extract_servicos_from_projeto(self, projeto: Dict) -> Dict:
        """Extrai informações de serviços de um projeto específico"""
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
    
    def calculate_projeto_total(self, projeto: Dict, aplicacoes_groups: List[Dict]) -> float:
        """Calcula o total real do projeto (soma de itens + serviços)"""
        total_itens = 0
        
        # Somar todos os itens das aplicações
        for app in aplicacoes_groups:
            total_itens += app.get("total_aplicacao", 0)
        
        # Somar serviços
        servicos = self.extract_servicos_from_projeto(projeto)
        total_servicos = servicos["engenharia"]["valor"]
        total_servicos += sum(adicional.get("valor", 0) for adicional in servicos["adicionais"])
        
        return total_itens + total_servicos
    
    def generate_context_for_pc(self, obra_id: str) -> Dict:
        """Gera contexto completo para Proposta Comercial - VERSÃO CORRIGIDA"""
        try:
            # Obter dados da obra
            obra_data = self.get_obra_by_id(obra_id)
            if not obra_data:
                # Se não encontrar obra, ainda pode gerar contexto básico
                print(f"⚠️ Obra {obra_id} não encontrada - gerando documento com valores padrão")
                
                from datetime import datetime
                import pytz
                
                try:
                    tz = pytz.timezone('America/Sao_Paulo')
                    data_atual = datetime.now(tz)
                except:
                    data_atual = datetime.now()
                
                # Retornar contexto básico com valores padrão
                return {
                    "data_emissao": data_atual.strftime("%d/%m/%Y"),
                    "data_emissao_completa": data_atual.strftime("%d de %B de %Y"),
                    "empresa_nome": "EMPRESA NÃO ESPECIFICADA",  # Valor padrão
                    "obra_nome": "OBRA NÃO ESPECIFICADA",  # Valor padrão
                    "cliente_final": "CLIENTE NÃO ESPECIFICADO",  # Valor padrão
                    "projetos": [],  # Lista vazia
                    "quantidade_projetos": 0,
                    "total_global": self.format_currency(0),
                    "valor_total_projeto": self.format_currency(0),
                    "format_currency": self.format_currency
                }
            
            # Dados básicos COM VALORES PADRÃO
            obra_nome = obra_data.get("nome", "OBRA NÃO ESPECIFICADA")
            empresa_nome = obra_data.get("empresaNome", "EMPRESA NÃO ESPECIFICADA")
            cliente_final = obra_data.get("clienteFinal", "CLIENTE NÃO ESPECIFICADO")
            
            # Verificar e aplicar uppercase se necessário
            if obra_nome == "OBRA NÃO ESPECIFICADA":
                obra_nome = obra_nome.upper()
            if empresa_nome == "EMPRESA NÃO ESPECIFICADA":
                empresa_nome = empresa_nome.upper()
            if cliente_final == "CLIENTE NÃO ESPECIFICADO":
                cliente_final = cliente_final.upper()
            
            # Projetos (pode ser vazio)
            projetos = obra_data.get("projetos", [])
            
            # Extrair itens por projeto e aplicação (estrutura corrigida)
            projetos_com_dados = self.extract_items_by_aplicacao_and_projeto(projetos)
            
            # Data atual - ajustar fuso horário
            from datetime import datetime
            import pytz
            
            try:
                tz = pytz.timezone('America/Sao_Paulo')
                data_atual = datetime.now(tz)
            except:
                data_atual = datetime.now()
            
            # Calcular total global (soma de todos os projetos) ou usar 0
            total_global = obra_data.get("valorTotalObra", 0)
            
            # Preparar projetos para o template
            projetos_para_template = []
            for projeto in projetos_com_dados:
                # Encontrar projeto original para calcular total real
                projeto_original = next((p for p in projetos if isinstance(p, dict) and 
                                    p.get("nome") == projeto["nome"]), {})
                
                # Recalcular total do projeto
                projeto_total_real = self.calculate_projeto_total(
                    projeto_original,
                    projeto["aplicacoes_groups"]
                )
                
                projeto_para_template = {
                    "nome": projeto["nome"],
                    "aplicacoes_groups": projeto["aplicacoes_groups"],
                    "valor_total_projeto": projeto_total_real,
                    "valor_total_projeto_formatado": self.format_currency(projeto_total_real),
                    "servicos": projeto["servicos"],
                    "tem_servicos": projeto["tem_servicos"]
                }
                
                projetos_para_template.append(projeto_para_template)
            
            # Se não houver projetos na estrutura extraída, criar lista vazia
            if not projetos_para_template and projetos:
                # Tentar criar projetos básicos a partir dos dados originais
                for projeto in projetos:
                    if isinstance(projeto, dict):
                        projetos_para_template.append({
                            "nome": projeto.get("nome", "Projeto não especificado"),
                            "aplicacoes_groups": [],
                            "valor_total_projeto": projeto.get("valorTotalProjeto", 0),
                            "valor_total_projeto_formatado": self.format_currency(projeto.get("valorTotalProjeto", 0)),
                            "servicos": {
                                "engenharia": {"valor": 0, "descricao": "", "valor_formatado": "R$ 0,00", "tem_engenharia": False},
                                "adicionais": [],
                                "tem_adicionais": False,
                                "tem_engenharia": False
                            },
                            "tem_servicos": False
                        })
            
            # Contexto para o template
            context = {
                # Cabeçalho COM VALORES PADRÃO
                "data_emissao": data_atual.strftime("%d/%m/%Y"),
                "data_emissao_completa": data_atual.strftime("%d de %B de %Y"),
                "empresa_nome": empresa_nome.upper(),
                "obra_nome": obra_nome,
                "cliente_final": cliente_final,
                
                # Projetos (pode ser lista vazia)
                "projetos": projetos_para_template,
                "quantidade_projetos": len(projetos_para_template),
                
                # Totais
                "total_global": self.format_currency(total_global),
                "valor_total_projeto": self.format_currency(total_global),  # Mantido para compatibilidade
                
                # Helper functions para template
                "format_currency": self.format_currency
            }
            
            # Log do contexto gerado
            print(f"📋 Contexto gerado para PC:")
            print(f"   - Empresa: {context['empresa_nome']}")
            print(f"   - Obra: {context['obra_nome']}")
            print(f"   - Cliente: {context['cliente_final']}")
            print(f"   - Projetos: {context['quantidade_projetos']}")
            print(f"   - Total: {context['total_global']}")
            
            return context
                
        except Exception as e:
            print(f"❌ Erro ao gerar contexto PC: {e}")
            traceback.print_exc()
            
            # Retornar contexto mínimo mesmo em caso de erro
            from datetime import datetime
            return {
                "data_emissao": datetime.now().strftime("%d/%m/%Y"),
                "data_emissao_completa": datetime.now().strftime("%d de %B de %Y"),
                "empresa_nome": "EMPRESA NÃO ESPECIFICADA",
                "obra_nome": "OBRA NÃO ESPECIFICADA",
                "cliente_final": "CLIENTE NÃO ESPECIFICADO",
                "projetos": [],
                "quantidade_projetos": 0,
                "total_global": self.format_currency(0),
                "valor_total_projeto": self.format_currency(0),
                "format_currency": self.format_currency
            }
    
    def generate_proposta_comercial(self, obra_id: str, template_path: Path) -> Optional[str]:
        """Gera documento de Proposta Comercial - VERSÃO CORRIGIDA"""
        try:
            # Verificar template
            if not template_path.exists():
                print(f"❌ Template não encontrado: {template_path}")
                return None
            
            # Gerar contexto
            context = self.generate_context_for_pc(obra_id)
            if not context:
                raise ValueError("Não foi possível gerar contexto para a PC")
            
            print(f"📊 Contexto gerado:")
            print(f"  - Empresa: {context.get('empresa_nome')}")
            print(f"  - Obra: {context.get('obra_nome')}")
            print(f"  - Projetos: {context.get('quantidade_projetos')}")
            
            # Carregar e preencher template
            doc = DocxTemplate(str(template_path))
            
            try:
                # Testar o template com contexto reduzido primeiro
                test_context = {
                    "data_emissao": context.get("data_emissao", ""),
                    "empresa_nome": context.get("empresa_nome", ""),
                    "obra_nome": context.get("obra_nome", ""),
                    "cliente_final": context.get("cliente_final", ""),
                    "projetos": [],
                    "total_global": context.get("total_global", "")
                }
                
                print("🧪 Testando template com contexto básico...")
                doc.render(test_context)
                print("✅ Template testado com sucesso")
                
                # Agora renderizar com contexto completo
                print("🎨 Renderizando template completo...")
                doc = DocxTemplate(str(template_path))  # Recarregar template
                doc.render(context)
                
            except Exception as template_error:
                print(f"❌ Erro no template: {template_error}")
                raise
            
            # Salvar arquivo temporário
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as tmp:
                output_path = tmp.name
                doc.save(output_path)
            
            print(f"✅ Proposta Comercial gerada: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Erro ao gerar Proposta Comercial: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def generate_filename(self, obra_data: Dict, template_type: str) -> str:
        """Gera nome do arquivo no formato PC_Obra_empresaSigla_numeroClienteFinal_DD-MM-AAAA"""
        try:
            # Extrair sigla da empresa
            empresa_nome = obra_data.get("empresaNome", "")
            sigla = obra_data.get("empresaSigla", "")
            
            # Se não tiver sigla específica, tentar extrair do nome
            if not sigla and empresa_nome:
                match = re.search(r'\(([^)]+)\)', empresa_nome)
                if match:
                    sigla = match.group(1)
                else:
                    palavras = empresa_nome.split()
                    if palavras:
                        sigla = ''.join([p[0].upper() for p in palavras if p])
            
            # Sigla padrão se ainda não tiver
            if not sigla:
                sigla = "EMP"
            
            # Extrair número do cliente final
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
            
            # Limpar caracteres especiais
            sigla_limpa = re.sub(r'[^a-zA-Z0-9]', '', sigla)
            numero_limpo = re.sub(r'[^a-zA-Z0-9]', '', str(cliente_numero))
            
            # Determinar prefixo
            if template_type.lower() in ["comercial", "pc"]:
                prefixo = "PC_Obra"
            elif template_type.lower() in ["tecnica", "pt"]:
                prefixo = "PT_Obra"
            else:
                prefixo = template_type.upper()
            
            # Data atual formatada como DD-MM-AAAA
            from datetime import datetime
            import pytz
            
            try:
                tz = pytz.timezone('America/Sao_Paulo')
                data_atual = datetime.now(tz)
            except:
                data_atual = datetime.now()
            
            data_formatada = data_atual.strftime("%d-%m-%Y")
            
            # Gerar nome do arquivo
            filename = f"{prefixo}_{sigla_limpa}_{numero_limpo}_{data_formatada}.docx"
            
            return filename
            
        except Exception as e:
            print(f"❌ Erro ao gerar nome do arquivo: {e}")
            # Nome de fallback
            from datetime import datetime
            data_fallback = datetime.now().strftime("%d-%m-%Y")
            return f"PC_Obra_{data_fallback}.docx"