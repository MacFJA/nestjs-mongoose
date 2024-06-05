import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController, DogController } from "./app.controller";
import { Cat, CatSchema } from "./cat.schema";

@Module({
	imports: [
		MongooseModule.forRoot("mongodb://root:root@mongo:27017/nestjs_mongoose?authSource=admin"),
		MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
	],
	controllers: [AppController, DogController],
})
export class AppModule {}
