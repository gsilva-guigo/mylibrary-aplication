# MyLibrary — contexto para o Claude

Leia também `AGENTS.md` (regras do Expo para este projeto).

## O produto

App de assinatura para pessoas físicas catalogarem bibliotecas pessoais grandes (o acervo do dono tem cerca de 16 mil livros, quase todos antigos e sem código de barras). Desenvolvido por Guilherme (dono do repositório) com ajuda de IA. Toda a interface e a documentação são em português do Brasil.

Decisões de produto já tomadas (não reabrir sem o dono pedir):

- Cadastro: foto da folha de rosto → reconhecimento de texto **no aparelho** (`expo-text-extractor`: Apple Vision / Google ML Kit) → se houver ISBN válido ou o livro já estiver no catálogo compartilhado, sem IA → senão, **só o texto** vai para a IA (via função no servidor, nunca com a chave no app), que devolve os campos em JSON. Imagem para a IA só como último recurso.
- Código de barras não é o fluxo principal (livros antigos não têm).
- Locais em árvore (casa > andar > cômodo > estante > prateleira opcional). O exemplar guarda só o id do nó folha; os níveis acima são derivados. Planta desenhada só na V2.
- Obra (dados bibliográficos, compartilhável entre usuários) é separada de exemplar (cópia física, privada, com local e conservação).
- Duplicatas: ISBN igual (comparar em ISBN-13) ou título normalizado igual com sobrenome de autor em comum; a pessoa decide entre "Não adicionar" e "Adicionar outro exemplar". Regras em `src/lib/duplicates.ts`.
- Uma pessoa por acervo no MVP.
- Plano grátis até 50 livros. Sem assinatura ativa, o acervo fica bloqueado; só a exportação continua, **sem as colunas de local**.
- Exportação em CSV (separador `;`, BOM UTF-8) e Excel.
- Stack: Expo (SDK 58, Expo Router, TypeScript), Supabase (Postgres, Auth, Edge Functions), RevenueCat para assinaturas.

## Ambiente do dono

MacBook com chip Intel e iPhone 16. O app precisa de development build (`npx expo run:ios --device`); não roda no Expo Go por causa do OCR nativo.

## Convenções

- Regras de negócio puras em `src/lib/`, com testes em `src/lib/__tests__/` (`npm test`). Telas em `src/app/`, sem lógica de negócio pesada.
- Antes de encerrar uma tarefa: `npm run typecheck` e `npm test`.
- Instalar dependências com `npx expo install` (neste ambiente de nuvem, `EXPO_OFFLINE=1 npx expo install <pacote>`, porque a API do Expo não é alcançável).
- Não criar nem editar `ios/` e `android/` à mão (geradas pelo Expo, ignoradas no git).
