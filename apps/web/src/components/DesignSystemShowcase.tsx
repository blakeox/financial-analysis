import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@financial-analysis/ui';
import { renderMetricCard } from '../scripts/_shared/metric-card-html';

export default function DesignSystemShowcase() {
  const htmlMetricCard = renderMetricCard({
    title: 'Monthly Payment',
    value: '$1,842',
    meta: '30-year fixed',
    tone: 'violet',
  });

  return (
    <div className="space-y-12">
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
    </div>
  );
}
