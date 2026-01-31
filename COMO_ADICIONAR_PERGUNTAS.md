# Guia: Como Adicionar Novas Perguntas ao ARSQuestion

## 1. Introdução

Este documento detalha o processo de criação e adição de novos conjuntos de perguntas (categorias) ao jogo ARSQuestion. Para adicionar novas perguntas, você precisará criar um arquivo JSON com uma estrutura específica e, em seguida, vincular esse arquivo ao jogo.

## 2. O Formato do Arquivo JSON

Cada arquivo JSON representa uma única categoria de perguntas. O arquivo deve seguir uma estrutura rigorosa para que o jogo possa lê-lo corretamente.

A estrutura principal do arquivo é um objeto contendo metadados da categoria e uma lista de perguntas.

```json
{
  "category": "Nome da Categoria",
  "subcategory": "Nome da Subcategoria",
  "questions": [
    // ... lista de objetos de pergunta aqui ...
  ]
}
```

### Campos Principais

*   `category` (Texto): O nome principal da categoria. Ex: `"História"`, `"Ciência"`.
*   `subcategory` (Texto): Um nome mais específico para o conjunto de perguntas. Ex: `"Mundo"`, `"Biologia"`.
*   `questions` (Lista): Uma lista (array) que contém todas as perguntas desta categoria. Cada item na lista é um objeto com os detalhes da pergunta.

### A Estrutura de Cada Pergunta

Cada objeto dentro da lista `questions` deve ter os seguintes campos:

*   `id` (Texto): Um identificador **único** para a pergunta. É recomendado usar um prefixo da categoria para evitar duplicatas. Ex: `"hist-mundo-001"`.
*   `question` (Texto): O texto da pergunta que será exibido ao jogador.
*   `options` (Lista de Textos): Uma lista contendo **exatamente 4** alternativas de resposta.
*   `correctAnswerIndex` (Número): A posição da resposta correta na lista `options`. A contagem começa em 0.
    *   Se a primeira opção for a correta, o valor é `0`.
    *   Se a segunda opção for a correta, o valor é `1`.
    *   E assim por diante.
*   `hint` (Texto): O texto da dica que é mostrada quando o jogador usa a ajuda "DICA".
*   `hintCorrect` (Texto): A mensagem ou curiosidade exibida quando o jogador **acerta** a pergunta.
*   `hintWrong` (Texto): A mensagem ou explicação exibida quando o jogador **erra** a pergunta.
*   `difficulty` (Texto): O nível de dificuldade da pergunta. Valores aceitos são `"easy"`, `"medium"`, ou `"hard"`. Isso afeta a cor da barra de progresso durante a pergunta.

## 3. Exemplo Completo de um Arquivo JSON

Aqui está um exemplo de um arquivo completo chamado `geografia.json`.

```json
{
  "category": "Geografia",
  "subcategory": "Capitais",
  "questions": [
    {
      "id": "geo-cap-001",
      "question": "Qual é a capital do Japão?",
      "options": [
        "Pequim",
        "Seul",
        "Tóquio",
        "Bangkok"
      ],
      "correctAnswerIndex": 2,
      "hint": "É uma das cidades mais populosas do mundo.",
      "hintCorrect": "Correto! Tóquio é a vibrante capital do Japão, conhecida por sua mistura de tradição e ultramodernidade.",
      "hintWrong": "Incorreto. A resposta certa é Tóquio. Pequim é a capital da China.",
      "difficulty": "easy"
    },
    {
      "id": "geo-cap-002",
      "question": "Qual é a capital da Austrália?",
      "options": [
        "Sydney",
        "Melbourne",
        "Canberra",
        "Perth"
      ],
      "correctAnswerIndex": 2,
      "hint": "Apesar de Sydney ser mais famosa, a capital é outra cidade planejada.",
      "hintCorrect": "Exato! Muitas pessoas se confundem, mas Canberra é a capital da Austrália.",
      "hintWrong": "Errado. Sydney é a cidade mais populosa, mas não a capital. A resposta é Canberra.",
      "difficulty": "medium"
    }
  ]
}
```

## 4. Vinculando o Novo Arquivo ao Jogo

Depois de criar seu arquivo JSON e garantir que o formato está correto, siga estes dois passos para que ele apareça no jogo:

### Passo 1: Adicionar o arquivo à pasta `data`

Coloque o seu novo arquivo JSON (ex: `geografia.json`) dentro da pasta `data/` que se encontra na raiz do projeto.

### Passo 2: Registrar o arquivo no sistema

Abra o arquivo `js/app.js`. Logo no início do arquivo, você encontrará uma lista chamada `QUIZ_FILES`. Adicione o nome do seu novo arquivo a esta lista.

**Exemplo:**

Se a lista original é assim:
```javascript
const QUIZ_FILES = ['sample.json', 'historia.json', 'ciencia.json'];
```

E você criou o arquivo `geografia.json`, a lista deve ficar assim:
```javascript
const QUIZ_FILES = ['sample.json', 'historia.json', 'ciencia.json', 'geografia.json'];
```

**Pronto!** Após salvar a alteração no arquivo `js/app.js`, o jogo irá automaticamente carregar a nova categoria e exibi-la na tela de seleção na próxima vez que a página for carregada.
