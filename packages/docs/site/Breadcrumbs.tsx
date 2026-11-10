import { Breadcrumb } from '@utakata-ui/react';
import { Fragment } from 'react';

interface Crumb {
  label: string;
  route?: string;
}

export interface BreadcrumbsProps {
  crumbs: Crumb[];
  strings?: { breadcrumb?: string };
  wide?: boolean;
  centered?: boolean;
}

/** Blume's Breadcrumbs layout slot, rendered with Utakata Breadcrumb. */
export default function Breadcrumbs({
  crumbs,
  strings,
  wide = false,
  centered = false,
}: BreadcrumbsProps) {
  if (crumbs.length < 2) return null;
  const width = wide
    ? 'max-w-none'
    : `mx-auto ${centered ? 'max-w-[54rem]' : 'max-w-content'}`;
  const last = crumbs.length - 1;
  return (
    <div className={`mb-3 ${width}`}>
      <Breadcrumb.Root aria-label={strings?.breadcrumb ?? 'Breadcrumb'}>
        <Breadcrumb.List>
          {crumbs.map((crumb, index) => (
            <Fragment key={`${crumb.label}-${crumb.route ?? index}`}>
              {index > 0 ? <Breadcrumb.Separator /> : null}
              <Breadcrumb.Item>
                {index === last ? (
                  <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
                ) : crumb.route ? (
                  <Breadcrumb.Link href={crumb.route}>
                    {crumb.label}
                  </Breadcrumb.Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </Breadcrumb.Item>
            </Fragment>
          ))}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </div>
  );
}
