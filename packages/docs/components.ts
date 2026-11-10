import { defineComponents } from 'blume';
import BadgeList from './site/static/BadgeList.astro';
import Breadcrumbs from './site/static/Breadcrumbs.astro';
import ComponentGrid from './site/static/ComponentGrid.astro';
import Note from './site/static/Note.astro';
import Pagination from './site/static/Pagination.astro';
import PartTable from './site/static/PartTable.astro';
import PropTable from './site/static/PropTable.astro';
import QualityRules from './site/static/QualityRules.astro';

// Utakata-UI components rendered to static HTML through Astro wrappers, so
// no client JavaScript ships and Blume does not expect a hydration mode.
export default defineComponents({
  mdx: {
    BadgeList,
    ComponentGrid,
    Note,
    PartTable,
    PropTable,
    QualityRules,
  },
  layout: {
    Breadcrumbs,
    Pagination,
  },
});
