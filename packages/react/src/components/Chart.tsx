import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type ReactNode,
  type SVGProps,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import type { ChartSeries } from '../metadata/components/Chart.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

type ChartPartProps<Tag extends 'figcaption' | 'p' | 'ul'> = WithLismProps<
  Omit<ComponentPropsWithoutRef<Tag>, 'className'> & { className?: string }
>;

export type ChartRootProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'figure'>, 'className' | 'role'> & {
    className?: string;
    // Optional `never` members also reject the name when props arrive through a spread.
    role?: never;
  }
>;
export type ChartCaptionProps = ChartPartProps<'figcaption'>;
export type ChartDescriptionProps = ChartPartProps<'p'>;
export type ChartLegendProps = ChartPartProps<'ul'>;

export type ChartPlotProps = WithLismProps<
  Omit<
    ComponentPropsWithoutRef<'div'>,
    'className' | 'role' | 'tabIndex' | 'aria-label' | 'aria-labelledby'
  > & {
    className?: string;
    role?: never;
    tabIndex?: never;
  } & (
      | { 'aria-label': string; 'aria-labelledby'?: never }
      | { 'aria-label'?: never; 'aria-labelledby': string }
    )
>;

export type ChartMarkerProps = Omit<
  SVGProps<SVGSVGElement>,
  | 'className'
  | 'children'
  | 'viewBox'
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-hidden'
  | 'focusable'
  | 'tabIndex'
> & {
  /** Series number. It selects both the color token and a distinct shape. */
  series: ChartSeries;
  className?: string;
};

export type ChartLegendItemProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'li'>, 'className' | 'children'> & {
    className?: string;
    /** Series number shared with the plot; the marker shape identifies it without color. */
    series: ChartSeries;
    /** Visible series name. It is the item's only text alternative. */
    children: ReactNode;
  }
>;

export type ChartDataProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'details'>, 'className' | 'children'> & {
    className?: string;
    /** Visible text of the disclosure that reveals the data table. */
    summary: ReactNode;
    children: ReactNode;
  }
>;

type Register = (id: string | undefined) => void;
const RegistryContext = createContext<{
  caption: Register;
  description: Register;
}>({ caption: () => {}, description: () => {} });

/** Links a part's id to the figure for the life of the part. */
function useRegisteredId(kind: 'caption' | 'description', id?: string) {
  const generated = useId();
  const resolved = id ?? generated;
  const register = useContext(RegistryContext)[kind];
  useEffect(() => {
    register(resolved);
    return () => register(undefined);
  }, [register, resolved]);
  return resolved;
}

const Root = withLism(
  forwardRef<HTMLElement, ChartRootProps>(function ChartRoot(
    { className, ...props },
    ref,
  ) {
    const [captionId, setCaptionId] = useState<string | undefined>();
    const [descriptionId, setDescriptionId] = useState<string | undefined>();
    const registry = useMemo(
      () => ({ caption: setCaptionId, description: setDescriptionId }),
      [],
    );
    return (
      <RegistryContext.Provider value={registry}>
        <figure
          aria-labelledby={captionId}
          aria-describedby={descriptionId}
          {...props}
          ref={ref}
          className={withClassName('ui-chart', className)}
        />
      </RegistryContext.Provider>
    );
  }),
);

/** The visible chart title; Root references it as the figure's name. */
const Caption = withLism(
  forwardRef<HTMLElement, ChartCaptionProps>(function ChartCaption(
    { className, id, ...props },
    ref,
  ) {
    const captionId = useRegisteredId('caption', id);
    return (
      <figcaption
        {...props}
        id={captionId}
        ref={ref}
        className={withClassName('ui-chart__caption', className)}
      />
    );
  }),
);

/** A text summary of what the chart shows; Root references it as its description. */
const Description = withLism(
  forwardRef<HTMLParagraphElement, ChartDescriptionProps>(
    function ChartDescription({ className, id, ...props }, ref) {
      const descriptionId = useRegisteredId('description', id);
      return (
        <p
          {...props}
          id={descriptionId}
          ref={ref}
          className={withClassName('ui-chart__description', className)}
        />
      );
    },
  ),
);

/**
 * Holds any renderer. It is exposed as one named image, so everything inside
 * is presentational: keep interactive controls and essential values outside.
 */
const Plot = withLism(
  forwardRef<HTMLDivElement, ChartPlotProps>(function ChartPlot(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        role="img"
        className={withClassName('ui-chart__plot', className)}
      />
    );
  }),
);

const shapes: Record<ChartSeries, ReactNode> = {
  '1': <circle cx="6" cy="6" r="5" />,
  '2': <rect x="1" y="1" width="10" height="10" />,
  '3': <polygon points="6,0.5 11.5,11 0.5,11" />,
  '4': <polygon points="6,0.5 11.5,6 6,11.5 0.5,6" />,
  '5': <path d="M4 0.5h4v3.5h3.5v4H8v3.5H4V8H0.5V4H4z" />,
  '6': <circle cx="6" cy="6" r="4" fill="none" strokeWidth="2" />,
};

/** A decorative series marker; the series name is always visible text. */
const Marker = forwardRef<SVGSVGElement, ChartMarkerProps>(function ChartMarker(
  { className, series, ...props },
  ref,
) {
  return (
    <svg
      width="12"
      height="12"
      {...props}
      ref={ref}
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={withClassName(
        `ui-chart__marker ui-chart__marker--${series}`,
        className,
      )}
    >
      {shapes[series]}
    </svg>
  );
});

const Legend = withLism(
  forwardRef<HTMLUListElement, ChartLegendProps>(function ChartLegend(
    { className, children, ...props },
    ref,
  ) {
    return (
      <ul
        {...props}
        ref={ref}
        className={withClassName('ui-chart__legend', className)}
      >
        {children}
      </ul>
    );
  }),
);

const LegendItem = withLism(
  forwardRef<HTMLLIElement, ChartLegendItemProps>(function ChartLegendItem(
    { className, series, children, ...props },
    ref,
  ) {
    return (
      <li
        {...props}
        ref={ref}
        className={withClassName('ui-chart__legend-item', className)}
      >
        <Marker series={series} />
        <span>{children}</span>
      </li>
    );
  }),
);

/**
 * A native disclosure for the data table alternative. The summary is a
 * keyboard-operable control; put a `Table.Container` inside.
 */
const Data = withLism(
  forwardRef<HTMLDetailsElement, ChartDataProps>(function ChartData(
    { className, summary, children, ...props },
    ref,
  ) {
    return (
      <details
        {...props}
        ref={ref}
        className={withClassName('ui-chart__data', className)}
      >
        <summary className="ui-chart__data-summary">{summary}</summary>
        <div className="ui-chart__data-content">{children}</div>
      </details>
    );
  }),
);

/**
 * A dependency-free accessible shell for charts. It supplies the figure,
 * caption, description, series legend and data-table alternative; the
 * renderer inside `Chart.Plot` is the consumer's choice.
 */
export const Chart = {
  Root,
  Caption,
  Description,
  Plot,
  Legend,
  LegendItem,
  Marker,
  Data,
};
