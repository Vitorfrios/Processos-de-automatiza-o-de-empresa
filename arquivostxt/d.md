
## 📐 ESTRUTURA DO DOM (JÁ EXISTENTE — VOCÊ APENAS REAGE A ELA)

### 1. SEÇÃO MÁQUINAS (JÁ IMPLEMENTADA)

```html
<div id="machines-{roomId}">
  <div class="climatization-machine" data-machine-id="{machineId}" data-room-id="{roomId}">
    <input type="text" class="machine-title-editable" id="title-{machineId}" value="Máquina 1">

    <select id="tipo-{machineId}" class="machine-type-select"></select>

    <select id="aplicacao-{machineId}" class="machine-aplicacao-select">
      <option value="climatizacao">Climatização</option>
      <option value="pressurizacao">Pressurização</option>
      <option value="exaustao_bateria">Exaustão da sala de bateria</option>
      <option value="exaustao_baia_trafo">Exaustão da sala baia de trafo</option>
    </select>

    <select id="capacidade-{machineId}" class="machine-power-select" disabled>
      <option value="">Selecionar</option>
      <option value="1500 m³/h">1500 m³/h</option>
    </select>
  </div>
</div>
```

---

## 🧩 SEÇÃO VENTILAÇÃO (VOCÊ CRIA UMA ÚNICA POR SALA)

```
┌──────────────────────────────────────────────┐
│ SEÇÃO VENTILAÇÃO – roomId                    │
├──────────────────────────────────────────────┤
│                                              │
│  TABELA – SOLUÇÃO DAS MÁQUINAS                │
│  ┌────────────────────────────────────────┐  │
│  │ CABEÇALHO FIXO                          │  │
│  ├────────────────────────────────────────┤  │
│  │ LINHA MÁQUINA 1 (machineId)             │  │
│  │ LINHA MÁQUINA 2 (machineId)             │  │
│  │ ... (1 LINHA = 1 MÁQUINA VÁLIDA)        │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## 📊 CONSTANTES DO SISTEMA

Variáveis esperadas:

```js
densidade_ar        // kg/m³
calor_especifico   // J/kg·K
```

### Regras:

* Cache local das constantes
* Recalcular automaticamente quando forem carregadas

---

## 🔥 REGRAS DE NEGÓCIO — EXECUÇÃO RÍGIDA

### ✅ 1. VALIDAÇÃO DE APLICAÇÃO (GATILHO PRINCIPAL)

**Somente estas aplicações entram na tabela:**

* `pressurizacao`
* `exaustao_bateria`
* `exaustao_baia_trafo`

**SE aplicação for:**

* `climatizacao`
* vazia
* inválida

➡️ **NÃO criar linha**
➡️ **NÃO calcular absolutamente nada**

---

### ✅ 2. MAPEAMENTO OBRIGATÓRIO (APLICAÇÃO → TEXTO)

| Value               | Texto exibido               |
| ------------------- | --------------------------- |
| pressurizacao       | Pressurização               |
| exaustao_bateria    | Exaustão da Sala de Bateria |
| exaustao_baia_trafo | Exaustão da Baia de Trafo   |

---

### ✅ 3. ORDEM DE EXECUÇÃO POR MÁQUINA (INVIOLÁVEL)

1. Validar aplicação
2. Atualizar **Tipo** com texto do `#tipo-{machineId}` getelementbyid
3. Atualizar **Aplicação** com texto mapeado `id="aplicacao-${machineId}` getelementbyid
4. Extrair **Capacidade** (número) de `#capacidade-{machineId}`getelementbyid
5. Calcular **VAZÃO DA MÁQUINA** (ver fórmulas)
6. Calcular **Solução** = `Math.ceil(vazao / capacidade)`
7. Atualizar spans da linha correspondente

---

## 🧮 FÓRMULAS MATEMÁTICAS EXATAS

### CONSTANTES FIXAS

```js
FATOR_CONVERSAO_W_CAL = 859.85
FATOR_PRESSURIZACAO = 3.6
```

---

### 🔹 PRESSURIZAÇÃO

```
vazao = valor_vazao_ar × 3.6
```
valor do elemento no campo 
```
#vazao-ar-{roomId} getelementbyid
```

---

### 🔹 EXAUSTÃO SALA DE BATERIA

