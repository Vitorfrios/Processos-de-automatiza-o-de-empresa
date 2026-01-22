# codigo/servidor_modules/generators/wordPC_generator.py
"""
wordPC_generator.py - Gerador de Proposta Comercial (PC)
"""

import json
import os
from datetime import datetime
from pathlib import Path
from docxtpl import DocxTemplate
import traceback
from typing import Dict, List, Any, Optional


class WordPCGenerator:
    """Gerador específico para Proposta Comercial"""
    
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
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    
# No método extract_machines_by_specification, atualize a parte que prepara a máquina:

    def extract_machines_by_specification(self, projetos: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Extrai máquinas agrupadas por especificação
        Retorna: {"Climatização": [máquinas], "Pressurização": [máquinas], etc.}
        """
        machines_by_spec = {}
        
        for projeto in projetos:
            if not isinstance(projeto, dict):
                continue
                
            salas = projeto.get("salas", [])
            for sala in salas:
                if not isinstance(sala, dict):
                    continue
                    
                maquinas = sala.get("maquinas", [])
                for maquina in maquinas:
                    if not isinstance(maquina, dict):
                        continue
                    
                    # Obter tipo da máquina
                    tipo_maquina = maquina.get("tipo", "")
                    machine_data = self.get_machine_data_by_type(tipo_maquina)
                    
                    # Obter especificação do BD
                    especificacao = machine_data.get("especificacao", "Geral") if machine_data else "Geral"
                    
                    # Se não tiver especificação, tentar inferir do nome
                    if not especificacao or especificacao == "":
                        tipo_lower = tipo_maquina.lower()
                        if "press" in tipo_lower or "ventil" in tipo_lower or "exaust" in tipo_lower:
                            especificacao = "Pressurização/Ventilação"
                        elif "climat" in tipo_lower or "split" in tipo_lower or "wall" in tipo_lower:
                            especificacao = "Climatização"
                        elif "filtro" in tipo_lower:
                            especificacao = "Filtragem"
                        else:
                            especificacao = "Equipamentos"
                    
                    # Buscar fornecedor nos impostos (CORREÇÃO: usar "FORNECEDOR" se existir, senão buscar em outro lugar)
                    impostos = machine_data.get("impostos", {}) if machine_data else {}
                    fornecedor = "Não especificado"
                    
                    # Verificar diferentes possíveis nomes para fornecedor
                    fornecedor_keys = ["FORNECEDOR", "FABRICANTE", "MARCA"]
                    for key in fornecedor_keys:
                        if key in impostos:
                            fornecedor = impostos[key]
                            break
                    
                    # Preparar dados da máquina para o template
                    maquina_template = {
                        "tipo": maquina.get("tipo", ""),
                        "nome": maquina.get("nome", ""),
                        "potencia": maquina.get("potencia", ""),
                        "quantidade": maquina.get("quantidade", 1),
                        "preco_total": maquina.get("precoTotal", 0),
                        "preco_total_formatado": self.format_currency(maquina.get("precoTotal", 0)),
                        "ambiente": sala.get("nome", ""),
                        "opcoes": maquina.get("opcoesSelecionadas", []),
                        "configuracoes": maquina.get("configuracoesSelecionadas", []),
                        "fornecedor": fornecedor,
                        "frete": impostos.get("FRETE", "") if impostos else "",
                        "icms": impostos.get("ICMS", "") if impostos else "",
                        "ipi": impostos.get("IPI", "") if impostos else "",
                        "dados_completos": maquina  # Mantém dados completos para referência
                    }
                    
                    # Adicionar ao grupo correto
                    if especificacao not in machines_by_spec:
                        machines_by_spec[especificacao] = []
                    
                    machines_by_spec[especificacao].append(maquina_template)
        
        return machines_by_spec
    
    def calculate_totals(self, obra_data: Dict) -> Dict:
        """Calcula totais da obra"""
        total_obra = obra_data.get("valorTotalObra", 0)
        
        # Calcular total de máquinas
        total_maquinas = 0
        total_servicos = 0
        
        projetos = obra_data.get("projetos", [])
        for projeto in projetos:
            if isinstance(projeto, dict):
                # Valor do projeto
                valor_projeto = projeto.get("valorTotalProjeto", 0)
                
                # Serviços
                servicos = projeto.get("servicos", {})
                if isinstance(servicos, dict):
                    # Engenharia
                    engenharia = servicos.get("engenharia", {})
                    if isinstance(engenharia, dict):
                        total_servicos += engenharia.get("valor", 0)
                    
                    # Adicionais
                    adicionais = servicos.get("adicionais", [])
                    if isinstance(adicionais, list):
                        for adicional in adicionais:
                            if isinstance(adicional, dict):
                                total_servicos += adicional.get("valor", 0)
        
        return {
            "total_obra": total_obra,
            "total_obra_formatado": self.format_currency(total_obra),
            "total_maquinas": total_maquinas,
            "total_maquinas_formatado": self.format_currency(total_maquinas),
            "total_servicos": total_servicos,
            "total_servicos_formatado": self.format_currency(total_servicos)
        }
    
    def extract_servicos(self, projetos: List[Dict]) -> Dict:
        """Extrai informações de serviços"""
        servicos_info = {
            "engenharia": {
                "valor": 0,
                "descricao": "",
                "valor_formatado": "R$ 0,00"
            },
            "adicionais": [],
            "tem_adicionais": False
        }
        
        for projeto in projetos:
            if not isinstance(projeto, dict):
                continue
                
            servicos = projeto.get("servicos", {})
            if not isinstance(servicos, dict):
                continue
            
            # Engenharia
            engenharia = servicos.get("engenharia", {})
            if isinstance(engenharia, dict):
                servicos_info["engenharia"]["valor"] = engenharia.get("valor", 0)
                servicos_info["engenharia"]["descricao"] = engenharia.get("descricao", "")
                servicos_info["engenharia"]["valor_formatado"] = self.format_currency(engenharia.get("valor", 0))
            
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
    
    def generate_context_for_pc(self, obra_id: str) -> Dict:
        """Gera contexto completo para Proposta Comercial"""
        try:
            # Obter dados da obra
            obra_data = self.get_obra_by_id(obra_id)
            if not obra_data:
                raise ValueError(f"Obra {obra_id} não encontrada")
            
            # Dados básicos
            obra_nome = obra_data.get("nome", "Obra não especificada")
            empresa_nome = obra_data.get("empresaNome", "Empresa não especificada")
            cliente_final = obra_data.get("clienteFinal", "Cliente não especificado")
            data_cadastro = obra_data.get("dataCadastro", "")
            
            # Projetos
            projetos = obra_data.get("projetos", [])
            
            # Extrair máquinas por especificação
            machines_by_spec = self.extract_machines_by_specification(projetos)
            
            # Calcular totais
            totals = self.calculate_totals(obra_data)
            
            # Extrair serviços
            servicos = self.extract_servicos(projetos)
            
            # Data atual
            data_atual = datetime.now()
            
            # Contexto para o template
            context = {
                # Cabeçalho
                "data_emissao": data_atual.strftime("%d/%m/%Y"),
                "data_emissao_completa": data_atual.strftime("%d de %B de %Y"),
                "empresa_nome": empresa_nome.upper(),
                "obra_nome": obra_nome,
                "cliente_final": cliente_final,
                
                # Projetos
                "projetos": projetos,
                "projeto_nome": projetos[0].get("nome", "Projeto Principal") if projetos else "Projeto",
                
                # Máquinas agrupadas por especificação
                "machines_by_specification": machines_by_spec,
                "tem_climatizacao": "Climatização" in machines_by_spec,
                "tem_pressurizacao": any("press" in spec.lower() for spec in machines_by_spec.keys()),
                "tem_filtragem": any("filtro" in spec.lower() for spec in machines_by_spec.keys()),
                
                # Exemplos específicos para cada especificação
                "especificador_climatizacao": "Climatização" if "Climatização" in machines_by_spec else "",
                "especificador_pressurizacao": "Pressurização" if any("press" in spec.lower() for spec in machines_by_spec.keys()) else "",
                "especificador_filtragem": "Filtragem" if any("filtro" in spec.lower() for spec in machines_by_spec.keys()) else "",
                
                # Lista de máquinas para iteração no template
                "machines_list": [],
                # Processar cada grupo de especificação
                "machines_spec_groups": []
            }
            
            # Processar máquinas por grupo de especificação
            for spec, machines in machines_by_spec.items():
                group_total = sum(m.get("preco_total", 0) for m in machines)
                
                # Para cada máquina no grupo, adicionar à lista
                for machine in machines:
                    context["machines_list"].append({
                        "especificacao": spec,
                        **machine
                    })
                
                # Adicionar grupo
                context["machines_spec_groups"].append({
                    "especificacao": spec,
                    "machines": machines,
                    "total_grupo": group_total,
                    "total_grupo_formatado": self.format_currency(group_total),
                    "quantidade_total": len(machines)
                })
            
            # Serviços
            context.update({
                "servicos": servicos,
                "engenharia_valor": servicos["engenharia"]["valor_formatado"],
                "engenharia_descricao": servicos["engenharia"]["descricao"] or "Serviços de engenharia",
                "tem_adicionais": servicos["tem_adicionais"],
                "adicionais": servicos["adicionais"]
            })
            
            # Totais
            context.update({
                "valor_total_obra": totals["total_obra_formatado"],
                "valor_total_projeto": totals["total_obra_formatado"],  # Para o template usar
                "total_global": totals["total_obra_formatado"]
            })
            
            # Informações da empresa ESI (fixas)
            context.update({
                "empresa_esi_razao_social": "ESI – ENERGIA SOLUÇÕES INTELIGENTES LTDA.",
                "empresa_esi_cnpj": "20.232.429/0001-11",
                "validade_proposta": "10 (dez) dias",
                "forma_pagamento_maquinas": "50% sinal, 50% contra embarque",
                "forma_pagamento_servicos": "100% na entrega da REV0 do projeto",
                "prazo_pagamento_maquinas": "30ddl",
                "prazo_pagamento_servicos": "30ddl",
                "responsavel": "Matheus Pacheco Herzeberg Gonçalves",
                "cargo": "Engenheiro Mecânico – ESI Energia"
            })
            
            return context
            
        except Exception as e:
            print(f"❌ Erro ao gerar contexto PC: {e}")
            traceback.print_exc()
            return {}
        
    def generate_proposta_comercial(self, obra_id: str, template_path: Path) -> Optional[str]:
        """Gera documento de Proposta Comercial"""
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
            print(f"  - Grupos de máquinas: {len(context.get('machines_spec_groups', []))}")
            
            # Carregar e preencher template
            from docxtpl import DocxTemplate
            doc = DocxTemplate(str(template_path))
            
            try:
                # Testar o template com contexto reduzido primeiro
                test_context = {
                    "data_emissao": context.get("data_emissao", ""),
                    "empresa_nome": context.get("empresa_nome", ""),
                    "obra_nome": context.get("obra_nome", ""),
                    "cliente_final": context.get("cliente_final", ""),
                    "machines_spec_groups": [],
                    "projetos": [],
                    "engenharia_valor": context.get("engenharia_valor", ""),
                    "engenharia_descricao": context.get("engenharia_descricao", ""),
                    "valor_total_projeto": context.get("valor_total_projeto", ""),
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
        """Gera nome do arquivo no formato PC/PT_empresaSigla_numeroClienteFinal"""
        try:
            # Extrair sigla da empresa
            empresa_nome = obra_data.get("empresaNome", "")
            sigla = ""
            
            # Método 1: Tentar extrair do campo "empresaSigla" se existir
            sigla = obra_data.get("empresaSigla", "")
            
            # Método 2: Se não tiver campo específico, tentar extrair do nome
            if not sigla and empresa_nome:
                import re
                # Tentar extrair sigla entre parênteses
                match = re.search(r'\(([^)]+)\)', empresa_nome)
                if match:
                    sigla = match.group(1)
                else:
                    # Se não houver parênteses, usar as primeiras letras
                    palavras = empresa_nome.split()
                    if palavras:
                        sigla = ''.join([p[0].upper() for p in palavras if p])
            
            # Método 3: Sigla padrão
            if not sigla:
                sigla = "EMP"
            
            # Extrair número do cliente final
            cliente_numero = obra_data.get("clienteNumero", "")
            if not cliente_numero:
                # Tentar extrair do nome do cliente final
                cliente_final = obra_data.get("clienteFinal", "")
                if cliente_final:
                    # Extrair números do nome do cliente
                    import re
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
                prefixo = "PC"
            elif template_type.lower() in ["tecnica", "pt"]:
                prefixo = "PT"
            else:
                prefixo = template_type.upper()
            
            # Gerar nome do arquivo
            from datetime import datetime
            data_hora = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{prefixo}_{sigla_limpa}_{numero_limpo}_{data_hora}.docx"
            
            return filename
            
        except Exception as e:
            print(f"❌ Erro ao gerar nome do arquivo: {e}")
            # Nome de fallback
            from datetime import datetime
            return f"{template_type.upper()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"