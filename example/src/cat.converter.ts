import {
	type EntityConverter,
	type PartialWithId,
	type SearchField,
	toMongoFilterQuery,
	toMongoSort,
} from "@macfja/nestjs-mongoose";
import { type FilterQuery, type HydratedDocument, type SortOrder, Types } from "mongoose";
import { CatDto, type CatDtoType, type CatSearchableDto } from "./cat.dto";
import type { Cat } from "./cat.schema";

export class CatConverter implements EntityConverter<Cat, CatSearchableDto, CatDto> {
	fromDtoFields(fields?: Array<keyof CatDtoType>): Array<keyof Cat> {
		return fields
			?.filter((field) => ["name", "age", "breed"].includes(field))
			.map((field) => {
				switch (field) {
					case "name":
						return "name";
					case "age":
						return "age";
					case "breed":
						return "breed";
				}
				return false;
			})
			.filter(Boolean) as Array<keyof Cat>;
	}
	fromDtoSort(sort?: Array<string>): Record<string, SortOrder> {
		return toMongoSort(sort ?? []);
	}
	toDto(input: HydratedDocument<Cat>): CatDto {
		return new CatDto(input.name, input.breed, input.age);
	}

	fromSearchable(input?: SearchField<CatSearchableDto>): FilterQuery<Cat> {
		return toMongoFilterQuery(input);
	}

	fromCreator(input: Partial<CatDtoType>): Partial<Cat> {
		return {
			...input,
		};
	}

	fromUpdater(id: string, input: Partial<CatDtoType>): PartialWithId<Cat> {
		return {
			...input,
			_id: new Types.ObjectId(id),
		};
	}
}
