import { Pagination } from '@utakata-ui/react';

export default function PaginationExample() {
  return (
    <Pagination.Root aria-label="Search result pages">
      <Pagination.List>
        <Pagination.Item>
          <Pagination.Previous disabled />
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link href="#page-1" active>
            1
          </Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link href="#page-2">2</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link href="#page-3">3</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Ellipsis />
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link href="#page-10">10</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Next href="#page-2" />
        </Pagination.Item>
      </Pagination.List>
    </Pagination.Root>
  );
}
