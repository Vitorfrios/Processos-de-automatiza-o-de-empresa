# word_pt_generator.py

import json
import tempfile
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from collections import defaultdict
from dataclasses import dataclass, field
import re
import pytz
from docxtpl import DocxTemplate
from jinja2 import Environment, FileSystemLoader, exceptions


@dataclass
class MaquinaProcessada:
    """Representação processada de uma máquina para o template."""
    quantidade: int
    tipo: str
    potencia: str
    tensao: str
    tensao_comando: str = "220V"
    opcoes_selecionadas: List[str] = field(default_factory=list)
    tem_damper: bool = False
    aplicacao: str = ""
    
    @classmethod
    def from_raw(cls, maquina: Dict) -> 'MaquinaProcessada':
        """Cria uma instância a partir dos dados brutos."""
        # Processa opções
        opcoes = []
        for opcao in maquina.get("opcoesSelecionadas", []):
            if isinstance(opcao, dict):
                nome = opcao.get("name") or opcao.get("nome") or opcao.get("originalName")
                if nome:
                    opcoes.append(nome)
            elif isinstance(opcao, str):
                opcoes.append(opcao)
        
        # Verifica damper
        damper_keywords = ["damper", "corta-fogo", "corta fogo"]
        tem_damper = any(
            any(keyword in opt.lower() for keyword in damper_keywords)
            for opt in opcoes
        )
        
        return cls(
            quantidade=maquina.get("quantidade", 1),
            tipo=maquina.get("tipo", ""),
            potencia=maquina.get("potencia", ""),
            tensao=maquina.get("tensao") or maquina.get("voltage") or "220V/3F",
            tensao_comando=maquina.get("tensao_comando", "220V"),
            opcoes_selecionadas=opcoes,
            tem_damper=tem_damper,
            aplicacao=maquina.get("aplicacao_machines", "")
        )


@dataclass
class ExaustaoProcessada:
    """Dados processados de exaustão para uma sala."""
    tem_tubo_axial: bool = False
    tem_centrifugo: bool = False
    total_quantidade: int = 0
    todas_maquinas: List[MaquinaProcessada] = field(default_factory=list)
    texto_backup: str = ""
    checkboxes: Dict[str, str] = field(default_factory=lambda: {
        'tubo_axial': '☐',
        'centrifugo': '☐',
        'backup': '☐'
    })


@dataclass
class SalaProcessada:
    """Sala com todas as máquinas já classificadas."""
    nome: str
    inputs: Dict[str, Any] = field(default_factory=dict)
    maquinas_climatizacao: List[MaquinaProcessada] = field(default_factory=list)
    maquinas_pressurizacao: List[MaquinaProcessada] = field(default_factory=list)
    maquinas_exaustao_bateria: List[MaquinaProcessada] = field(default_factory=list)
    maquinas_exaustao_trafo: List[MaquinaProcessada] = field(default_factory=list)
    
    # Flags pré-calculadas
    tem_climatizacao: bool = False
    tem_pressurizacao: bool = False
    tem_exaustao_bateria: bool = False
    tem_exaustao_trafo: bool = False
    
    # Dados processados de exaustão
    exaustao_bateria: ExaustaoProcessada = field(default_factory=ExaustaoProcessada)
    exaustao_trafo: ExaustaoProcessada = field(default_factory=ExaustaoProcessada)
    
    def __post_init__(self):
        """Calcula flags após inicialização."""
        self.tem_climatizacao = len(self.maquinas_climatizacao) > 0
        self.tem_pressurizacao = len(self.maquinas_pressurizacao) > 0
        self.tem_exaustao_bateria = len(self.maquinas_exaustao_bateria) > 0
        self.tem_exaustao_trafo = len(self.maquinas_exaustao_trafo) > 0
        
        # Processa exaustões
        if self.tem_exaustao_bateria:
            self.exaustao_bateria = self._processar_exaustao(self.maquinas_exaustao_bateria)
        if self.tem_exaustao_trafo:
            self.exaustao_trafo = self._processar_exaustao(self.maquinas_exaustao_trafo)
    
    def _processar_exaustao(self, maquinas: List[MaquinaProcessada]) -> ExaustaoProcessada:
        """Processa lista de máquinas de exaustão."""
        result = ExaustaoProcessada(todas_maquinas=maquinas)
        
        for maq in maquinas:
            result.total_quantidade += maq.quantidade
            
            if maq.tipo == 'Tubo Axial':
                result.tem_tubo_axial = True
                result.checkboxes['tubo_axial'] = '☒'
            elif maq.tipo == 'Gabinete Centrífugo':
                result.tem_centrifugo = True
                result.checkboxes['centrifugo'] = '☒'
        
        # Calcula backup
        if result.tem_tubo_axial or result.tem_centrifugo:
            if result.total_quantidade > 1:
                backup_qtd = result.total_quantidade - 1
                result.texto_backup = f"{backup_qtd} atuante + 1 back-up"
                result.checkboxes['backup'] = '☒'
            else:
                result.texto_backup = "1 atuante"
        
        return result


