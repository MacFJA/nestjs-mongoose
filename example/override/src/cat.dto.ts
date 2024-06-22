import { BaseDto } from "@macfja/nestjs-mongoose";
import { ApiProperty } from "@nestjs/swagger";
import type { Cat } from "./cat.schema";

export class CatDto extends BaseDto<Record<keyof Cat, string | number>> {
	@ApiProperty()
	name: string;

	@ApiProperty()
	age: number;

	@ApiProperty()
	breed: string;
}
