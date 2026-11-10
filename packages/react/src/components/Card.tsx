import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
  type ReactNode,
} from 'react';
import type { CardTitleLevel } from '../metadata/components/Card.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

type CardPartProps<T extends ElementType> = Omit<
  ComponentPropsWithoutRef<T>,
  'className'
> & {
  className?: string;
};

export type CardRootProps = WithLismProps<CardPartProps<'div'>>;
export type CardHeaderProps = WithLismProps<CardPartProps<'div'>>;
export type CardTitleProps = WithLismProps<
  Omit<CardPartProps<'h3'>, 'children'> & {
    /** Heading level, matching Lism Heading. Choose it from the page outline. */
    level?: CardTitleLevel;
    children: ReactNode;
  }
>;
export type CardDescriptionProps = WithLismProps<CardPartProps<'p'>>;
export type CardContentProps = WithLismProps<CardPartProps<'div'>>;
export type CardFooterProps = WithLismProps<CardPartProps<'div'>>;

const Root = withLism(
  forwardRef<HTMLDivElement, CardRootProps>(function CardRoot(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-card', className)}
      />
    );
  }),
);

const Header = withLism(
  forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-card__header', className)}
      />
    );
  }),
);

const Title = withLism(
  forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
    { className, level = '3', ...props },
    ref,
  ) {
    const Heading = `h${level}` as const;
    return (
      <Heading
        {...props}
        ref={ref}
        className={withClassName('ui-card__title', className)}
      />
    );
  }),
);

const Description = withLism(
  forwardRef<HTMLParagraphElement, CardDescriptionProps>(
    function CardDescription({ className, ...props }, ref) {
      return (
        <p
          {...props}
          ref={ref}
          className={withClassName('ui-card__description', className)}
        />
      );
    },
  ),
);

const Content = withLism(
  forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-card__content', className)}
      />
    );
  }),
);

const Footer = withLism(
  forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-card__footer', className)}
      />
    );
  }),
);

/** Static content grouping. Actions belong to Button or link elements inside. */
export const Card = { Root, Header, Title, Description, Content, Footer };
