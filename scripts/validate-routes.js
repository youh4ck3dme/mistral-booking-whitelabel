#!/usr/bin/env node

/**
 * @file validate-routes.js
 * @description Script pro validaci všech odkazů a rout v aplikaci
 * @author NEXIFY Team + Mistral Vibe
 * @version 1.0.0
 * @usage node scripts/validate-routes.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

// Konfigurace
const CONFIG = {
  // Adresáře pro prohledávání
  srcDirectories: [
    'apps/web/app/**/*.{tsx,ts,jsx,js}',
    'apps/web/src/**/*.{tsx,ts,jsx,js}',
    'apps/web/(marketing)/**/*.{tsx,ts,jsx,js}',
  ],
  
  // Známé existující routy
  knownRoutes: [
    // Veřejné routy
    '/',
    '/404',
    '/privacy',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/logout',
    
    // Platform routy
    '/platform',
    '/platform/tenants/new',
    
    // Dynamické vzory
    '/[tenantSlug]',
    '/[tenantSlug]/book',
    '/[tenantSlug]/portal',
    '/[tenantSlug]/admin',
    '/[tenantSlug]/admin/services/new',
    '/[tenantSlug]/admin/services/[serviceId]/edit',
    
    // API endpointy
    '/api/notifications/dispatch',
    '/api/notifications/reminders',
    
    // Vertikální routy (z vertical-routing.ts)
    '/barber-lounge/book',
    '/beauty-studio/book',
    '/recovery-massage/book',
    '/apex-fitness/book',
    '/motion-physio/book',
    '/demo-clinic/book',
    '/ink-tattoo/book',
  ],
  
  // Známé tenanty
  knownTenants: [
    'demo-clinic',
    'barber-lounge',
    'beauty-studio',
    'recovery-massage',
    'apex-fitness',
    'motion-physio',
    'ink-tattoo'
  ],
  
  // Známé neexistující routy (pro detekci)
  knownBadRoutes: [
    '/terms',
    '/admin',
    '/dashboard'
  ],
  
  // Ignorované vzory (externí odkazy, atd.)
  ignorePatterns: [
    /^https?:\/\//,
    /^mailto:/,
    /^tel:/,
    /^#/,
    /^\/\//,
  ],
  
  // Priznané router.push() cíle
  knownRouterPushRoutes: [
    '/login',
    '/signup',
    '/platform',
    '/platform?tab=tenants',
    '/demo-clinic',
  ],
};

// Barvy pro výstup
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  bold: chalk.bold,
};

// Hlavní třída pro validaci
class RouteValidator {
  constructor() {
    this.issues = [];
    this.stats = {
      totalFiles: 0,
      totalLinks: 0,
      validLinks: 0,
      invalidLinks: 0,
      knownIssues: 0,
      unknownIssues: 0,
    };
  }

  // Spuštění validace
  async run() {
    console.log(colors.bold('\n🚀 NEXIFY Route Validator'));
    console.log(colors.info('Validuji všechny odkazy a routy v aplikaci...\n'));

    try {
      // Prohledá všechny soubory
      const files = this.findAllFiles();
      this.stats.totalFiles = files.length;
      
      console.log(colors.info(`Nalezeno ${files.length} souborů k prozkoumání\n`));

      // Projdi všechny soubory
      for (const file of files) {
        await this.processFile(file);
      }

      // Zobraz výsledky
      this.displayResults();

      // Vrať exit code
      return this.issues.length > 0 ? 1 : 0;
    } catch (error) {
      console.error(colors.error('Chyba při validaci:'), error);
      return 1;
    }
  }

  // Nalezení všech souborů
  findAllFiles() {
    let files = [];
    
    CONFIG.srcDirectories.forEach(pattern => {
      const matchedFiles = glob.sync(pattern, {
        ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
        absolute: false,
      });
      files = [...files, ...matchedFiles];
    });

    return files;
  }