@dataclass
class TipoEquipamentoAggregate:
    """Agregação de um tipo específico de equipamento."""
    maquinas: List[MaquinaProcessada] = field(default_factory=list)
    opcoes_inclusas: Dict[str, bool] = field(default_factory=dict)
    tem_equipamentos: bool = False
    primeira_maquina: Optional[MaquinaProcessada] = None
    
    def __post_init__(self):
        self.tem_equipamentos = len(self.maquinas) > 0
        if self.maquinas:
            self.primeira_maquina = self.maquinas[0]


class WordPTGenerator:
    """Gerador específico para Proposta Técnica (PT) - Versão otimizada"""

    def __init__(self, project_root: Path, file_utils=None):
        self.project_root = project_root
        self.file_utils = file_utils
        self.opcoes_possiveis_por_tipo = {}
        self.tensoes_disponiveis = []

    def _load_json(self, filename: str) -> Dict:
        """Carrega um arquivo JSON do diretório 'json'."""
        path = self.project_root / "json" / filename
        if not path.exists():
            print(f"⚠️ Arquivo não encontrado: {path}")
            return {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Erro ao carregar {filename}: {e}")
            return {}

    def get_dados_data(self) -> Dict:
        return self._load_json("dados.json")

    def get_backup_data(self) -> Dict:
        return self._load_json("backup.json")

    def _find_obra_by_id(self, backup_data: Dict, obra_id: str) -> Optional[Dict]:
        obras = backup_data.get("obras", [])
        for obra in obras:
            if str(obra.get("id")) == obra_id:
                return obra
        print(f"🔍 Obra com ID '{obra_id}' não encontrada no backup.")
        return None

    @staticmethod
    def format_currency(value: float) -> str:
        if not value:
            return "R$ 0,00"
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    def _extrair_opcoes_possiveis(self, dados_data: Dict) -> Dict[str, List[str]]:
        """Extrai lista de opções disponíveis para cada tipo de máquina."""
        opcoes = {}
        for machine in dados_data.get("machines", []):
            tipo = machine.get("type")
            if tipo:
                opcoes_list = []
                for opt in machine.get("options", []):
                    nome = opt.get("name") or opt.get("nome")
                    if nome:
                        opcoes_list.append(nome)
                opcoes[tipo] = opcoes_list
        
        # Garantir que os tipos de pressurizador tenham opções padrão
        tipos_pressurizador = ['Pressurizador Inline', 'Pressurizador Externo', 'Pressurizador Suspenso Horizontal']
        opcoes_pressurizador = ['Sensor de filtro sujo', 'Sensor diferencial de pressão', 
                                'Ventilador eletrônico (proporcional)', 'Pintura especial']
        
        for tipo in tipos_pressurizador:
            if tipo not in opcoes or not opcoes[tipo]:
                opcoes[tipo] = opcoes_pressurizador.copy()
        
        return opcoes

    def _extrair_tensoes(self, dados_data: Dict) -> List[str]:
        """Lista única de todas as tensões disponíveis."""
        tenses = {"220V", "24V", "220V/1F", "220V/3F", "380V/3F", "440V/3F", "460V/3F", "480V/3F"}
        for machine in dados_data.get("machines", []):
            for volt in machine.get("voltages", []):
                nome = volt.get("name")
                if nome:
                    tenses.add(nome)
        return sorted(list(tenses))

    def _processar_sala(self, sala: Dict) -> SalaProcessada:
        """Processa uma sala, classificando suas máquinas."""
        maquinas_climatizacao = []
        maquinas_pressurizacao = []
        maquinas_exaustao_bateria = []
        maquinas_exaustao_trafo = []
        
        for maq in sala.get("maquinas", []):
            maq_proc = MaquinaProcessada.from_raw(maq)
            
            # Classifica por aplicação
            if maq_proc.aplicacao == "climatizacao":
                maquinas_climatizacao.append(maq_proc)
            elif maq_proc.aplicacao == "pressurizacao":
                maquinas_pressurizacao.append(maq_proc)
            elif maq_proc.aplicacao == "exaustao_bateria":
                maquinas_exaustao_bateria.append(maq_proc)
            elif maq_proc.aplicacao == "exaustao_baia_trafo":
                maquinas_exaustao_trafo.append(maq_proc)
        
        return SalaProcessada(
            nome=sala.get("nome", "Sala"),
            inputs=sala.get("inputs", {}),
            maquinas_climatizacao=maquinas_climatizacao,
            maquinas_pressurizacao=maquinas_pressurizacao,
            maquinas_exaustao_bateria=maquinas_exaustao_bateria,
            maquinas_exaustao_trafo=maquinas_exaustao_trafo
        )

    def _agregar_maquinas_por_tipo(self, salas: List[SalaProcessada]) -> Dict[str, TipoEquipamentoAggregate]:
        """Agrega todas as máquinas por tipo."""
        maquinas_por_tipo = defaultdict(list)
        
        for sala in salas:
            for maq in sala.maquinas_climatizacao:
                maquinas_por_tipo[maq.tipo].append(maq)
            for maq in sala.maquinas_pressurizacao:
                maquinas_por_tipo[maq.tipo].append(maq)
            for maq in sala.maquinas_exaustao_bateria:
                maquinas_por_tipo[maq.tipo].append(maq)
            for maq in sala.maquinas_exaustao_trafo:
                maquinas_por_tipo[maq.tipo].append(maq)
        
        # Cria aggregates
        aggregates = {}
        for tipo, maquinas in maquinas_por_tipo.items():
            # Calcula opções inclusas
            todas_opcoes = set()
            for maq in maquinas:
                todas_opcoes.update(maq.opcoes_selecionadas)
            
            opcoes_inclusas = {}
            opcoes_possiveis = self.opcoes_possiveis_por_tipo.get(tipo, [])
            for opcao in opcoes_possiveis:
                opcoes_inclusas[opcao] = opcao in todas_opcoes
            
            aggregates[tipo] = TipoEquipamentoAggregate(
                maquinas=maquinas,
                opcoes_inclusas=opcoes_inclusas
            )
        
        return aggregates

    def _maquina_to_dict(self, maquina: MaquinaProcessada) -> Dict:
        """Converte MaquinaProcessada para dict para o template."""
        return {
            "quantidade": maquina.quantidade,
            "tipo": maquina.tipo,
            "potencia": maquina.potencia,
            "tensao": maquina.tensao,
            "tensao_comando": maquina.tensao_comando,
            "opcoes_selecionadas": maquina.opcoes_selecionadas,
            "tem_damper": maquina.tem_damper,
            "aplicacao": maquina.aplicacao
        }

    def _exaustao_to_dict(self, exaustao: ExaustaoProcessada) -> Dict:
        """Converte ExaustaoProcessada para dict para o template."""
        return {
            "tem_tubo_axial": exaustao.tem_tubo_axial,
            "tem_centrifugo": exaustao.tem_centrifugo,
            "total_quantidade": exaustao.total_quantidade,
            "todas_maquinas": [self._maquina_to_dict(m) for m in exaustao.todas_maquinas],
            "texto_backup": exaustao.texto_backup,
            "checkboxes": exaustao.checkboxes
        }

    def _sala_to_dict(self, sala: SalaProcessada) -> Dict:
        """Converte SalaProcessada para dict para o template."""
        return {
            "nome": sala.nome,
            "inputs": sala.inputs,
            "maquinas_climatizacao": [self._maquina_to_dict(m) for m in sala.maquinas_climatizacao],
            "maquinas_pressurizacao": [self._maquina_to_dict(m) for m in sala.maquinas_pressurizacao],
            "tem_climatizacao": sala.tem_climatizacao,
            "tem_pressurizacao": sala.tem_pressurizacao,
            "tem_exaustao_bateria": sala.tem_exaustao_bateria,
            "tem_exaustao_trafo": sala.tem_exaustao_trafo,
            "exaustao_bateria": self._exaustao_to_dict(sala.exaustao_bateria) if sala.tem_exaustao_bateria else None,
            "exaustao_trafo": self._exaustao_to_dict(sala.exaustao_trafo) if sala.tem_exaustao_trafo else None
        }

    def _aggregate_to_dict(self, agg: TipoEquipamentoAggregate) -> Dict:
        """Converte aggregate para dict."""
        return {
            "maquinas": [self._maquina_to_dict(m) for m in agg.maquinas],
            "primeira_maquina": self._maquina_to_dict(agg.primeira_maquina) if agg.primeira_maquina else None,
            "tem_equipamentos": agg.tem_equipamentos,
            "opcoes_inclusas": agg.opcoes_inclusas,
            "lista_opcoes": [
                {"nome": opcao, "incluso": incluso}
                for opcao, incluso in agg.opcoes_inclusas.items()
            ]
        }

    def generate_context_for_pt(self, obra_id: str) -> Dict:
        """
        Gera contexto completo para a Proposta Técnica.
        Estrutura otimizada para acesso direto no template.
        """
        try:
            dados_data = self.get_dados_data()
            backup_data = self.get_backup_data()
            obra_data = self._find_obra_by_id(backup_data, obra_id)

            if not obra_data:
                print(f"⚠️ Obra {obra_id} não encontrada.")
                return {}

            # Carrega dados de configuração global
            self.opcoes_possiveis_por_tipo = self._extrair_opcoes_possiveis(dados_data)
            self.tensoes_disponiveis = self._extrair_tensoes(dados_data)

            empresa_nome = obra_data.get("empresaNome", "EMPRESA NÃO ESPECIFICADA")
            print(f"📋 Obra encontrada: {obra_data.get('nome')} - Empresa: {empresa_nome}")

            try:
                tz = pytz.timezone('America/Sao_Paulo')
                data_atual = datetime.now(tz)
            except:
                data_atual = datetime.now()

            projetos_processados = []
            agregacoes_globais = defaultdict(list)
            
            # Agregadores específicos para exaustores
            exaustores_trafo = []  # Lista global de máquinas de exaustão de trafo
            exaustores_bateria = []  # Lista global de máquinas de exaustão de bateria

            for projeto in obra_data.get("projetos", []):
                projeto_nome = projeto.get("nome", "Projeto sem nome")
                print(f" Processando projeto: {projeto_nome}")

                # Processa salas do projeto
                salas_processadas = []
                acessorios_do_projeto = []  # Acumula acessórios de todas as salas
                tem_dutos_no_projeto = False  # True se QUALQUER sala tiver dutos
                
                for sala in projeto.get("salas", []):
                    sala_proc = self._processar_sala(sala)
                    salas_processadas.append(sala_proc)
                    
                    # Acumula acessórios da sala (se existirem)
                    acessorios_do_projeto.extend(sala.get("acessorios", []))
                    
                    # Verifica se a sala tem dutos
                    if sala.get("dutos"):
                        tem_dutos_no_projeto = True
                    
                    # Acumula para agregações globais
                    for maq in sala_proc.maquinas_climatizacao:
                        agregacoes_globais[maq.tipo].append(maq)
                    for maq in sala_proc.maquinas_pressurizacao:
                        agregacoes_globais[maq.tipo].append(maq)
                    for maq in sala_proc.maquinas_exaustao_bateria:
                        agregacoes_globais[maq.tipo].append(maq)
                        # Acumula exaustores de bateria globalmente
                        exaustores_bateria.append(maq)
                    for maq in sala_proc.maquinas_exaustao_trafo:
                        agregacoes_globais[maq.tipo].append(maq)
                        # Acumula exaustores de trafo globalmente
                        exaustores_trafo.append(maq)

                # Agrega máquinas do projeto por tipo
                agregacoes_projeto = self._agregar_maquinas_por_tipo(salas_processadas)

                # Processa acessórios do projeto (acumulados de todas as salas)
                tem_dcf_90 = any(ac.get("tipo") == "DCF_90" for ac in acessorios_do_projeto)
                tem_dcf_120 = any(ac.get("tipo") == "DCF_120" for ac in acessorios_do_projeto)
                tem_tae = any(ac.get("tipo") == "TAE" for ac in acessorios_do_projeto)
                tem_vz = any(ac.get("tipo") == "VZ" for ac in acessorios_do_projeto)

                projetos_processados.append({
                    "nome": projeto_nome,
                    "salas": [self._sala_to_dict(s) for s in salas_processadas],
                    "agregacoes": {
                        tipo: self._aggregate_to_dict(agg)
                        for tipo, agg in agregacoes_projeto.items()
                    },
                    "primeira_sala": self._sala_to_dict(salas_processadas[0]) if salas_processadas else None,
                    # Dutos - TRUE se QUALQUER sala tiver dutos
                    "tem_dutos": tem_dutos_no_projeto,
                    # Acessórios - acumulados de todas as salas
                    "acessorios": {
                        "lista": acessorios_do_projeto,
                        "tem_dcf_90": tem_dcf_90,
                        "tem_dcf_120": tem_dcf_120,
                        "tem_tae": tem_tae,
                        "tem_vz": tem_vz,
                        "tem_dcf": tem_dcf_90 or tem_dcf_120,
                        "tem_algum": len(acessorios_do_projeto) > 0
                    }
                })

            # Cria agregações globais
            equipamentos_por_tipo = {}
            for tipo, maquinas in agregacoes_globais.items():
                opcoes_inclusas = {}
                opcoes_possiveis = self.opcoes_possiveis_por_tipo.get(tipo, [])
                todas_opcoes = set()
                for maq in maquinas:
                    todas_opcoes.update(maq.opcoes_selecionadas)
                for opcao in opcoes_possiveis:
                    opcoes_inclusas[opcao] = opcao in todas_opcoes
                
                equipamentos_por_tipo[tipo] = {
                    "maquinas": [self._maquina_to_dict(m) for m in maquinas],
                    "primeira_maquina": self._maquina_to_dict(maquinas[0]) if maquinas else None,
                    "tem_equipamentos": len(maquinas) > 0,
                    "opcoes_inclusas": opcoes_inclusas,
                    "lista_opcoes": [
                        {"nome": opcao, "incluso": incluso}
                        for opcao, incluso in opcoes_inclusas.items()
                    ]
                }

            # Criar agregados específicos para exaustores (IGUAL aos outros equipamentos)
            exaustao_trafo_agg = None
            if exaustores_trafo:
                primeira_maq = exaustores_trafo[0]
                tipo_maq = primeira_maq.tipo
                
                # Coleta opções reais
                todas_opcoes = set()
                for maq in exaustores_trafo:
                    todas_opcoes.update(maq.opcoes_selecionadas)
                
                # Usa as opções possíveis do tipo (vindas do dados.json)
                opcoes_possiveis = self.opcoes_possiveis_por_tipo.get(tipo_maq, [])
                
                lista_opcoes = []
                for opcao in opcoes_possiveis:
                    lista_opcoes.append({
                        "nome": opcao,
                        "incluso": opcao in todas_opcoes
                    })
                
                exaustao_trafo_agg = {
                    "tem_equipamentos": True,
                    "primeira_maquina": self._maquina_to_dict(primeira_maq),
                    "lista_opcoes": lista_opcoes,
                    "total_quantidade": sum(m.quantidade for m in exaustores_trafo)
                }

            exaustao_bateria_agg = None
            if exaustores_bateria:
                primeira_maq = exaustores_bateria[0]
                tipo_maq = primeira_maq.tipo
                
                # Coleta opções reais
                todas_opcoes = set()
                for maq in exaustores_bateria:
                    todas_opcoes.update(maq.opcoes_selecionadas)
                
                # Usa as opções possíveis do tipo (vindas do dados.json)
                opcoes_possiveis = self.opcoes_possiveis_por_tipo.get(tipo_maq, [])
                
                lista_opcoes = []
                for opcao in opcoes_possiveis:
                    lista_opcoes.append({
                        "nome": opcao,
                        "incluso": opcao in todas_opcoes
                    })
                
                exaustao_bateria_agg = {
                    "tem_equipamentos": True,
                    "primeira_maquina": self._maquina_to_dict(primeira_maq),
                    "lista_opcoes": lista_opcoes,
                    "total_quantidade": sum(m.quantidade for m in exaustores_bateria)
                }

            # Estrutura tenses para o template
            tenses = {
                "todas": self.tensoes_disponiveis,
                "forca": [t for t in self.tensoes_disponiveis if 'F' in t],
                "comando": ["220V", "24V"]
            }

            # Contexto final
            context = {
                "data_emissao": data_atual.strftime("%d/%m/%Y"),
                "empresa_nome": empresa_nome.upper(),
                "projetos": projetos_processados,
                "equipamentos": {
                    "por_tipo": equipamentos_por_tipo,
                    "tipos_presentes": [
                        tipo for tipo, dados in equipamentos_por_tipo.items() 
                        if dados["tem_equipamentos"]
                    ]
                },
                # Adiciona exaustores agregados globalmente
                "exaustores": {
                    "trafo": exaustao_trafo_agg,
                    "bateria": exaustao_bateria_agg
                },
                "tenses": tenses,
                "format_currency": self.format_currency
            }

            print(f"✅ Contexto PT gerado com {len(projetos_processados)} projeto(s).")
            return context

        except Exception as e:
            print(f"❌ Erro ao gerar contexto PT: {e}")
            traceback.print_exc()
            return {}

    def _create_custom_jinja_env(self, template_path: Path) -> Environment:
        """
        Cria e configura um Jinja2 Environment customizado com todas as configurações
        necessárias para eliminar espaços extras e garantir formatação correta.
        """
        # Configurações CRÍTICAS para eliminar espaços extras
        jinja_env = Environment(
            loader=FileSystemLoader(str(template_path.parent)),
            trim_blocks=True,           # Remove a linha inteira após uma tag
            lstrip_blocks=True,          # Remove espaços em branco antes de uma tag
            keep_trailing_newline=False, # Remove linha em branco no final do arquivo
            block_start_string='{%',
            block_end_string='%}',
            variable_start_string='{{',
            variable_end_string='}}',
            comment_start_string='{#',
            comment_end_string='#}',
            autoescape=False,             # Desativa autoescape para o docx
            cache_size=50,                 # Tamanho do cache de templates
            auto_reload=True                # Recarrega templates se alterados
        )
        
        # Adiciona filtros personalizados
        jinja_env.filters['currency'] = self.format_currency
        jinja_env.filters['checkbox'] = lambda x: '☒' if x else '☐'
        
        # Adiciona testes personalizados
        jinja_env.tests['even'] = lambda x: x % 2 == 0
        
        print("✅ Jinja2 Environment customizado criado com sucesso!")
        return jinja_env

    def generate_proposta_tecnica(self, obra_id: str, template_path: Path) -> Optional[str]:
        """
        Gera o documento da Proposta Técnica com Environment customizado.
        Esta é a versão definitiva com controle total de formatação.
        """
        try:
            if not template_path.exists():
                print(f"❌ Template PT não encontrado: {template_path}")
                return None

            print(f"📄 Gerando PT para obra {obra_id} usando template {template_path.name}")
            
            # Gera contexto
            context = self.generate_context_for_pt(obra_id)
            
            if not context:
                print("❌ Contexto vazio, não é possível gerar documento")
                return None

            # Carrega o template
            doc = DocxTemplate(str(template_path))
            
            # CRIA ENVIRONMENT CUSTOMIZADO com todas as configurações
            jinja_env = self._create_custom_jinja_env(template_path)
            
            # RENDERIZA COM O ENVIRONMENT CUSTOMIZADO
            # Isso garante que trim_blocks e lstrip_blocks sejam aplicados
            doc.render(context, jinja_env=jinja_env)
            print("✅ Template renderizado com environment customizado!")
            
            # Salva em arquivo temporário
            with tempfile.NamedTemporaryFile(suffix='.pt.docx', delete=False) as tmp:
                output_path = tmp.name
                doc.save(output_path)

            print(f"✅ Proposta Técnica gerada: {output_path}")
            return output_path

        except exceptions.TemplateSyntaxError as e:
            print(f"❌ Erro de sintaxe no template: {e}")
            traceback.print_exc()
            return None
        except Exception as e:
            print(f"❌ Erro ao gerar Proposta Técnica: {e}")
            traceback.print_exc()
            return None

    def generate_filename(self, obra_data: Dict, doc_type: str = "tecnica") -> str:
        """
        Gera nome do arquivo para Proposta Técnica.
        """
        try:
            try:
                tz = pytz.timezone('America/Sao_Paulo')
                data_atual = datetime.now(tz)
            except:
                data_atual = datetime.now()

            sigla = obra_data.get("empresaSigla", "")
            if not sigla:
                empresa_nome = obra_data.get("empresaNome", "")
                if empresa_nome:
                    match = re.search(r'\(([^)]+)\)', empresa_nome)
                    if match:
                        sigla = match.group(1)
                    else:
                        palavras = empresa_nome.split()
                        if palavras:
                            iniciais = ''.join([p[0].upper() for p in palavras[:3] if p and p[0].isalpha()])
                            sigla = iniciais[:5] if iniciais else "EMP"

            if not sigla:
                sigla = "EMP"

            cliente_numero = obra_data.get("clienteNumero", "")
            if not cliente_numero:
                cliente_final = obra_data.get("clienteFinal", "")
                if cliente_final:
                    numeros = re.findall(r'\b(\d{2,})\b', cliente_final)
                    if numeros:
                        cliente_numero = numeros[0]
                    else:
                        obra_id = str(obra_data.get("id", ""))
                        numeros_obra = re.findall(r'\d+', obra_id)
                        if numeros_obra:
                            cliente_numero = numeros_obra[-1]

            if not cliente_numero:
                cliente_numero = "001"
            elif len(cliente_numero) < 3:
                cliente_numero = cliente_numero.zfill(3)

            sigla_limpa = re.sub(r'[^a-zA-Z0-9]', '', sigla)
            numero_limpo = re.sub(r'[^a-zA-Z0-9]', '', str(cliente_numero))
            data_formatada = data_atual.strftime("%d-%m-%Y")

            if doc_type == "tecnica":
                return f"PT_Obra_{sigla_limpa}_{numero_limpo}_{data_formatada}.docx"
            else:
                return f"PC_Obra_{sigla_limpa}_{numero_limpo}_{data_formatada}.docx"

        except Exception as e:
            print(f"❌ Erro ao gerar nome do arquivo: {e}")
            data_fallback = datetime.now().strftime("%d-%m-%Y")
            return f"PT_Obra_{data_fallback}.docx"
