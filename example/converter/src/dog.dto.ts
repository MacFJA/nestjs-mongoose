import { BaseDto } from "@macfja/nestjs-mongoose";
import { ApiProperty } from "@nestjs/swagger";

export class DogDto extends BaseDto<{ years: number; nickname: boolean }> {
	@ApiProperty()
	years: number;
	@ApiProperty()
	nickname: string;
}
