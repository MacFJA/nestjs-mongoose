import {
	GetOneDecorator,
	Hal,
	JsonApi,
	type JsonOf,
	MongooseControllerFactory,
	OneToOneConverter,
} from "@macfja/nestjs-mongoose";
import { Controller } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import type e from "express";
import { CatDto } from "./cat.dto";
import { Cat } from "./cat.schema";

@Controller({ path: "/cat" })
export class CatController extends MongooseControllerFactory(
	Cat.name,
	new OneToOneConverter(),
	CatDto,
	undefined,
	undefined,
	{
		disable: {
			write: true,
			list: true,
		},
	},
) {
	@ApiOperation({ description: "The list of field visible is fixed to `age` and `name`" })
	@GetOneDecorator(CatDto, Cat.name, [JsonApi, Hal], { add: [], exclude: [] })
	async getOne(
		response: e.Response,
		request: e.Request,
		id: string,
		fields?: Array<string>,
		accept?: string,
	): Promise<JsonOf<CatDto>> {
		// biome-ignore lint/style/noNonNullAssertion:
		return super.getOne!(response, request, id, ["age", "name"], accept);
	}
}
