import { readdirSync, readFileSync } from 'node:fs';
import ts from 'typescript';
import { expect, it } from 'vitest';
it('keeps displayed TypeScript copy in English, excluding comments and asset paths', () => {
  const errors = [];
  function scan(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = `${folder}/${entry.name}`;
      if (entry.isDirectory()) { scan(path); continue; }
      if (!path.endsWith('.ts') || path.includes('.test.') || path.includes('/i18n/')) continue;
      const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
      function visit(n) {
        if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
          const value = n.text;
          if (!value.includes('assets/') && /[ãõçáéíóú]|\b(ENTRAR|VOLTAR|PULAR|ESCOLHER|FASES|DESENVOLVEDOR|HOSPITALIDADE|PROVISOES|FICHA|GANHOS|APOSTAR|CURA|CONCLUIDA|SOBREVIVA|OPCIONAIS|SEGURE|ABATES|CHEFE|GANHO|SOFRIDO)\b/i.test(value)) errors.push(`${path}: ${value}`);
        }
        ts.forEachChild(n, visit);
      }
      visit(source);
    }
  }
  scan('src'); expect(errors).toEqual([]);
});
