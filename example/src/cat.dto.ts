import { BaseDto } from "@macfja/nestjs-mongoose";
import { ApiProperty } from "@nestjs/swagger";

export class CatDto extends BaseDto implements CatDtoType {
	constructor(name: string, breed: string, age: number) {
		super();
		this.name = name;
		this.breed = breed;
		this.age = age;
	}

	@ApiProperty()
	name: string;
	@ApiProperty()
	breed: string;
	@ApiProperty()
	age: number;
}
export type CatDtoType = {
	name: string;
	breed: string;
	age: number;
};

export type CatSearchableDto = {
	name?: string;
	breed?: string;
};