  // Zpracování jednoho souboru
  async processFile(filePath) {
    try {
      const absolutePath = path.resolve(filePath);
      const content = fs.readFileSync(absolutePath, 'utf8');
      
      // Extrahuj všechny odkazy
      const links = this.extractLinksFromContent(content, filePath);
      this.stats.totalLinks += links.length;
      
      // Validuj odkazy
      for (const link of links) {
        const result = this.validateLink(link, filePath);
        if (result.isValid) {
          this.stats.validLinks++;
        } else {
          this.stats.invalidLinks++;
          this.issues.push({ ...result, file: filePath });
          
          if (CONFIG.knownBadRoutes.includes(link.href)) {
            this.stats.knownIssues++;
          } else {
            this.stats.unknownIssues++;
          }
        }
      }
    } catch (error) {
      console.error(colors.error(`Chyba při čtení souboru ${filePath}:`), error.message);
    }
  }

  // Extrakce odkazů z obsahu
  extractLinksFromContent(content, filePath) {
    const links = [];
    
    // Hledej <a href="...">
    const aHrefMatches = content.match(/href=["']([^"']+)["']/g) || [];
    aHrefMatches.forEach(match => {
      const href = match.match(/href=["']([^"']+)["']/)[1];
      links.push({ type: 'anchor', href, line: this.findLineNumber(content, match) });
    });
    
    // Hledej <Link href="...">
    const linkHrefMatches = content.match(/<Link[^>]*href=["']([^"']+)["'][^>]*>/g) || [];
    linkHrefMatches.forEach(match => {
      const href = match.match(/href=["']([^"']+)["']/)[1];
      links.push({ type: 'next-link', href, line: this.findLineNumber(content, match) });
    });
    
    // Hledej router.push("...")
    const routerPushMatches = content.match(/router\.push\(["']([^"']+)["']\)/g) || [];
    routerPushMatches.forEach(match => {
      const href = match.match(/router\.push\(["']([^"']+)["']\)/)[1];
      links.push({ type: 'router-push', href, line: this.findLineNumber(content, match) });
    });
    
    // Hledej router.replace("...")
    const routerReplaceMatches = content.match(/router\.replace\(["']([^"']+)["']\)/g) || [];
    routerReplaceMatches.forEach(match => {
      const href = match.match(/router\.replace\(["']([^"']+)["']\)/)[1];
      links.push({ type: 'router-replace', href, line: this.findLineNumber(content, match) });
    });
    
    // Hledej redirect("...")
    const redirectMatches = content.match(/redirect\(["']([^"']+)["']\)/g) || [];
    redirectMatches.forEach(match => {
      const href = match.match(/redirect\(["']([^"']+)["']\)/)[1];
      links.push({ type: 'redirect', href, line: this.findLineNumber(content, match) });
    });
    
    return links;
  }

