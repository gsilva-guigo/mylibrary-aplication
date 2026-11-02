# MyLibrary

App de celular (iOS e Android) para catalogar uma biblioteca pessoal: a pessoa fotografa a folha de rosto de cada livro, o celular lê o texto, uma IA separa título, autor, edição e editora, e o livro entra no acervo com o lugar onde está na casa.

Estado atual: **Etapa 1 — teste de leitura.** O app tem uma única tela que fotografa folhas de rosto, lê o texto no próprio aparelho e registra se a leitura saiu boa. Serve para validar a ideia central com livros reais antes de construir o resto.

## Como rodar no iPhone (Mac + iPhone)

O reconhecimento de texto usa código nativo, então o app **não abre no Expo Go**. É preciso instalar uma versão de desenvolvimento no iPhone, compilada no Mac pelo Xcode. Uma conta Apple comum (gratuita) basta para instalar no seu próprio aparelho; a instalação gratuita vale por 7 dias e depois é só compilar de novo.

### Uma vez só

1. **macOS e Xcode.** Instale o Xcode pela App Store e abra uma vez para aceitar a licença e baixar os componentes de iOS. O Expo SDK 58 exige uma versão recente do Xcode; se a App Store disser que o seu macOS é antigo demais, veja "Se o Xcode não instalar" abaixo.
2. **Ferramentas de linha de comando.** No Terminal:
   ```sh
   xcode-select --install
   ```
3. **Node.js** (versão 20 ou mais nova): baixe o instalador LTS em nodejs.org.
4. **CocoaPods** (instala as dependências nativas do iOS):
   ```sh
   brew install cocoapods
   ```
   Sem Homebrew: `sudo gem install cocoapods`.
5. **Conta Apple no Xcode.** Xcode → Settings → Accounts → "+" → entre com o seu Apple ID.
6. **iPhone em modo de desenvolvedor.** Ligue o iPhone no Mac pelo cabo, confie no computador, e ative Ajustes → Privacidade e Segurança → Modo de Desenvolvedor (o iPhone reinicia).

### A cada vez

```sh
git clone https://github.com/gsilva-guigo/mylibrary-aplication.git
cd mylibrary-aplication
npm install
npx expo run:ios --device
```

Escolha o iPhone na lista. A primeira compilação leva vários minutos. Se o Xcode pedir um "Team", escolha o seu nome (Personal Team). Na primeira abertura, o iPhone pode bloquear o app: Ajustes → Geral → VPN e Gerenciamento de Dispositivo → confie no seu Apple ID.

Depois da primeira instalação, basta `npx expo start` com o iPhone na mesma rede Wi-Fi para ver as mudanças de código na hora. Só é preciso recompilar quando entrar uma biblioteca nativa nova.

### Se o Xcode não instalar

Macs com chip Intel mais antigos podem não rodar o macOS que o Xcode atual exige. Nesse caso, a compilação vai para a nuvem do Expo (EAS Build), o que exige a conta paga de desenvolvedor Apple (cerca de US$ 99 por ano):

```sh
npx eas-cli@latest build --profile development --platform ios
```

## Como usar o teste de leitura

1. Toque em **Fotografar** e enquadre a folha de rosto inteira, com boa luz e sem reflexo.
2. Compare o texto lido com a página e toque em **Legível**, **Com erros** ou **Ilegível**.
3. Repita com pelo menos 20 livros, misturando épocas e editoras. Comece pelos mais antigos.
4. Toque em **Exportar testes (CSV)** e mande o arquivo para análise.

O teste passa se a maioria sair legível ou com erros pequenos que a IA consegue corrigir (um acento trocado, uma letra a mais).

## Desenvolvimento

```sh
npm test            # testes das regras de ISBN, normalização e duplicatas
npm run typecheck   # checagem de tipos
```

Estrutura:

| Pasta | O que tem |
| --- | --- |
| `src/app/` | Telas (Expo Router: cada arquivo é uma tela) |
| `src/features/` | Código de cada funcionalidade, fora das telas |
| `src/lib/` | Regras puras e testadas: ISBN, normalização de texto, duplicatas, CSV, resumo do OCR |
| `src/theme.ts` | Cores do app, claro e escuro |

## Roteiro

1. **Teste de leitura** (atual): validar o reconhecimento de texto com livros reais.
2. **Base do app:** login, banco de dados (Supabase) e árvore de locais (andar, cômodo, estante).
3. **Cadastro completo:** texto lido no celular → IA separa os campos → conferência de duplicatas → livro salvo na estante.
4. **Exportação** em CSV e Excel.
5. **Assinatura e publicação** nas lojas.
6. **Planta da casa** por andar (V2).

O plano de produto completo está no documento "Acervo — app para consumidor".
