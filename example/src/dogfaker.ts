import {
	type EntityConverter,
	type JsonObject,
	type PartialWithId,
	type SearchField,
	toMongoSort,
} from "@macfja/nestjs-mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { type FilterQuery, type HydratedDocument, type SortOrder, Types } from "mongoose";
import type { Cat } from "./cat.schema";

export class DogDto implements DogDtoType {
	@ApiProperty()
	nickname: string;
	@ApiProperty()
	breedName: string;
	@ApiProperty()
	years: number;
	[a: string]: string | number;
	constructor(name: string, breed: string, age: number) {
		this.nickname = name;
		this.breedName = breed;
		this.years = age;
	}
}
export type DogDtoType = JsonObject & {
	nickname: string;
	breedName: string;
	years: number;
};

export type DogSearchableDto = {
	callee?: string;
	type?: string;
};

export class DogFakerConverter implements EntityConverter<Cat, DogSearchableDto, DogDtoType, DogDtoType, DogDtoType> {
	fromDtoFields(fields?: Array<keyof DogDtoType>): Array<keyof Cat> {
		return fields?.map((field) => {
			switch (field) {
				case "nickname":
					return "name";
				case "years":
					return "age";
				case "breedName":
					return "breed";
			}
		});
	}
	fromDtoSort(sort?): Record<string, SortOrder> {
		return toMongoSort(
			(sort ?? []).map((item) =>
				item.replace("nickname", "name").replace("breedName", "breed").replace("years", "age"),
			),
		);
	}
	toDto(input: HydratedDocument<Cat>): DogDto {
		return new DogDto(input.name, input.breed, input.age);
	}

	fromSearchable(input?: SearchField<DogSearchableDto>): FilterQuery<Cat> {
		const filter: FilterQuery<Cat> = {};
		if (input?.callee) {
			filter.name = input.callee;
		}
		if (input?.type) {
			filter.breed = input.type;
		}
		return filter;
	}

	fromCreator(input: Partial<DogDto>): Partial<Cat> {
		return {
			age: input.years,
			breed: input.breedName,
			name: input.nickname,
		};
	}

	fromUpdater(id: string, input: Partial<DogDto>): PartialWithId<Cat> {
		return {
			name: input.nickname,
			breed: input.breedName,
			age: input.years,
			_id: new Types.ObjectId(id),
		};
	}
}