```
vazao = volume_sala × 12
``
valor do elemento no campo 
```
#volume-{roomId} getelementbyid
```

---

### 🔹 EXAUSTÃO BAIA DE TRAFO

```
Q = potencia_w × 859.85
ΔT = temp_interna − temp_externa
massa_ar = Q ÷ (calor_especifico × ΔT)
vazao = massa_ar ÷ densidade_ar
```


valor do elemento no campo pela tabela 1
```
#potencia-{roomId} getelementbyid
#temp-interna-{roomId} getelementbyid
#temp-externa-{roomId} getelementbyid
```

---

## 📋 TABELA – SOLUÇÃO DAS MÁQUINAS

### Cabeçalho fixo:

| Nome | Tipo | Aplicação | Capacidade (m³/h) | Solução (Qtd) | Vazão da Máquina (m³/h) |

---

### Linha por máquina válida:

| Campo      | ID                                |
| ---------- | --------------------------------- |
| Nome       | `#solucao-title-{machineId}`      | getelementbyid
| Tipo       | `#solucao-tipo-{machineId}`       | getelementbyid
| Aplicação  | `#solucao-aplicacao-{machineId}`  | getelementbyid
| Capacidade | `#solucao-capacidade-{machineId}` | getelementbyid
| Solução    | `#solucao-qtd-{machineId}`        | calculos
| Vazão      | `#solucao-vazao-{machineId}`      | calculos

---

## 🔄 SISTEMA DE REATIVIDADE (EVENTOS PUROS)

### Gatilhos:

**1. Selects da máquina**

* `#tipo-{machineId}` → recalcular
* `#aplicacao-{machineId}` → validar + recalcular
* `#capacidade-{machineId}` → recalcular

**2. Inputs técnicos (impactam TODAS as máquinas da sala)**

* `#vazao-ar-{roomId}`  getelementbyid
* `#volume-{roomId}` getelementbyid
* `#potencia-{roomId}` getelementbyid
* `#temp-interna-{roomId}` getelementbyid
* `#temp-externa-{roomId}` getelementbyid

**3. Nome da máquina**

* `#title-{machineId}` → sincronizar com tabela com getelementbyid

**4. Fator de procura**

os campos referentes a 
#tipo-{machineId}`
#aplicacao-{machineId}
#capacidade-{machineId}
são adicionados ao dom após eu adicionar uma maquina por meio do botao 
        <div class="add-machine">
            <button class="btn btn-add-secondary" onclick="addMachine('${finalRoomId}')">+ Adicionar Máquina</button> 
        </div>

        função add machine abaixo 
        async function addMachine(roomId) {
    const container = document.getElementById(`machines-${roomId}`);
    if (!container) return;

    const machineId = generateMachineId(roomId);
    const machineCount = container.querySelectorAll(".climatization-machine").length;

    try {
        const machinesData = await loadMachinesData();
        if (!machinesData.machines.length) throw new Error("Nenhum dado disponível");

        const autoName = `Maquina ${machineCount + 1}`;
        const machineHTML = buildMachineHTML(machineId, autoName, machinesData.machines, roomId);
        container.insertAdjacentHTML("beforeend", machineHTML);

        const emptyMsg = container.querySelector('.empty-message');
        if (emptyMsg) emptyMsg.remove();

        updateAllMachinesTotal(roomId);
        console.log(`✅ Máquina ${autoName} adicionada à sala ${roomId}`);
        return true;
    } catch (error) {
        console.error("❌ Erro ao adicionar máquina:", error);
        showEmptyMessage(container, "Erro ao carregar dados");
    }
}

-- a partir disso assim que eu selecionar os 3 campos 
${buildFormGroup("Tipo:", `<select id="tipo-${machineId}" class="form-input machine-type-select" data-machine-id="${machineId}" onchange="updateMachineOptions(this)"><option value="">Selecionar</option>${machineTypes.map(opt => `<option value="${opt}">${opt}</option>`).join('')}</select>`)}
${buildFormGroup("Aplicação:", `<select id="aplicacao-${machineId}" class="form-input machine-aplicacao-select" data-machine-id="${machineId}" onchange="handleAplicacaoChange('${machineId}')"><option value="">Selecionar</option><option value="climatizacao">Climatização</option><option value="pressurizacao">Pressurização</option><option value="exaustao_bateria">Exaustão da sala de bateria</option><option value="exaustao_baia_trafo">Exaustão da sala baia de trafo</option></select>`)}
${buildFormGroup("Capacidade:", `<select id="capacidade-${machineId}" class="form-input machine-power-select" data-machine-id="${machineId}" onchange="handlePowerChange('${machineId}')" disabled><option value="">Selecionar</option></select>`)}

a linha referente a maquinaID deve ser adicionadas, conforme as regras, e calculada os valores referentes