import {
  Carousel,
  type CarouselLabels,
  type CarouselSlide,
} from '../../packages/react/src/index.js';

const labels: CarouselLabels = {
  name: 'Featured exhibits',
  roleDescription: 'carousel',
  viewport: 'Exhibit slides',
  previous: 'Previous exhibit',
  next: 'Next exhibit',
  position: (position, total) => `Exhibit ${position} of ${total}`,
};
const slides: CarouselSlide[] = [
  {
    id: 'shore',
    content: <p>Life on the shore</p>,
  },
  {
    id: 'forest',
    content: (
      <label>
        Forest notes
        <input defaultValue="oak" />
      </label>
    ),
  },
  {
    id: 'cliffs',
    content: <p>Cliff formations</p>,
  },
];

export function CarouselFixture() {
  return (
    <div className="fixture-carousel">
      <Carousel slides={slides} labels={labels} />
    </div>
  );
}