  // Nalezení čísla řádku
  findLineNumber(content, substring) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(substring)) {
        return i + 1;
      }
    }
    return -1;
  }

  // Validace odkazu
  validateLink(link, filePath) {
    const href = link.href;
    
    // Ignoruj specialní odkazy
    if (this.shouldIgnore(href)) {
      return { ...link, isValid: true, reason: 'Ignorovaný (externí/anchor)' };
    }
    
    // Zkontroluj, zda je to známá routa
    if (CONFIG.knownRoutes.includes(href)) {
      return { ...link, isValid: true, reason: 'Známá routa' };
    }
    
    // Zkontroluj, zda je to známý tenant
    if (CONFIG.knownTenants.some(tenant => href === `/${tenant}` || href === `/${tenant}/book`)) {
      return { ...link, isValid: true, reason: 'Známý tenant' };
    }
    
    // Zkontroluj dynamické routy
    if (this.isDynamicRoute(href)) {
      return { ...link, isValid: true, reason: 'Dynamická routa' };
    }
    
    // Zkontroluj, zda obsahuje tenant slug
    if (this.containsTenantSlug(href)) {
      return { ...link, isValid: true, reason: 'Obsahuje tenant slug' };
    }
    
    // Zkontroluj, zda obsahuje service ID
    if (this.containsServiceId(href)) {
      return { ...link, isValid: true, reason: 'Obsahuje service ID' };
    }
    
    // Zkontroluj známé router.push cíle
    if (CONFIG.knownRouterPushRoutes.includes(href)) {
      return { ...link, isValid: true, reason: 'Známý router.push cíl' };
    }
    
    // Zkontroluj, zda je to známá neexistující routa
    if (CONFIG.knownBadRoutes.includes(href)) {
      return { 
        ...link, 
        isValid: false, 
        reason: 'Známá neexistující routa',
        severity: 'high',
        suggestion: `Vytvořte stránku ${href} nebo změňte odkaz na existující routu`
      };
    }
    
    // Zkontroluj, zda je to query string
    if (href.includes('?')) {
      const basePath = href.split('?')[0];
      if (CONFIG.knownRoutes.includes(basePath) || this.containsTenantSlug(basePath)) {
        return { ...link, isValid: true, reason: 'Validní base path s query' };
      }
    }
    
    // Zkontroluj, zda je to absolutní path
    if (href.startsWith('/')) {
      return { 
        ...link, 
        isValid: false, 
        reason: 'Neznámá vnitřní routa',
        severity: 'medium',
        suggestion: `Zkontrolujte, zda routa ${href} existuje, nebo ji přidejte do CONFIG.knownRoutes`
      };
    }
    
    // Zkontroluj, zda je to relativní path
    if (!href.startsWith('/') && !href.startsWith('http')) {
      return { 
        ...link, 
        isValid: false, 
        reason: 'Relativní path (měl by být absolutní)',
        severity: 'medium',
        suggestion: `Změňte na absolutní path: /${href}`
      };
    }
    
    // Default - považuj za platný
    return { ...link, isValid: true, reason: 'Neurčitý, ale pravděpodobně platný' };
  }

  // Ignorování specialních odkazů
  shouldIgnore(href) {
    return CONFIG.ignorePatterns.some(pattern => pattern.test(href));
  }

  // Kontrola dynamických rout
  isDynamicRoute(href) {
    return href.includes('[') && href.includes(']');
  }

  // Kontrola, zda obsahuje tenant slug
  containsTenantSlug(href) {
    return CONFIG.knownTenants.some(tenant => href.includes(`/${tenant}/`) || href === `/${tenant}`);
  }

  // Kontrola, zda obsahuje service ID (UUID)
  containsServiceId(href) {
    // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    return uuidPattern.test(href);
  }

  // Zobrazení výsledků
  displayResults() {
    console.log('\n' + colors.bold('📊 Výsledky Validace'));
    console.log('─'.repeat(50));
    
    // Statistiky
    console.log(colors.info('\n📈 Statistiky:'));
    console.log(`  Celkem souborů: ${colors.bold(this.stats.totalFiles)}`);
    console.log(`  Celkem odkazů: ${colors.bold(this.stats.totalLinks)}`);
    console.log(`  Platných odkazů: ${colors.success(this.stats.validLinks)}`);
    console.log(`  Neplatných odkazů: ${colors.error(this.stats.invalidLinks)}`);
    console.log(`  Známé problémy: ${colors.warning(this.stats.knownIssues)}`);
    console.log(`  Neznámé problémy: ${colors.warning(this.stats.unknownIssues)}`);
    
    // Problémy
    if (this.issues.length > 0) {
      console.log('\n' + colors.error('❌ Nalezené Problémy:'));
      console.log('─'.repeat(50));
      
      this.issues.forEach((issue, index) => {
        const severityIcon = issue.severity === 'high' ? '🔴' : '🟡';
        console.log(`\n${index + 1}. ${severityIcon} ${colors.bold(issue.file)}:${issue.line}`);
        console.log(`   Typ: ${issue.type}`);
        console.log(`   Odkaz: ${colors.warning(issue.href)}`);
        console.log(`   Důvod: ${issue.reason}`);
        if (issue.suggestion) {
          console.log(`   Návrh: ${colors.info(issue.suggestion)}`);
        }
      });
    } else {
      console.log('\n' + colors.success('✅ Žádné problémy nalezeny! Všechny odkazy jsou správně nakonfigurovány.'));
    }
    
    // Souhrn
    console.log('\n' + '─'.repeat(50));
    if (this.issues.length === 0) {
      console.log(colors.success('✅ Validace úspěšná!'));
    } else {
      console.log(colors.error(`❌ Validace selhala: ${this.issues.length} problémů`));
    }
    console.log('\n');
  }
}

// Spuštění validace
async function main() {
  const validator = new RouteValidator();
  const exitCode = await validator.run();
  process.exit(exitCode);
}

// Spusť
main().catch(error => {
  console.error(colors.error('FATAL ERROR:'), error);
  process.exit(1);
});
