/**
 * @file eslint-plugin-nexify-routes/index.js
 * @description ESLint plugin pro detekci odkazů na neexistující routy
 * @author NEXIFY Team + Mistral Vibe
 * @version 1.0.0
 */

module.exports = {
  rules: {
    'valid-route': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detekuje odkazy na neexistující routy v NEXIFY aplikaci',
          category: 'Possible Errors',
          recommended: true,
        },
        schema: [],
      },
      create(context) {
        // Seznam známých existujících rout
        const knownRoutes = new Set([
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
          
          // API endpointy
          '/api/notifications/dispatch',
          '/api/notifications/reminders',
          
          // Vertikální routy
          '/barber-lounge/book',
          '/beauty-studio/book',
          '/recovery-massage/book',
          '/apex-fitness/book',
          '/motion-physio/book',
          '/demo-clinic/book',
          '/ink-tattoo/book',
        ]);
        
        // Známí tenanty
        const knownTenants = new Set([
          'demo-clinic',
          'barber-lounge',
          'beauty-studio',
          'recovery-massage',
          'apex-fitness',
          'motion-physio',
          'ink-tattoo'
        ]);
        
        // Známé neexistující routy
        const knownBadRoutes = new Set([
          '/terms',
          '/admin',
          '/dashboard'
        ]);
        
        // Regex pro detekci odkazů
        const hrefRegex = /href=["']([^"']+)["']/g;
        const routerPushRegex = /router\.push\(["']([^"']+)["']\)/g;
        const redirectRegex = /redirect\(["']([^"']+)["']\)/g;
        
        return {
          // Zpracování všech JS/TSX/TS souborů
          Program(node) {
            const sourceCode = context.getSourceCode();
            const text = sourceCode.text;
            
            // Extrahuj všechny odkazy
            const links = [...text.matchAll(hrefRegex), ...text.matchAll(routerPushRegex), ...text.matchAll(redirectRegex)];
            
            for (const match of links) {
              let href = match[1];
              
              // Ignoruj specialní odkazy
              if (href.startsWith('http://') || href.startsWith('https://') || 
                  href.startsWith('mailto:') || href.startsWith('tel:') ||
                  href.startsWith('#') || href.startsWith('//')) {
                continue;
              }
              
              // Normalizuj href (odstraň query parametry pro kontrolu)
              const baseHref = href.split('?')[0];
              
              // Zkontroluj, zda je to známá routa
              if (knownRoutes.has(href) || knownRoutes.has(baseHref)) {
                continue;
              }
              
              // Zkontroluj, zda je to známý tenant
              if (knownTenants.has(baseHref.replace(/^\//, ''))) {
                continue;
              }
              
              // Zkontroluj dynamické routy
              if (href.includes('[') && href.includes(']')) {
                continue;
              }
              
              // Zkontroluj, zda obsahuje známý tenant slug
              const hasKnownTenant = [...knownTenants].some(tenant => 
                href.includes(`/${tenant}/`) || href === `/${tenant}` || href === `/${tenant}/book`
              );
              
              if (hasKnownTenant) {
                continue;
              }
              
              // Zkontroluj, zda je to známá neexistující routa
              if (knownBadRoutes.has(href) || knownBadRoutes.has(baseHref)) {
                const line = text.substring(0, match.index).split('\n').length;
                context.report({
                  loc: { line, column: match.index },
                  message: `Odkaz na známou neexistující routu: '${href}'. Zvažte vytvoření této stránky nebo změnu odkazu.`,
                });
              }
            }
          },
        };
      },
    },
    
    'absolute-path': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Doporučuje používat absolutní pathy pro vnitřní odkazy',
          category: 'Best Practices',
          recommended: false,
        },
        schema: [],
        fixable: 'code',
      },
      create(context) {
        const relativePathRegex = /href=["']([^"'\/][^"']*)["']/g;
        
        return {
          Program(node) {
            const sourceCode = context.getSourceCode();
            const text = sourceCode.text;
            
            const matches = [...text.matchAll(relativePathRegex)];
            
            for (const match of matches) {
              const href = match[1];
              
              // Ignoruj anchor linky a speciální
              if (href.startsWith('#') || href.startsWith('?') || href.includes('://')) {
                continue;
              }
              
              // Ignoruj, pokud je to absolutní path
              if (href.startsWith('/')) {
                continue;
              }
              
              const line = text.substring(0, match.index).split('\n').length;
              context.report({
                loc: { line, column: match.index },
                message: `Relativní path '${href}' by měl být absolutní: '/${href}'`,
                fix: (fixer) => {
                  return fixer.replaceTextRange(
                    [match.index + 6, match.index + 6 + href.length],
                    `/${href}`
                  );
                },
              });
            }
          },
        };
      },
    },
    
    'prefer-next-link': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Doporučuje používat <Link> místo <a> pro vnitřní navigaci',
          category: 'Best Practices',
          recommended: false,
        },
        schema: [],
        fixable: 'code',
      },
      create(context) {
        const anchorRegex = /<a\s+href=["']([^"']+)["'][^>]*>/g;
        
        return {
          Program(node) {
            const sourceCode = context.getSourceCode();
            const text = sourceCode.text;
            
            const matches = [...text.matchAll(anchorRegex)];
            
            for (const match of matches) {
              const href = match[1];
              
              // Ignoruj externí odkazy
              if (href.startsWith('http://') || href.startsWith('https://') || 
                  href.startsWith('mailto:') || href.startsWith('tel:')) {
                continue;
              }
              
              // Ignoruj anchor linky
              if (href.startsWith('#')) {
                continue;
              }
              
              // Je to vnitřní odkaz - měl by používat Link
              const line = text.substring(0, match.index).split('\n').length;
              context.report({
                loc: { line, column: match.index },
                message: `Pro vnitřní odkaz '${href}' použijte <Link> místo <a> pro client-side navigaci`,
                fix: (fixer) => {
                  return fixer.replaceTextRange(
                    [match.index, match.index + match[0].length],
                    match[0].replace('<a', '<Link') + '</Link>'
                  );
                },
              });
            }
          },
        };
      },
    },
  },
  
  configs: {
    recommended: {
      plugins: ['nexify-routes'],
      rules: {
        'nexify-routes/valid-route': 'error',
        'nexify-routes/absolute-path': 'warn',
        'nexify-routes/prefer-next-link': 'warn',
      },
    },
    strict: {
      plugins: ['nexify-routes'],
      rules: {
        'nexify-routes/valid-route': 'error',
        'nexify-routes/absolute-path': 'error',
        'nexify-routes/prefer-next-link': 'error',
      },
    },
  },
};
