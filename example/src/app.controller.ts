import {
	GetOneDecorator,
	Hal,
	JsonApi,
	JsonLdFactory,
	type JsonObject,
	MongooseControllerFactory,
	SimpleJson,
	ValueOperator,
} from "@macfja/nestjs-mongoose";
import { Controller, Logger } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type e from "express";
import { CatConverter } from "./cat.converter";
import { CatDto } from "./cat.dto";
import { Cat } from "./cat.schema";
import { DogDto, DogFakerConverter } from "./dogfaker";

// @Controller()
// export class AppController {
// 	constructor(private readonly appService: AppService) {}
//
// 	@Get()
// 	getHello(): string {
// 		return this.appService.getHello();
// 	}
// }

@Controller("dogs")
@ApiTags("Dog Api")
export class DogController extends MongooseControllerFactory(
	Cat.name,
	new DogFakerConverter(),

	DogDto,
	undefined,
	undefined,

	{
		disable: {
			delete: true,
		},
		resourceType: "dogs",
		logger: new Logger("CC"),
		operators: [ValueOperator.LOWER_OR_EQUALS, ValueOperator.EQUALS, ValueOperator.IS_NULL],
	},
) {
	@GetOneDecorator(DogDto, "dogs", [JsonApi, Hal, SimpleJson])
	async getOne(response: e.Response, request: e.Request, id: string, fields?: unknown): Promise<JsonObject> {
		console.log(id);
		return super.getOne(response, request, id, fields);
	}
}

@Controller("cats")
@ApiTags("Cat Api")
export class CatController extends MongooseControllerFactory(Cat.name, new CatConverter(), CatDto, CatDto, CatDto, {
	representations: [SimpleJson, Hal, JsonApi, JsonLdFactory("ex")],
}) {}
