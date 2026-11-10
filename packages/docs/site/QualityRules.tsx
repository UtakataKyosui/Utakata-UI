import { Badge, Card } from '@utakata-ui/react';
import RichText from './RichText.js';
import { type Locale, strings } from './strings.js';

export interface QualityRuleItem {
  id: string;
  severity: 'error' | 'warning';
  requirement: string;
  remediation: string;
  applicability?: string;
  residual?: string;
  criteria?: string[];
}

export interface QualityRulesProps {
  locale: Locale;
  rules: QualityRuleItem[];
}

export default function QualityRules({ locale, rules }: QualityRulesProps) {
  const t = strings[locale];
  return (
    <ul className="not-prose utakata-docs-block utakata-docs-rules">
      {rules.map((rule) => (
        <li key={rule.id}>
          <Card.Root>
            <Card.Header className="utakata-docs-rule-header">
              <Card.Title level="4">
                <code>{rule.id}</code>
              </Card.Title>
              <Badge variant={rule.severity === 'error' ? 'solid' : 'outline'}>
                {t.severity[rule.severity]}
              </Badge>
            </Card.Header>
            <Card.Content>
              <p>
                <RichText text={rule.requirement} />
              </p>
              <dl className="utakata-docs-rule-details">
                <dt>{t.remediation}</dt>
                <dd>
                  <RichText text={rule.remediation} />
                </dd>
                {rule.applicability ? (
                  <>
                    <dt>{t.applicability}</dt>
                    <dd>
                      <RichText text={rule.applicability} />
                    </dd>
                  </>
                ) : null}
                {rule.residual ? (
                  <>
                    <dt>{t.residual}</dt>
                    <dd>
                      <RichText text={rule.residual} />
                    </dd>
                  </>
                ) : null}
                {rule.criteria?.length ? (
                  <>
                    <dt>{t.criteria}</dt>
                    <dd>{rule.criteria.join(', ')}</dd>
                  </>
                ) : null}
              </dl>
            </Card.Content>
          </Card.Root>
        </li>
      ))}
    </ul>
  );
}
