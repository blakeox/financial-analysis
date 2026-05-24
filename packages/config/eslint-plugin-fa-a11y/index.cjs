/**
 * @fileoverview Fanalyx accessibility ESLint rules (contrast-focused).
 */

const MUTED_HINT =
  'Use textColors.muted or copyClasses.helper/caption from @financial-analysis/ui.';

/** @type {import('eslint').Rule.RuleModule} */
const preferAccessibleMutedText = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Discourage low-contrast Tailwind text utilities; prefer shared accessible tokens',
    },
    messages: {
      lightSlate400:
        'Avoid `text-slate-400` on light surfaces (fails WCAG AA). {{hint}}',
      lightSlate500:
        'Prefer `text-slate-600 dark:text-slate-400` (or textColors.muted) over `text-slate-500` for secondary copy.',
      lightGray400: 'Avoid `text-gray-400` on light surfaces. {{hint}}',
    },
    schema: [],
  },
  create(context) {
    function inspectClassString(node, raw) {
      if (typeof raw !== 'string') return;
      if (raw.includes('textColors.') || raw.includes('copyClasses.')) return;

      const withoutDarkUtilities = raw.replace(/dark:[\w-]*:?text-slate-400/g, '');

      if (/\btext-slate-400\b/.test(withoutDarkUtilities)) {
        context.report({
          node,
          messageId: 'lightSlate400',
          data: { hint: MUTED_HINT },
        });
      }

      if (/\btext-gray-400\b/.test(withoutDarkUtilities)) {
        context.report({
          node,
          messageId: 'lightGray400',
          data: { hint: MUTED_HINT },
        });
      }

      if (raw.includes('placeholder:text-slate-500')) return;
      if (/\/lib\/classNames/.test(context.filename ?? '')) return;
      if (/\/ui-constants/.test(context.filename ?? '')) return;

      if (/\btext-slate-500\b/.test(raw) && !/\btext-slate-600\b/.test(raw)) {
        if (/\bdark:text-slate-[34]00\b/.test(raw)) return;
        context.report({
          node,
          messageId: 'lightSlate500',
        });
      }
    }

    function inspectNode(node, value) {
      if (value === null || value === undefined) return;
      if (typeof value === 'string') {
        inspectClassString(node, value);
        return;
      }
      if (Array.isArray(value)) {
        for (const part of value) inspectNode(node, part);
      }
    }

    function getLiteralValue(node) {
      if (!node) return null;
      if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
      if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
        return node.quasis.map((q) => q.value.cooked ?? '').join('');
      }
      return null;
    }

    return {
      JSXAttribute(node) {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : null;
        if (name !== 'className' && name !== 'class') return;

        const value = node.value;
        if (!value) return;

        if (value.type === 'Literal') {
          inspectClassString(value, value.value);
          return;
        }

        if (value.type === 'JSXExpressionContainer') {
          const expr = value.expression;
          if (expr.type === 'Literal') {
            inspectClassString(expr, expr.value);
          } else if (expr.type === 'TemplateLiteral' && expr.expressions.length === 0) {
            inspectClassString(expr, getLiteralValue(expr));
          } else if (expr.type === 'CallExpression' && expr.callee.type === 'Identifier') {
            const calleeName = expr.callee.name;
            if (calleeName === 'cn' || calleeName === 'clsx' || calleeName === 'classNames') {
              for (const arg of expr.arguments) {
                const literal = getLiteralValue(arg);
                if (literal) inspectClassString(arg, literal);
              }
            }
          }
        }
      },
      Literal(node) {
        if (typeof node.value !== 'string') return;
        if (!/\btext-slate-(400|500)\b/.test(node.value) && !/\btext-gray-400\b/.test(node.value)) {
          return;
        }
        if (node.parent?.type === 'JSXAttribute') return;
        inspectClassString(node, node.value);
      },
    };
  },
};

module.exports = {
  rules: {
    'prefer-accessible-muted-text': preferAccessibleMutedText,
  },
};
