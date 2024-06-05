import {
	type DotKeys,
	type EntityConverter,
	type PartialWithId,
	type SearchField,
	toMongoSort,
} from "@macfja/nestjs-mongoose";
import { ObjectId } from "mongodb";
import type { FilterQuery, HydratedDocument, SortOrder } from "mongoose";
import type { Cat } from "./cat.schema";
import type { DogDto } from "./dog.dto";

function removeUndefined<T extends string>(keys: Array<T | undefined>): Array<T> {
	return keys.filter((key) => key !== undefined) as Array<T>;
}

export class DogConverter implements EntityConverter<Cat, { nickname: string; years: number }> {
	toDto(input: Cat | HydratedDocument<Cat>): DogDto {
		return {
			nickname: input.name,
			years: input.age,
		};
	}
	fromSearchable(input?: SearchField<DogDto>): FilterQuery<Cat> {
		if (input === undefined) return {};
		return {
			name: input?.nickname,
			age: input?.years,
		};
	}
	fromDtoFields(fields?: Array<DotKeys<DogDto>>): Array<DotKeys<Cat>> | undefined {
		if (fields === undefined) return undefined;

		return removeUndefined(
			fields.map((item) => {
				switch (item) {
					case "nickname":
						return "name";
					case "years":
						return "age";
				}
			}),
		);
	}
	fromDtoSort(sort?: Array<string> | undefined): Record<string, SortOrder> | undefined {
		if (sort === undefined) return undefined;

		const catSort = sort?.map((item) => {
			switch (item) {
				case "nickname":
				case "-nickname":
					return item.replace("nick", "");
				case "years":
				case "-years":
					return item.replace("years", "age");
				default:
					return item;
			}
		});
		return toMongoSort(catSort);
	}

	fromCreator(input: Partial<DogDto>): Partial<Cat> {
		return {
			name: input?.nickname,
			age: input?.years,
			breed: "dog",
		};
	}

	fromUpdater(id: string, input: Partial<DogDto>): PartialWithId<Cat> {
		return {
			name: input?.nickname,
			age: input?.years,
			breed: "dog",
			_id: new ObjectId(id),
		};
	}
}
