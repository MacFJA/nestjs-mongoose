import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CatController, DogController } from "./app.controller";
import { AppService } from "./app.service";
import { Cat, CatSchema } from "./cat.schema";

@Module({
	imports: [
		MongooseModule.forRoot("mongodb://root:root@localhost:27017/gooseapi?authSource=admin"),
		MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
	],
	controllers: [/*AppController,*/ DogController, CatController],
	providers: [AppService],
})
export class AppModule {}
