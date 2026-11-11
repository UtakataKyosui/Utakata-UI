import { Carousel } from '@utakata-ui/react';

export default function CarouselExample() {
  return (
    <Carousel
      slides={[
        { id: 'shore', content: <p>Life on the shore</p> },
        { id: 'forest', content: <p>Trees of the forest</p> },
        { id: 'cliffs', content: <p>How cliffs form</p> },
      ]}
      labels={{
        name: 'Featured exhibits',
        roleDescription: 'carousel',
        viewport: 'Exhibit slides',
        previous: 'Previous exhibit',
        next: 'Next exhibit',
        position: (position, total) => `Exhibit ${position} of ${total}`,
      }}
    />
  );
}
