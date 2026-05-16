import { Controller, Get } from '@nestjs/common';

import { TaxonomyService } from '../services/taxonomy.service.js';

/**
 * Public, anonymous-accessible taxonomy read endpoint. Returns the
 * full corporate-gifting category tree + occasion + branding-area +
 * recipient-type enums so the web-customer / web-vendor UIs render
 * the option lists from a single source of truth.
 */
@Controller('product-taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Get()
  get(): ReturnType<TaxonomyService['getTaxonomy']> {
    return this.taxonomy.getTaxonomy();
  }
}
