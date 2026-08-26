import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { LawyerSearchDto } from '../lawyers/dto/lawyer.dto';

@Controller('lawyers/search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(@Query() dto: LawyerSearchDto) {
    return this.searchService.search(dto);
  }
}
