import { MongooseControllerFactory } from "@macfja/nestjs-mongoose";
import { Controller, Get } from "@nestjs/common";
import { Cat } from "./cat.schema";
import { DogConverter } from "./dog.converter";
import { DogDto } from "./dog.dto";

@Controller()
export class AppController {
	@Get()
	getHello(): string {
		console.log(Reflect.getMetadata("swagger/apiModelPropertiesArray", DogDto.prototype));
		console.log(Reflect.getMetadataKeys(DogDto.prototype));
		console.log(Reflect.getPrototypeOf(DogDto));
		return "hello";
	}
}

@Controller("/dogs")
export class DogController extends MongooseControllerFactory(Cat.name, new DogConverter(), DogDto) {}
