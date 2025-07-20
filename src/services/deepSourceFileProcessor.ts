
import { supabase } from "@/integrations/supabase/client";

export interface FileModification {
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  changes: string[];
}

export class DeepSourceFileProcessor {
  private static instance: DeepSourceFileProcessor;

  static getInstance(): DeepSourceFileProcessor {
    if (!DeepSourceFileProcessor.instance) {
      DeepSourceFileProcessor.instance = new DeepSourceFileProcessor();
    }
    return DeepSourceFileProcessor.instance;
  }

  /**
   * Apply comprehensive fixes to TypeScript/JavaScript files
   */
  async processTypeScriptFile(content: string, filePath: string): Promise<FileModification> {
    let modifiedContent = content;
    const changes: string[] = [];

    // Phase 1: Remove console.log statements
    const consoleLogs = modifiedContent.match(/console\.(log|warn|error|info)\([^)]*\);?\s*/g);
    if (consoleLogs) {
      modifiedContent = modifiedContent.replace(/console\.(log|warn|error|info)\([^)]*\);?\s*/g, '');
      changes.push(`Removed ${consoleLogs.length} console statements`);
    }

    // Phase 2: Fix unused imports
    const unusedImports = this.detectUnusedImports(modifiedContent);
    if (unusedImports.length > 0) {
      modifiedContent = this.removeUnusedImports(modifiedContent, unusedImports);
      changes.push(`Removed ${unusedImports.length} unused imports`);
    }

    // Phase 3: Replace 'let' with 'const' where appropriate
    const letToConstFixes = this.fixLetToConst(modifiedContent);
    if (letToConstFixes.changes > 0) {
      modifiedContent = letToConstFixes.content;
      changes.push(`Converted ${letToConstFixes.changes} 'let' declarations to 'const'`);
    }

    // Phase 4: Add missing semicolons
    const semicolonFixes = this.addMissingSemicolons(modifiedContent);
    if (semicolonFixes.changes > 0) {
      modifiedContent = semicolonFixes.content;
      changes.push(`Added ${semicolonFixes.changes} missing semicolons`);
    }

    // Phase 5: Fix React key props
    const keyFixes = this.addMissingReactKeys(modifiedContent);
    if (keyFixes.changes > 0) {
      modifiedContent = keyFixes.content;
      changes.push(`Added ${keyFixes.changes} missing React keys`);
    }

    // Phase 6: Remove unnecessary React fragments
    const fragmentFixes = this.removeUnnecessaryFragments(modifiedContent);
    if (fragmentFixes.changes > 0) {
      modifiedContent = fragmentFixes.content;
      changes.push(`Removed ${fragmentFixes.changes} unnecessary React fragments`);
    }

    // Phase 7: Fix TypeScript 'any' types
    const anyTypeFixes = this.fixAnyTypes(modifiedContent);
    if (anyTypeFixes.changes > 0) {
      modifiedContent = anyTypeFixes.content;
      changes.push(`Fixed ${anyTypeFixes.changes} 'any' type usages`);
    }

    return {
      filePath,
      originalContent: content,
      modifiedContent,
      changes
    };
  }

  private detectUnusedImports(content: string): string[] {
    const unusedImports: string[] = [];
    const importRegex = /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"][^'"]+['"];?/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const namedImports = match[1]?.split(',').map(imp => imp.trim()) || [];
      const namespaceImport = match[2];
      const defaultImport = match[3];

      // Check if imports are used in the content
      if (namedImports.length > 0) {
        namedImports.forEach(imp => {
          const cleanImport = imp.replace(/\s+as\s+\w+/, '').trim();
          if (!this.isImportUsed(content, cleanImport) && !this.isImportUsed(content, imp)) {
            unusedImports.push(cleanImport);
          }
        });
      }

      if (namespaceImport && !this.isImportUsed(content, namespaceImport)) {
        unusedImports.push(namespaceImport);
      }

      if (defaultImport && !this.isImportUsed(content, defaultImport)) {
        unusedImports.push(defaultImport);
      }
    }

    return unusedImports;
  }

  private isImportUsed(content: string, importName: string): boolean {
    const regex = new RegExp(`\\b${importName}\\b`, 'g');
    const matches = content.match(regex);
    return matches && matches.length > 1; // More than 1 because it appears in import statement
  }

  private removeUnusedImports(content: string, unusedImports: string[]): string {
    let modifiedContent = content;
    
    unusedImports.forEach(unusedImport => {
      // Remove from named imports
      const namedImportRegex = new RegExp(`\\s*,?\\s*${unusedImport}\\s*,?`, 'g');
      modifiedContent = modifiedContent.replace(namedImportRegex, '');
      
      // Clean up empty import statements
      modifiedContent = modifiedContent.replace(/import\s+\{\s*\}\s+from\s+['"][^'"]+['"];?/g, '');
    });

    return modifiedContent;
  }

  private fixLetToConst(content: string): { content: string; changes: number } {
    let changes = 0;
    let modifiedContent = content;

    // Find 'let' declarations that are never reassigned
    const letRegex = /\blet\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
    let match;
    const variables: string[] = [];

    while ((match = letRegex.exec(content)) !== null) {
      variables.push(match[1]);
    }

    variables.forEach(variable => {
      const reassignmentRegex = new RegExp(`\\b${variable}\\s*=(?!=)`, 'g');
      const reassignments = content.match(reassignmentRegex);
      
      if (!reassignments || reassignments.length === 1) {
        modifiedContent = modifiedContent.replace(
          new RegExp(`\\blet\\s+(${variable})\\s*=`, 'g'),
          `const $1 =`
        );
        changes++;
      }
    });

    return { content: modifiedContent, changes };
  }

  private addMissingSemicolons(content: string): { content: string; changes: number } {
    let changes = 0;
    let modifiedContent = content;

    // Add semicolons after statements that don't have them
    const patterns = [
      /(\w+\s*\([^)]*\))\s*$/gm,
      /(return\s+[^;\n]+)\s*$/gm,
      /(const\s+\w+\s*=\s*[^;\n]+)\s*$/gm,
      /(let\s+\w+\s*=\s*[^;\n]+)\s*$/gm,
      /(var\s+\w+\s*=\s*[^;\n]+)\s*$/gm
    ];

    patterns.forEach(pattern => {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern, '$1;');
        changes += matches.length;
      }
    });

    return { content: modifiedContent, changes };
  }

  private addMissingReactKeys(content: string): { content: string; changes: number } {
    let changes = 0;
    let modifiedContent = content;

    // Find JSX elements in .map() without key props
    const mapWithoutKeyRegex = /\.map\([^)]*=>\s*<(\w+)(?![^>]*\bkey=)[^>]*>/g;
    const matches = modifiedContent.match(mapWithoutKeyRegex);
    
    if (matches) {
      matches.forEach(match => {
        const elementMatch = match.match(/<(\w+)/);
        if (elementMatch) {
          const element = elementMatch[1];
          const withKey = match.replace(
            `<${element}`,
            `<${element} key={index}`
          );
          modifiedContent = modifiedContent.replace(match, withKey);
          changes++;
        }
      });
    }

    return { content: modifiedContent, changes };
  }

  private removeUnnecessaryFragments(content: string): { content: string; changes: number } {
    let changes = 0;
    let modifiedContent = content;

    // Remove React.Fragment or <> when wrapping single elements
    const fragmentRegex = /(<React\.Fragment>|<>)\s*(<[^>]+>[^<]*<\/[^>]+>)\s*(<\/React\.Fragment>|<\/>)/g;
    const matches = modifiedContent.match(fragmentRegex);
    
    if (matches) {
      matches.forEach(match => {
        const singleElementMatch = match.match(/(<React\.Fragment>|<>)\s*(<[^>]+>[^<]*<\/[^>]+>)\s*(<\/React\.Fragment>|<\/>)/);
        if (singleElementMatch) {
          modifiedContent = modifiedContent.replace(match, singleElementMatch[2]);
          changes++;
        }
      });
    }

    return { content: modifiedContent, changes };
  }

  private fixAnyTypes(content: string): { content: string; changes: number } {
    let changes = 0;
    let modifiedContent = content;

    // Replace common 'any' patterns with better types
    const anyPatterns = [
      { from: /:\s*any\[\]/, to: ': unknown[]', desc: 'array types' },
      { from: /:\s*any\s*=/, to: ': unknown =', desc: 'variable types' },
      { from: /\(.*:\s*any\)/, to: '(param: unknown)', desc: 'parameter types' }
    ];

    anyPatterns.forEach(pattern => {
      const matches = modifiedContent.match(pattern.from);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern.from, pattern.to);
        changes += matches.length;
      }
    });

    return { content: modifiedContent, changes };
  }

  /**
   * Process CSS/SCSS files
   */
  async processCSSFile(content: string, filePath: string): Promise<FileModification> {
    let modifiedContent = content;
    const changes: string[] = [];

    // Remove unused CSS rules (basic implementation)
    const duplicateRules = this.findDuplicateCSSRules(content);
    if (duplicateRules.length > 0) {
      modifiedContent = this.removeDuplicateCSSRules(modifiedContent, duplicateRules);
      changes.push(`Removed ${duplicateRules.length} duplicate CSS rules`);
    }

    return {
      filePath,
      originalContent: content,
      modifiedContent,
      changes
    };
  }

  private findDuplicateCSSRules(content: string): string[] {
    const rules = content.match(/[^{}]+\{[^{}]*\}/g) || [];
    const seen = new Set<string>();
    const duplicates: string[] = [];

    rules.forEach(rule => {
      const normalized = rule.replace(/\s+/g, ' ').trim();
      if (seen.has(normalized)) {
        duplicates.push(rule);
      } else {
        seen.add(normalized);
      }
    });

    return duplicates;
  }

  private removeDuplicateCSSRules(content: string, duplicates: string[]): string {
    let modifiedContent = content;
    
    duplicates.forEach(duplicate => {
      const index = modifiedContent.lastIndexOf(duplicate);
      if (index !== -1) {
        modifiedContent = modifiedContent.substring(0, index) + 
                         modifiedContent.substring(index + duplicate.length);
      }
    });

    return modifiedContent;
  }

  /**
   * Generate comprehensive report
   */
  generateFixReport(modifications: FileModification[]): {
    totalFiles: number;
    totalChanges: number;
    changesByType: Record<string, number>;
    summary: string;
  } {
    const totalFiles = modifications.length;
    const totalChanges = modifications.reduce((sum, mod) => sum + mod.changes.length, 0);
    const changesByType: Record<string, number> = {};

    modifications.forEach(mod => {
      mod.changes.forEach(change => {
        const type = change.split(' ')[1] || 'Other';
        changesByType[type] = (changesByType[type] || 0) + 1;
      });
    });

    const summary = `
Fixed ${totalChanges} issues across ${totalFiles} files:
${Object.entries(changesByType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}
    `.trim();

    return {
      totalFiles,
      totalChanges,
      changesByType,
      summary
    };
  }
}

export const deepSourceFileProcessor = DeepSourceFileProcessor.getInstance();
