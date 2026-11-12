import { Carousel } from '@utakata-ui/react';

export default function CarouselExample() {
  return (
    <Carousel
      slides={[
        { id: 'shore', content: <p>海岸にすむ生き物</p> },
        { id: 'forest', content: <p>森の樹木</p> },
        { id: 'cliffs', content: <p>崖の成り立ち</p> },
      ]}
      labels={{
        name: '注目の展示',
        roleDescription: 'カルーセル',
        viewport: '展示スライド',
        previous: '前の展示',
        next: '次の展示',
        position: (position, total) => `全${total}件のうち${position}件目`,
      }}
    />
  );
}
