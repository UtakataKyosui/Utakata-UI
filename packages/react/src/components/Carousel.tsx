'use client';

import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { Button } from './Button.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

export interface CarouselSlide {
  /** A stable, unique identifier within the carousel. */
  id: string;
  content: ReactNode;
}

export interface CarouselLabels {
  /** Short name that identifies the content, for example "Featured recipes". */
  name: string;
  /** Localized role description, for example "carousel". */
  roleDescription: string;
  viewport: string;
  previous: string;
  next: string;
  /** Formats the visible and announced position; position starts at 1. */
  position: (position: number, total: number) => string;
}

type InternalAttribute =
  | 'aria-hidden'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-roledescription'
  | 'children'
  | 'role';

export type CarouselProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'section'>, InternalAttribute> & {
    [Attribute in InternalAttribute]?: never;
  } & {
    slides: readonly CarouselSlide[];
    labels: CarouselLabels;
    autoplay?: never;
  }
>;

const regionName = {
  name: 'Carousel',
  fix: 'Set labels.name to a nonempty description of the slides.',
};

const viewportName = {
  name: 'Carousel viewport',
  fix: 'Set labels.viewport to a nonempty name for the slide viewport.',
};

function horizontalCenter(element: Element) {
  const { left, width } = element.getBoundingClientRect();
  return left + width / 2;
}

function scrollToSlide(viewport: HTMLDivElement, index: number) {
  const slide = viewport.children[index];
  if (!slide) return;
  viewport.scrollBy({
    left: horizontalCenter(slide) - horizontalCenter(viewport),
    behavior: 'instant',
  });
}

export const Carousel = withLism(
  forwardRef<HTMLElement, CarouselProps>(function Carousel(
    { className, labels, slides, ...props },
    ref,
  ) {
    const viewportId = useId();
    const viewportRef = useRef<HTMLDivElement>(null);
    const regionAccessibilityRef = useAccessibilityRef(regionName, ref);
    const viewportAccessibilityRef = useAccessibilityRef(
      viewportName,
      viewportRef,
    );
    const [activeId, setActiveId] = useState<string | undefined>(
      () => slides[0]?.id,
    );
    const activeIndex = slides.findIndex((slide) => slide.id === activeId);
    const index = Math.max(activeIndex, 0);

    const selectSlide = useCallback(
      (viewport: HTMLDivElement, nextIndex: number) => {
        const slide = slides[nextIndex];
        if (!slide || slide.id === activeId) return;
        if (
          viewport.children[index]?.contains(
            viewport.ownerDocument.activeElement,
          )
        ) {
          // A swipe can hide a slide that still owns focus.
          viewport.focus({ preventScroll: true });
        }
        setActiveId(slide.id);
      },
      [activeId, index, slides],
    );

    const move = useCallback(
      (viewport: HTMLDivElement | null, nextIndex: number) => {
        if (!viewport) return;
        scrollToSlide(viewport, nextIndex);
        selectSlide(viewport, nextIndex);
      },
      [selectSlide],
    );

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) {
        setActiveId(undefined);
        return;
      }

      if (activeIndex === -1) move(viewport, 0);

      const onKeyDown = (event: KeyboardEvent) => {
        // Interactive slide content owns its keys.
        if (
          event.target !== viewport ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        ) {
          return;
        }
        const rtl = getComputedStyle(viewport).direction === 'rtl';
        switch (event.key) {
          case 'ArrowRight':
            move(viewport, index + (rtl ? -1 : 1));
            break;
          case 'ArrowLeft':
            move(viewport, index + (rtl ? 1 : -1));
            break;
          case 'Home':
            move(viewport, 0);
            break;
          case 'End':
            move(viewport, slides.length - 1);
            break;
          default:
            return;
        }
        event.preventDefault();
      };

      const synchronizePosition = () => {
        const center = horizontalCenter(viewport);
        let nearest = 0;
        let distance = Number.POSITIVE_INFINITY;
        Array.from(viewport.children).forEach((slide, candidate) => {
          const offset = Math.abs(horizontalCenter(slide) - center);
          if (offset < distance) {
            distance = offset;
            nearest = candidate;
          }
        });
        selectSlide(viewport, nearest);
      };

      // Native scrollend waits for the swipe and scroll-snap settling to finish.
      // Older engines use a trailing scroll listener.
      let timer: ReturnType<typeof setTimeout>;
      const afterScroll = () => {
        clearTimeout(timer);
        timer = setTimeout(synchronizePosition, 150);
      };
      const nativeScrollEnd = 'onscrollend' in viewport;
      const eventName = nativeScrollEnd ? 'scrollend' : 'scroll';
      const listener = nativeScrollEnd ? synchronizePosition : afterScroll;
      viewport.addEventListener(eventName, listener);
      viewport.addEventListener('keydown', onKeyDown);
      return () => {
        clearTimeout(timer);
        viewport.removeEventListener(eventName, listener);
        viewport.removeEventListener('keydown', onKeyDown);
      };
    }, [activeIndex, index, move, selectSlide, slides.length]);

    if (slides.length === 0) return null;

    return (
      <section
        {...props}
        ref={regionAccessibilityRef}
        className={withClassName('ui-carousel', className)}
        aria-label={labels.name}
        aria-roledescription={labels.roleDescription}
      >
        <div className="ui-carousel__controls">
          <Button
            type="button"
            variant="outline"
            disabled={index === 0}
            focusableWhenDisabled
            aria-controls={viewportId}
            onClick={() => move(viewportRef.current, index - 1)}
          >
            {labels.previous}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={index === slides.length - 1}
            focusableWhenDisabled
            aria-controls={viewportId}
            onClick={() => move(viewportRef.current, index + 1)}
          >
            {labels.next}
          </Button>
          <span role="status">{labels.position(index + 1, slides.length)}</span>
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: Slide content need not contain form controls. */}
        <div
          className="ui-carousel__viewport"
          id={viewportId}
          ref={viewportAccessibilityRef}
          role="group"
          aria-label={labels.viewport}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: The scroll viewport owns the arrow and boundary shortcuts.
          tabIndex={0}
        >
          {slides.map((slide, position) => {
            const inactive = position !== index;
            return (
              <div
                key={slide.id}
                className="ui-carousel__slide"
                aria-hidden={inactive || undefined}
                ref={(element) => {
                  // The DOM attribute works with React 18 and React 19.
                  element?.toggleAttribute('inert', inactive);
                }}
              >
                {slide.content}
              </div>
            );
          })}
        </div>
      </section>
    );
  }),
);
