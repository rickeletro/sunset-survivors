# SUNSET SURVIVORS — Git & Commit Rules

Diretrizes obrigatórias para commits e gerenciamento de repositório no projeto **SUNSET SURVIVORS**.

## 1. Padrão de Mensagens (Conventional Commits)

Todas as mensagens de commit devem seguir o padrão **Conventional Commits** em **Inglês**, utilizando verbos no imperativo e em minúsculas após o prefixo:

| Prefixo | Uso | Exemplo |
|---|---|---|
| `feat:` | Nova funcionalidade, tela, arte, mecânica ou asset | `feat: update level up background with high-res saloon interior` |
| `fix:` | Correção de bug visual, áudio ou lógica de jogo | `fix: prevent scale reset on players group entrance tween` |
| `refactor:` | Reestruturação de código sem mudar comportamento | `refactor: clean up obsolete background props from level up scene` |
| `style:` | Ajustes de layout, espaçamento, CSS ou estética | `style: reposition menu button and improve start button border glow` |
| `test:` | Adição ou complementação de testes automatizados | `test: add unit tests for sound manager volume persistence` |
| `chore:` | Tarefas de manutenção, limpeza de disco ou configs | `chore: clean temporary cache and update git rules` |
| `docs:` | Atualizações em documentação ou AGENTS.md | `docs: add git commit conventions to agents rules` |

---

## 2. Pré-requisitos Obrigatórios Antes de Commitar

Nunca realize commit sem que as duas verificações abaixo passem com 100% de sucesso:

1. **Checagem de Tipos TypeScript (Sem erros):**
   ```bash
   npx tsc --noEmit
   ```
2. **Suíte de Testes Automatizados (Zero falhas):**
   ```bash
   npm test
   ```

---

## 3. Boas Práticas do Repositório

- **Commits Atômicos:** Faça commits focados e com escopo bem definido (evite agrupar alterações de telas ou mecânicas não correlatas em um único commit gigante).
- **Não commitar arquivos temporários ou de lock:**
  - Evite subir arquivos desnecessários de cache, logs ou `.lock` temporários.
  - Certifique-se de que `.git/index.lock` não esteja bloqueando antes de commitar.
- **Preservação de Regras:** Nenhuma alteração pode quebrar testes ou regras de negócio existentes (princípio de não-regressão).
