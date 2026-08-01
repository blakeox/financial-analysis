import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@financial-analysis/ui';
import { renderTheAnswer } from '../scripts/_shared/answer-html';
import { renderAssumptionChips } from '../scripts/_shared/assumption-chip-html';
import {
  bindCompareToggle,
  renderComparePair,
  renderCompareToggle,
} from '../scripts/_shared/compare-html';
import { renderMetricCard } from '../scripts/_shared/metric-card-html';

function toggleTheme(): boolean {
  const root = document.documentElement;
  const dark = !root.classList.contains('dark');
  root.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  return dark;
}

export default function DesignSystemShowcase() {
  const [dark, setDark] = useState(false);
  const compareRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (!compareRootRef.current) return;
    bindCompareToggle(compareRootRef.current, { group: 'compare' });
  }, []);

  const htmlMetricCard = renderMetricCard({
    title: 'Monthly Payment',
    value: '$1,842',
    meta: '30-year fixed',
    tone: 'violet',
  });

  const theAnswerHtml = renderTheAnswer({
    label: 'Monthly payment',
    value: '$1,842.17',
    meaning: 'What you pay each month on a $350,000 loan at 6.5% for 30 years.',
    assumptions: [
      { label: '30y', title: 'Term' },
      { label: '6.5%', title: 'Rate' },
      { label: '$350,000', title: 'Principal' },
    ],
    cta: { label: 'View schedule', href: '#ds-compare' },
    reveal: false,
  });

  const compareToggleHtml = renderCompareToggle([
    { id: 'both', label: 'Both', active: true },
    { id: 'a', label: 'Buy' },
    { id: 'b', label: 'Rent' },
  ]);

  const comparePairHtml = renderComparePair({
    a: {
      eyebrow: 'Scenario A',
      title: 'Buy',
      metricHtml: '<p class="fa-answer-value fa-tabular-nums !text-2xl">$84,200</p>',
      bodyHtml: '<p class="fa-meta-copy !mt-2">Net position after 10 years</p>',
    },
    b: {
      eyebrow: 'Scenario B',
      title: 'Rent',
      metricHtml: '<p class="fa-answer-value fa-tabular-nums !text-2xl">$61,400</p>',
      bodyHtml: '<p class="fa-meta-copy !mt-2">Invested down payment + rent path</p>',
    },
    group: 'compare',
  });

  return (
    <div className="space-y-12">
      <section className="fa-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="fa-display-section !mt-0 mb-1 text-2xl font-semibold">Theme preview</h2>
            <p className="fa-meta-copy !mt-0">
              Toggle dark mode to verify token contrast on both tiers.
            </p>
          </div>
          <button
            type="button"
            className="fa-button-secondary"
            aria-pressed={dark}
            onClick={() => setDark(toggleTheme())}
          >
            {dark ? 'Switch to light' : 'Switch to dark'}
          </button>
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Typography</h2>
        <div className="fa-card space-y-4">
          <p className="fa-display fa-display-hero !mt-0">Display hero</p>
          <p className="fa-display fa-display-section !mt-0">Display section</p>
          <p className="fa-body-lg !mt-0">Body large — intro paragraphs and hero subcopy.</p>
          <p className="fa-body-copy !mt-0">Body copy — standard page prose.</p>
          <p className="fa-meta-copy !mt-0">Meta copy — labels, footnotes, secondary detail.</p>
          <p className="fa-panel-title !mt-0">Panel title — card and section headings.</p>
          <p className="fa-meta-copy !mt-4 mb-1">Tabular lining figures (.fa-tabular-nums)</p>
          <p className="fa-tabular-nums text-2xl font-semibold tracking-tight">
            $1,842.17 &nbsp; $12,450.00 &nbsp; 6.50%
          </p>
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Chips (fa-*)</h2>
        <p className="fa-meta-copy mb-4">
          App spine status tags — use React <code className="text-sm">Badge</code> in islands when
          possible.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="fa-chip fa-chip-accent">Accent</span>
          <span className="fa-chip fa-chip-success">Success</span>
          <span className="fa-chip fa-chip-warning">Warning</span>
          <span className="fa-chip fa-chip-danger">Danger</span>
          <span className="fa-chip fa-chip-muted">Muted</span>
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Form fields</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="fa-card">
            <h3 className="fa-card-title">App spine (fa-input-surface)</h3>
            <label className="fa-field-label mt-4" htmlFor="ds-spine-input">
              Loan amount
            </label>
            <input
              id="ds-spine-input"
              type="text"
              className="fa-input-surface fa-tabular-nums mt-1 w-full"
              placeholder="350,000"
            />
            <p className="fa-help-copy mt-2">Helper text via fa-help-copy.</p>
            <label className="fa-field-label mt-4" htmlFor="ds-spine-error">
              With error
            </label>
            <input
              id="ds-spine-error"
              type="text"
              className="fa-input-surface fa-field-error mt-1 w-full"
              aria-invalid="true"
              defaultValue="invalid"
            />
            <p className="fa-callout-copy-danger mt-2 text-sm" role="alert">
              Required field — use fa-field-error + aria-invalid.
            </p>
          </div>
          <div className="fa-card">
            <h3 className="fa-card-title">React Input</h3>
            <Input label="Annual income" placeholder="120,000" className="mt-4" />
            <Input
              label="With validation error"
              error="Enter a positive number"
              defaultValue="-1"
              className="mt-4"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">React buttons</h2>
        <div className="fa-actions !mt-0">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Success</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Callouts</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Callout variant="info" title="Info">
            Deterministic engines with audited formulas.
          </Callout>
          <Callout variant="success" title="Success">
            Analysis saved to the workflow rail.
          </Callout>
          <Callout variant="warning" title="Warning">
            Rates are illustrative — verify with your lender.
          </Callout>
          <Callout variant="error" title="Error">
            Required fields are missing.
          </Callout>
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Cards</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle as="h3">Default card</CardTitle>
            </CardHeader>
            <CardContent>Shared React card from @financial-analysis/ui.</CardContent>
          </Card>
          <div className="fa-card">
            <h3 className="fa-card-title">Astro fa-card</h3>
            <p className="fa-card-copy">App spine card class for static pages.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">The Answer</h2>
        <p className="fa-meta-copy mb-4">
          Signature result pattern: one hero tabular number, one meaning sentence, assumption chips,
          one next step. Answer budget — no competing KPI wall above the fold.
        </p>
        <div dangerouslySetInnerHTML={{ __html: theAnswerHtml }} />
        <p className="fa-meta-copy mt-6 mb-2">Standalone assumption chips</p>
        <div
          dangerouslySetInnerHTML={{
            __html: renderAssumptionChips([
              { label: 'taxes on' },
              { label: 'PMI off' },
              { label: 'extra $200/mo' },
            ]),
          }}
        />
      </section>

      <section id="ds-compare">
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Compare A/B</h2>
        <p className="fa-meta-copy mb-4">
          Lightweight dual-column compare with segmented toggle (catalog stub).
        </p>
        <div ref={compareRootRef}>
          <div dangerouslySetInnerHTML={{ __html: compareToggleHtml }} />
          <div className="mt-4" dangerouslySetInnerHTML={{ __html: comparePairHtml }} />
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Metric cards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div dangerouslySetInnerHTML={{ __html: htmlMetricCard }} />
          <div className="fa-metric-card fa-metric-card-emerald">
            <h5 className="fa-metric-card-title">Total Interest</h5>
            <p className="fa-metric-card-value">$245,120</p>
            <p className="fa-metric-card-meta">Over loan term</p>
          </div>
          <div className="fa-metric-card fa-metric-card-primary">
            <h5 className="fa-metric-card-title">Hero metric</h5>
            <p className="fa-metric-card-value-lg">$1,842</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Chart palette</h2>
        <p className="fa-meta-copy mb-4">
          Series colors from <code className="text-sm">--fa-chart-*</code> /{' '}
          <code className="text-sm">chartColors</code> in @financial-analysis/ui — not Tailwind
          blue/violet. Charts need role+label, axes, and non-color cues (AmortizationChart bar).
        </p>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <span
                className="inline-block h-8 w-8 rounded-md border border-[var(--fa-border-subtle)]"
                style={{ background: `var(--fa-chart-${n})` }}
                aria-hidden="true"
              />
              <span className="fa-meta-copy !mt-0">chart-{n}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Signature motion</h2>
        <p className="fa-meta-copy mb-4">
          Exactly three motions: ink-dry answer reveal, field highlight, journey progress width.
          Reduced-motion disables decorative animation.
        </p>
        <div className="fa-progress-panel max-w-md p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="fa-scenario-title text-sm">Journey progress</h3>
            <span className="fa-list-copy text-sm">40% complete</span>
          </div>
          <div className="fa-progress-track mt-3">
            <div className="fa-progress-bar" style={{ width: '40%' }} />
          </div>
        </div>
        <label className="fa-field-label mt-6 block" htmlFor="ds-highlight-demo">
          Field highlight demo
        </label>
        <input
          id="ds-highlight-demo"
          className="fa-input-surface mt-1 w-full max-w-md"
          defaultValue="Focus me via chip"
        />
        <button
          type="button"
          className="fa-assumption-chip mt-3"
          onClick={() => {
            const el = document.getElementById('ds-highlight-demo');
            if (!el) return;
            el.classList.remove('field-highlight');
            void el.offsetWidth;
            el.classList.add('field-highlight');
            el.focus();
            window.setTimeout(() => el.classList.remove('field-highlight'), 2200);
          }}
        >
          Trigger highlight
        </button>
      </section>

      <section>
        <h2 className="fa-display-section mb-4 text-2xl font-semibold">Rail card</h2>
        <div className="fa-rail-card max-w-md">
          <div className="fa-rail-card-header">
            <h3 className="fa-rail-card-title">Workflow rail section</h3>
            <p className="fa-rail-card-copy">Structured sidebar content in calculator pages.</p>
          </div>
          <div className="fa-rail-card-body">
            <p className="fa-meta-copy !mt-0">
              Body slot for tips, chat context, or impact summary.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
